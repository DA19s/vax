const prisma = require("../config/prismaClient");
const { generateAccessCode } = require("../utils/accessCode");
const { sendParentAccessCode, sendVerificationCode } = require("../services/notification");
const tokenService = require("../services/tokenService");
const bcrypt = require("bcryptjs");

/**
 * POST /api/mobile/request-verification-code
 * Demande un code de vérification par WhatsApp avant l'inscription
 */
const requestVerificationCode = async (req, res, next) => {
  try {
    const {
      parentPhone,
      parentEmail,
      childFirstName,
      childLastName,
      childBirthDate,
      childGender,
      birthPlace,
      fatherName,
      motherName,
      address,
      healthCenterId,
    } = req.body;

    // Validation
    if (!parentPhone || !childFirstName || !childLastName || !childBirthDate || !childGender || !birthPlace || !fatherName || !motherName || !address) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis",
      });
    }

    // Supprimer uniquement les anciennes inscriptions en attente pour ce numéro
    // (un parent peut avoir plusieurs enfants, donc on ne bloque pas les comptes existants)
    await prisma.children.deleteMany({
      where: {
        phoneParent: parentPhone,
        code: { startsWith: "VERIFY_" }, // En attente de vérification
      },
    });

    // Utiliser le healthCenterId fourni ou trouver un par défaut
    let healthCenter;
    if (healthCenterId) {
      healthCenter = await prisma.healthCenter.findUnique({
        where: { id: healthCenterId },
        select: { id: true },
      });
    }

    if (!healthCenter) {
      // Si le healthCenter fourni n'existe pas ou n'est pas fourni, prendre le premier disponible
      healthCenter = await prisma.healthCenter.findFirst({
        select: { id: true },
      });
    }

    if (!healthCenter) {
      return res.status(400).json({
        success: false,
        message: "Aucun centre de santé disponible. Contactez un agent pour enregistrer votre enfant.",
      });
    }

    // Générer un code de vérification à 6 chiffres
    const verificationCode = generateAccessCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Créer l'enfant avec le code de vérification (format: VERIFY_CODE_EXPIRESAT)
    const child = await prisma.children.create({
      data: {
        firstName: childFirstName,
        lastName: childLastName,
        birthDate: new Date(childBirthDate),
        birthPlace: birthPlace,
        address: address,
        gender: childGender.toUpperCase(),
        healthCenterId: healthCenter.id,
        status: "A_JOUR",
        emailParent: parentEmail || "",
        phoneParent: parentPhone,
        fatherName: fatherName,
        motherName: motherName,
        code: `VERIFY_${verificationCode}_${expiresAt.getTime()}`, // Stocker le code et l'expiration
        passwordParent: "0000", // PIN par défaut
      },
    });

    // Envoyer le code par WhatsApp
    await sendVerificationCode({
      to: parentPhone,
      parentName: fatherName || motherName || "Parent",
      verificationCode,
    });

    res.json({
      success: true,
      message: "Code de vérification envoyé par WhatsApp",
      registrationId: child.id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mobile/parent-register
 * Vérifie le code et active le compte parent/enfant
 */
const parentRegister = async (req, res, next) => {
  try {
    const {
      registrationId,
      verificationCode,
    } = req.body;

    if (!registrationId || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: "registrationId et verificationCode requis",
      });
    }

    // Récupérer l'enfant en attente de vérification
    const child = await prisma.children.findUnique({
      where: { id: registrationId },
    });

    if (!child || !child.code || !child.code.startsWith("VERIFY_")) {
      return res.status(404).json({
        success: false,
        message: "Inscription introuvable ou expirée",
      });
    }

    // Extraire le code et la date d'expiration du champ code
    const codeParts = child.code.split("_");
    if (codeParts.length !== 3) {
      await prisma.children.delete({ where: { id: registrationId } });
      return res.status(400).json({
        success: false,
        message: "Format de code invalide. Veuillez recommencer.",
      });
    }

    const storedCode = codeParts[1];
    const expiresAt = parseInt(codeParts[2]);

    // Vérifier l'expiration
    if (Date.now() > expiresAt) {
      await prisma.children.delete({ where: { id: registrationId } });
      return res.status(400).json({
        success: false,
        message: "Le code de vérification a expiré. Veuillez recommencer.",
      });
    }

    // Vérifier le code
    if (storedCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: "Code de vérification incorrect",
      });
    }

    // Le code est valide, activer le compte
    const now = new Date();
    const birth = new Date(child.birthDate);
    const ageInDays = Math.floor((now.getTime() - birth.getTime()) / 86400000);
    const ageInWeeks = Math.floor(ageInDays / 7);
    const ageInMonths = Math.floor(ageInDays / 30.4375);
    const ageInYears = Math.floor(ageInDays / 365.25);

    const getAgeByUnit = (unit) => {
      switch (unit) {
        case "WEEKS":
          return ageInWeeks;
        case "MONTHS":
          return ageInMonths;
        case "YEARS":
          return ageInYears;
        default:
          return ageInWeeks;
      }
    };

    const computeDueDate = (unit, value) => {
      const result = new Date(birth);
      if (unit === "WEEKS") {
        result.setDate(result.getDate() + value * 7);
      } else if (unit === "MONTHS") {
        result.setMonth(result.getMonth() + value);
      } else if (unit === "YEARS") {
        result.setFullYear(result.getFullYear() + value);
      } else {
        result.setDate(result.getDate() + value);
      }
      return result;
    };

    // Générer un code d'accès pour l'enfant
    const accessCode = generateAccessCode(6);

    const calendarEntries = await prisma.vaccineCalendar.findMany({
      include: { vaccines: true },
    });

    let updatedChildId;

    await prisma.$transaction(async (tx) => {
      // Mettre à jour l'enfant : remplacer le code de vérification par le code d'accès
      const updatedChild = await tx.children.update({
        where: { id: registrationId },
        data: {
          code: accessCode, // Remplacer le code de vérification par le code d'accès
        },
      });
      
      updatedChildId = updatedChild.id;

      // Créer les entrées de calendrier vaccinal
      const duePayload = [];
      const latePayload = [];
      let hasLate = false;

      for (const entry of calendarEntries) {
        const age = getAgeByUnit(entry.ageUnit);
        const dueDate =
          entry.specificAge != null
            ? computeDueDate(entry.ageUnit, entry.specificAge)
            : computeDueDate(entry.ageUnit, entry.maxAge);

        const isWithinRange =
          entry.specificAge != null
            ? age === entry.specificAge
            : age >= entry.minAge && age <= entry.maxAge;

        const isPastRange =
          entry.specificAge != null
            ? age > entry.specificAge
            : age > entry.maxAge;

        if (isWithinRange) {
          for (const vaccine of entry.vaccines) {
            duePayload.push({
              childId: updatedChildId,
              vaccineCalendarId: entry.id,
              vaccineId: vaccine.id,
              scheduledFor: dueDate,
              dose: 1,
            });
          }
        } else if (isPastRange) {
          hasLate = true;
          for (const vaccine of entry.vaccines) {
            latePayload.push({
              childId: updatedChildId,
              vaccineCalendarId: entry.id,
              vaccineId: vaccine.id,
              dueDate: dueDate,
              dose: 1,
            });
          }
        }
      }

      if (duePayload.length > 0) {
        await tx.childVaccineDue.createMany({
          data: duePayload,
        });
      }

      if (latePayload.length > 0) {
        await tx.childVaccineLate.createMany({
          data: latePayload,
        });
      }

      if (hasLate) {
        await tx.children.update({
          where: { id: updatedChildId },
          data: { status: "PAS_A_JOUR" },
        });
      }
    });

    if (!updatedChildId) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour du compte",
      });
    }

    // Récupérer l'enfant complet avec toutes les relations
    const fullChild = await prisma.children.findUnique({
      where: { id: updatedChildId },
      include: {
        healthCenter: {
          select: {
            name: true,
            district: {
              select: {
                name: true,
                commune: {
                  select: {
                    region: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        completedVaccines: {
          include: { vaccine: { select: { name: true } } },
        },
        dueVaccines: {
          include: {
            vaccine: { select: { name: true } },
            vaccineCalendar: {
              select: {
                ageUnit: true,
                specificAge: true,
                minAge: true,
                maxAge: true,
              },
            },
          },
        },
        scheduledVaccines: {
          include: {
            vaccine: { select: { name: true } },
            planner: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        lateVaccines: {
          include: { vaccine: { select: { name: true } } },
        },
        overdueVaccines: {
          include: { vaccine: { select: { name: true } } },
        },
      },
    });

    // Envoyer le code d'accès par WhatsApp
    await sendParentAccessCode({
      to: child.phoneParent,
      parentName: child.fatherName || child.motherName || "",
      childName: `${child.firstName} ${child.lastName}`,
      accessCode: accessCode,
    });

    if (!fullChild) {
      return res.status(404).json({
        success: false,
        message: "Enfant non trouvé après activation",
      });
    }

    // Générer un token JWT pour le parent
    const token = tokenService.signAccessToken({
      sub: fullChild.id,
      type: "parent",
      phone: child.phoneParent,
    });

    res.status(201).json({
      success: true,
      token,
      child: {
        id: fullChild.id,
        firstName: fullChild.firstName,
        lastName: fullChild.lastName,
        name: `${fullChild.firstName} ${fullChild.lastName}`.trim(),
        gender: fullChild.gender,
        birthDate: fullChild.birthDate,
        parentPhone: fullChild.phoneParent,
        parentName: fullChild.fatherName || fullChild.motherName || "",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mobile/verify-access-code
 * Vérification du code d'accès et génération d'un token
 */
const verifyAccessCode = async (req, res, next) => {
  try {
    const { phone, accessCode } = req.body;

    if (!phone || !accessCode) {
      return res.status(400).json({
        success: false,
        message: "Numéro de téléphone et code d'accès requis",
      });
    }

    // Trouver l'enfant avec ce numéro et ce code
    const child = await prisma.children.findFirst({
      where: {
        phoneParent: phone,
        code: accessCode,
      },
      include: {
        healthCenter: {
          select: {
            name: true,
            district: {
              select: {
                name: true,
                commune: {
                  select: {
                    region: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!child) {
      return res.status(401).json({
        success: false,
        message: "Code d'accès invalide",
      });
    }

    // Vérifier si le parent a déjà un PIN (passwordParent !== "0000")
    const hasPin = child.passwordParent && child.passwordParent !== "0000";

    // Générer un token JWT
    const token = tokenService.signAccessToken({
      sub: child.id,
      type: "parent",
      phone: phone,
    });

    res.json({
      success: true,
      token,
      hasPin,
      child: {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        name: `${child.firstName} ${child.lastName}`.trim(),
        gender: child.gender,
        birthDate: child.birthDate,
        parentPhone: child.phoneParent,
        parentName: child.fatherName || child.motherName || "",
        region: child.healthCenter?.district?.commune?.region?.name ?? "",
        district: child.healthCenter?.district?.name ?? "",
        healthCenter: child.healthCenter?.name ?? "",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mobile/parent-login
 * Connexion avec numéro de téléphone et PIN
 */
const parentLogin = async (req, res, next) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({
        success: false,
        message: "Numéro de téléphone et PIN requis",
      });
    }

    // Trouver tous les enfants avec ce numéro de téléphone
    const children = await prisma.children.findMany({
      where: {
        phoneParent: phone,
      },
      include: {
        healthCenter: {
          select: {
            name: true,
            district: {
              select: {
                name: true,
                commune: {
                  select: {
                    region: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (children.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Aucun compte trouvé avec ce numéro de téléphone",
      });
    }

    // Vérifier le PIN pour chaque enfant
    const validChildren = [];
    for (const child of children) {
      if (child.passwordParent && child.passwordParent !== "0000") {
        // Vérifier le PIN avec bcrypt
        const isPinValid = await bcrypt.compare(pin, child.passwordParent);
        if (isPinValid) {
          validChildren.push({
            id: child.id,
            firstName: child.firstName,
            lastName: child.lastName,
            name: `${child.firstName} ${child.lastName}`.trim(),
            gender: child.gender,
            birthDate: child.birthDate,
            parentPhone: child.phoneParent,
            parentName: child.fatherName || child.motherName || "",
            region: child.healthCenter?.district?.commune?.region?.name ?? "",
            district: child.healthCenter?.district?.name ?? "",
            healthCenter: child.healthCenter?.name ?? "",
          });
        }
      }
    }

    if (validChildren.length === 0) {
      return res.status(401).json({
        success: false,
        message: "PIN incorrect",
      });
    }

    // Si un seul enfant, retourner directement avec token
    if (validChildren.length === 1) {
      const token = tokenService.signAccessToken({
        sub: validChildren[0].id,
        type: "parent",
        phone: phone,
      });

      return res.json({
        success: true,
        token,
        child: validChildren[0],
        children: null, // Pas besoin de sélection
      });
    }

    // Si plusieurs enfants, retourner la liste pour sélection
    const token = tokenService.signAccessToken({
      sub: phone, // Utiliser le téléphone comme sub temporaire
      type: "parent",
      phone: phone,
    });

    res.json({
      success: true,
      token,
      children: validChildren,
      child: null, // Nécessite une sélection
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mobile/parent-pin/save
 * Sauvegarder le PIN et supprimer le code d'accès
 */
const saveParentPin = async (req, res, next) => {
  try {
    const { childId, parentPhone, pin } = req.body;

    if (!childId || !parentPhone || !pin || pin.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "childId, parentPhone et PIN (4 chiffres) requis",
      });
    }

    // Vérifier que l'enfant existe et correspond au numéro
    const child = await prisma.children.findUnique({
      where: { id: childId },
    });

    if (!child || child.phoneParent !== parentPhone) {
      return res.status(404).json({
        success: false,
        message: "Enfant non trouvé",
      });
    }

    // Hasher le PIN avec bcrypt
    const hashedPin = await bcrypt.hash(pin, 10);

    // Mettre à jour le PIN et supprimer le code d'accès
    await prisma.children.update({
      where: { id: childId },
      data: {
        passwordParent: hashedPin,
        code: null, // Supprimer le code d'accès
      },
    });

    res.json({
      success: true,
      message: "PIN sauvegardé avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mobile/parent-pin/verify
 * Vérifier le PIN
 */
const verifyParentPin = async (req, res, next) => {
  try {
    const { childId, parentPhone, pin } = req.body;

    if (!childId || !parentPhone || !pin) {
      return res.status(400).json({
        success: false,
        message: "childId, parentPhone et PIN requis",
      });
    }

    // Trouver l'enfant
    const child = await prisma.children.findUnique({
      where: { id: childId },
      include: {
        healthCenter: {
          select: {
            name: true,
            district: {
              select: {
                name: true,
                commune: {
                  select: {
                    region: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!child || child.phoneParent !== parentPhone) {
      return res.status(404).json({
        success: false,
        message: "Enfant non trouvé",
      });
    }

    // Vérifier le PIN
    if (!child.passwordParent || child.passwordParent === "0000") {
      return res.status(401).json({
        success: false,
        message: "PIN non configuré",
      });
    }

    const isPinValid = await bcrypt.compare(pin, child.passwordParent);

    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        message: "PIN incorrect",
      });
    }

    // Générer un token
    const token = tokenService.signAccessToken({
      sub: child.id,
      type: "parent",
      phone: parentPhone,
    });

    res.json({
      success: true,
      token,
      child: {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        name: `${child.firstName} ${child.lastName}`.trim(),
        gender: child.gender,
        birthDate: child.birthDate,
        parentPhone: child.phoneParent,
        parentName: child.fatherName || child.motherName || "",
        region: child.healthCenter?.district?.commune?.region?.name ?? "",
        district: child.healthCenter?.district?.name ?? "",
        healthCenter: child.healthCenter?.name ?? "",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mobile/regions
 * Obtenir la liste des régions (pour les parents)
 */
const getRegions = async (req, res, next) => {
  try {
    const regions = await prisma.region.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });

    res.json({
      total: regions.length,
      items: regions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mobile/health-centers
 * Obtenir la liste des centres de santé (pour les parents)
 * Query params: ?regionId=xxx pour filtrer par région
 */
const getHealthCenters = async (req, res, next) => {
  try {
    const { regionId } = req.query;

    const whereClause = {};
    
    if (regionId) {
      whereClause.district = {
        commune: {
          regionId: regionId,
        },
      };
    }

    const centers = await prisma.healthCenter.findMany({
      where: whereClause,
      include: {
        district: {
          select: {
            id: true,
            name: true,
            commune: {
              select: {
                id: true,
                name: true,
                region: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formattedCenters = centers.map((center) => ({
      id: center.id,
      name: center.name,
      address: center.address,
      regionId: center.district?.commune?.region?.id ?? "",
      region: center.district?.commune?.region?.name ?? "",
      commune: center.district?.commune?.name ?? "",
      district: center.district?.name ?? "",
    }));

    res.json({
      total: formattedCenters.length,
      items: formattedCenters,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mobile/vaccine-calendar
 * Obtenir le calendrier vaccinal (pour les parents)
 */
const getVaccineCalendar = async (req, res, next) => {
  try {
    const calendars = await prisma.vaccineCalendar.findMany({
      include: { vaccines: true },
      orderBy: [
        { ageUnit: "asc" },
        { specificAge: "asc" },
        { minAge: "asc" },
      ],
    });

    const formattedCalendars = calendars.map((calendar) => ({
      id: calendar.id,
      description: calendar.description,
      ageUnit: calendar.ageUnit,
      specificAge: calendar.specificAge,
      minAge: calendar.minAge,
      maxAge: calendar.maxAge,
      vaccines: calendar.vaccines.map((vaccine) => ({
        id: vaccine.id,
        name: vaccine.name,
        dosesRequired: vaccine.dosesRequired,
      })),
    }));

    res.json(formattedCalendars);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mobile/children/:childId/mark-vaccines-done
 * Marquer des vaccins comme effectués (pour les parents lors de l'inscription)
 */
const markVaccinesDone = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { vaccines } = req.body;

    if (!vaccines || !Array.isArray(vaccines)) {
      return res.status(400).json({
        success: false,
        message: "vaccines doit être un tableau",
      });
    }

    // Vérifier que l'enfant existe
    const child = await prisma.children.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Enfant non trouvé",
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const vaccineData of vaccines) {
        const { vaccineCalendarId, vaccineId, dose = 1 } = vaccineData;

        if (!vaccineId) {
          continue; // Ignorer si vaccineId manquant
        }

        // Vérifier si le vaccin est déjà marqué comme complété
        const existing = await tx.childVaccineCompleted.findFirst({
          where: {
            childId,
            vaccineId,
            dose,
            ...(vaccineCalendarId ? { vaccineCalendarId } : {}),
          },
        });

        if (existing) {
          continue; // Déjà complété, passer au suivant
        }

        // Créer l'entrée de vaccin complété
        await tx.childVaccineCompleted.create({
          data: {
            childId,
            vaccineId,
            vaccineCalendarId: vaccineCalendarId || null,
            dose,
            administeredAt: new Date(),
            // administeredById peut être null pour les vaccins marqués par les parents
            administeredById: null,
          },
        });

        // Supprimer les entrées correspondantes dans due, late, overdue
        await tx.childVaccineDue.deleteMany({
          where: {
            childId,
            vaccineId,
            dose,
            ...(vaccineCalendarId ? { vaccineCalendarId } : {}),
          },
        });

        await tx.childVaccineLate.deleteMany({
          where: {
            childId,
            vaccineId,
            dose,
            ...(vaccineCalendarId ? { vaccineCalendarId } : {}),
          },
        });

        await tx.childVaccineOverdue.deleteMany({
          where: {
            childId,
            vaccineId,
            dose,
          },
        });
      }

      // Mettre à jour le statut de l'enfant si nécessaire
      const hasLateOrOverdue = await tx.childVaccineLate.count({
        where: { childId },
      }) > 0 || await tx.childVaccineOverdue.count({
        where: { childId },
      }) > 0;

      await tx.children.update({
        where: { id: childId },
        data: {
          status: hasLateOrOverdue ? "PAS_A_JOUR" : "A_JOUR",
        },
      });
    });

    res.json({
      success: true,
      message: "Vaccins marqués comme effectués",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestVerificationCode,
  parentRegister,
  verifyAccessCode,
  parentLogin,
  saveParentPin,
  verifyParentPin,
  getRegions,
  getHealthCenters,
  getVaccineCalendar,
  markVaccinesDone,
};

