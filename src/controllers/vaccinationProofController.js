const prisma = require("../config/prismaClient");
const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "../../uploads/vaccination-proofs");

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/children/:childId/vaccination-proofs
 * Upload une ou plusieurs preuves de vaccination pour un enfant
 */
const uploadVaccinationProofs = async (req, res, next) => {
  try {
    const { childId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Aucun fichier fourni",
      });
    }

    // Vérifier que l'enfant existe
    const child = await prisma.children.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!child) {
      return res.status(404).json({
        message: "Enfant non trouvé",
      });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      // Vérifier le type MIME
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
          message: `Type de fichier non autorisé: ${file.mimetype}. Types autorisés: JPEG, PNG, WebP, PDF`,
        });
      }

      // Vérifier la taille
      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          message: `Fichier trop volumineux: ${file.originalname}. Taille maximale: 10MB`,
        });
      }

      // Générer un nom de fichier unique
      const fileExt = path.extname(file.originalname);
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
      const filePath = path.join(UPLOAD_DIR, uniqueFileName);

      // Déplacer le fichier du dossier temporaire vers le dossier de destination
      fs.renameSync(file.path, filePath);

      // Enregistrer dans la base de données
      const proof = await prisma.childVaccinationProof.create({
        data: {
          childId,
          filePath: `uploads/vaccination-proofs/${uniqueFileName}`,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
        },
      });

      uploadedFiles.push({
        id: proof.id,
        fileName: proof.fileName,
        fileSize: proof.fileSize,
        mimeType: proof.mimeType,
        uploadedAt: proof.uploadedAt,
      });
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
      files: uploadedFiles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/children/:childId/vaccination-proofs
 * Récupère toutes les preuves de vaccination d'un enfant
 */
const getVaccinationProofs = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const proofs = await prisma.childVaccinationProof.findMany({
      where: { childId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      proofs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/vaccination-proofs/:proofId/file
 * Récupère le fichier d'une preuve de vaccination
 */
const getProofFile = async (req, res, next) => {
  try {
    const { proofId } = req.params;

    const proof = await prisma.childVaccinationProof.findUnique({
      where: { id: proofId },
      select: {
        filePath: true,
        fileName: true,
        mimeType: true,
        child: {
          select: {
            id: true,
            healthCenter: {
              select: {
                district: {
                  select: {
                    commune: {
                      select: {
                        region: {
                          select: {
                            id: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!proof) {
      return res.status(404).json({
        message: "Preuve de vaccination non trouvée",
      });
    }

    // Vérifier l'accès (seuls les agents du même centre, district, région ou national peuvent voir)
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "Non authentifié",
      });
    }

    const child = proof.child;
    if (!child) {
      return res.status(404).json({
        message: "Enfant non trouvé",
      });
    }

    let hasAccess = false;

    if (user.role === "NATIONAL") {
      hasAccess = true;
    } else if (user.role === "REGIONAL") {
      const regionId = child.healthCenter?.district?.commune?.region?.id;
      hasAccess = user.regionId === regionId;
    } else if (user.role === "DISTRICT") {
      const districtId = child.healthCenter?.districtId;
      hasAccess = user.districtId === districtId;
    } else if (user.role === "AGENT") {
      hasAccess = user.healthCenterId === child.healthCenterId;
    }

    if (!hasAccess) {
      return res.status(403).json({
        message: "Accès refusé",
      });
    }

    const fullPath = path.join(__dirname, "../../", proof.filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        message: "Fichier non trouvé sur le serveur",
      });
    }

    res.setHeader("Content-Type", proof.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(proof.fileName)}"`,
    );

    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/vaccination-proofs/:proofId
 * Supprime une preuve de vaccination
 */
const deleteProof = async (req, res, next) => {
  try {
    const { proofId } = req.params;

    const proof = await prisma.childVaccinationProof.findUnique({
      where: { id: proofId },
      include: {
        child: {
          select: {
            id: true,
            healthCenter: {
              select: {
                district: {
                  select: {
                    commune: {
                      select: {
                        region: {
                          select: {
                            id: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!proof) {
      return res.status(404).json({
        message: "Preuve de vaccination non trouvée",
      });
    }

    // Vérifier l'accès (seuls les agents du même centre, district, région ou national peuvent supprimer)
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "Non authentifié",
      });
    }

    const child = proof.child;
    if (!child) {
      return res.status(404).json({
        message: "Enfant non trouvé",
      });
    }

    let hasAccess = false;

    if (user.role === "NATIONAL") {
      hasAccess = true;
    } else if (user.role === "REGIONAL") {
      const regionId = child.healthCenter?.district?.commune?.region?.id;
      hasAccess = user.regionId === regionId;
    } else if (user.role === "DISTRICT") {
      const districtId = child.healthCenter?.districtId;
      hasAccess = user.districtId === districtId;
    } else if (user.role === "AGENT") {
      hasAccess = user.healthCenterId === child.healthCenterId;
    }

    if (!hasAccess) {
      return res.status(403).json({
        message: "Accès refusé",
      });
    }

    // Supprimer le fichier du système de fichiers
    const fullPath = path.join(__dirname, "../../", proof.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Supprimer l'entrée de la base de données
    await prisma.childVaccinationProof.delete({
      where: { id: proofId },
    });

    res.json({
      success: true,
      message: "Preuve de vaccination supprimée avec succès",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadVaccinationProofs,
  getVaccinationProofs,
  getProofFile,
  deleteProof,
};

