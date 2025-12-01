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

        // Vérifier si l'enfant est dans la plage d'âge (minAge à maxAge)
        // Le specificAge est utilisé uniquement pour calculer la date cible, pas pour l'éligibilité
        const isWithinRange = age >= entry.minAge && age <= entry.maxAge;

        // Vérifier si l'enfant a dépassé la plage d'âge
        const isPastRange = age > entry.maxAge;

        if (isWithinRange) {
          for (const vaccine of entry.vaccines) {
            // Créer une entrée pour chaque dose requise
            const dosesRequired = Number.parseInt(vaccine.dosesRequired ?? "1", 10) || 1;
            for (let dose = 1; dose <= dosesRequired; dose++) {
              duePayload.push({
                childId: updatedChildId,
                vaccineCalendarId: entry.id,
                vaccineId: vaccine.id,
                scheduledFor: dueDate,
                dose,
              });
            }
          }
        } else if (isPastRange) {
          hasLate = true;
          for (const vaccine of entry.vaccines) {
            // Créer une entrée pour chaque dose requise
            const dosesRequired = Number.parseInt(vaccine.dosesRequired ?? "1", 10) || 1;
            for (let dose = 1; dose <= dosesRequired; dose++) {
              latePayload.push({
                childId: updatedChildId,
                vaccineCalendarId: entry.id,
                vaccineId: vaccine.id,
                dueDate: dueDate,
                dose,
              });
            }
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

        // Supprimer uniquement l'entrée correspondant à la dose complétée
        // (pas toutes les doses du vaccin)
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

        // Vérifier si toutes les doses requises du vaccin sont complétées
        const vaccine = await tx.vaccine.findUnique({
          where: { id: vaccineId },
          select: { dosesRequired: true },
        });

        const dosesRequired = vaccine?.dosesRequired 
          ? parseInt(vaccine.dosesRequired, 10) 
          : 1;
        const totalDoses = isFinite(dosesRequired) && dosesRequired > 0 ? dosesRequired : 1;

        // Compter les doses complétées pour ce vaccin
        const completedCount = await tx.childVaccineCompleted.count({
          where: {
            childId,
            vaccineId,
          },
        });

        // Si toutes les doses sont complétées, supprimer toutes les entrées restantes
        // (au cas où il y aurait des entrées pour d'autres doses qui n'ont pas été supprimées)
        if (completedCount >= totalDoses) {
          await tx.childVaccineDue.deleteMany({
            where: {
              childId,
              vaccineId,
            },
          });

          await tx.childVaccineLate.deleteMany({
            where: {
              childId,
              vaccineId,
            },
          });

          await tx.childVaccineOverdue.deleteMany({
            where: {
              childId,
              vaccineId,
            },
          });
        }
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

/**
 * GET /api/mobile/children/:childId/dashboard
 * Obtenir toutes les données du dashboard pour un enfant
 */
const getChildDashboard = async (req, res, next) => {
  try {
    const { childId } = req.params;

    // Vérifier que l'enfant existe et que le parent a accès
    const child = await prisma.children.findUnique({
      where: { id: childId },
      include: {
        healthCenter: {
          select: {
            id: true,
            name: true,
            address: true,
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
        },
        dueVaccines: {
          include: {
            vaccine: { select: { id: true, name: true, dosesRequired: true } },
            vaccineCalendar: {
              select: {
                id: true,
                description: true,
                ageUnit: true,
                specificAge: true,
                minAge: true,
                maxAge: true,
              },
            },
          },
          orderBy: { scheduledFor: "asc" },
        },
        scheduledVaccines: {
          include: {
            vaccine: { select: { id: true, name: true, dosesRequired: true } },
            planner: {
              select: { id: true, firstName: true, lastName: true },
            },
            vaccineCalendar: {
              select: {
                id: true,
                description: true,
              },
            },
          },
          orderBy: { scheduledFor: "asc" },
        },
        lateVaccines: {
          include: {
            vaccine: { select: { id: true, name: true, dosesRequired: true } },
            vaccineCalendar: {
              select: {
                id: true,
                description: true,
                ageUnit: true,
                specificAge: true,
                minAge: true,
                maxAge: true,
              },
            },
          },
          orderBy: { dueDate: "asc" },
        },
        overdueVaccines: {
          include: {
            vaccine: { select: { id: true, name: true, dosesRequired: true } },
            vaccineCalendar: {
              select: {
                id: true,
                description: true,
              },
            },
          },
          orderBy: { dueDate: "asc" },
        },
        completedVaccines: {
          include: {
            vaccine: { select: { id: true, name: true, dosesRequired: true } },
            administeredBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            vaccineCalendar: {
              select: {
                id: true,
                description: true,
              },
            },
          },
          orderBy: { administeredAt: "desc" },
        },
      },
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Enfant non trouvé",
      });
    }

    // L'accès est déjà vérifié par le middleware requireMobileAuth

    // Calculer l'âge de l'enfant
    const now = new Date();
    const birth = new Date(child.birthDate);
    const ageInDays = Math.floor((now.getTime() - birth.getTime()) / 86400000);
    const ageInWeeks = Math.floor(ageInDays / 7);
    const ageInMonths = Math.floor(ageInDays / 30.4375);
    const ageInYears = Math.floor(ageInDays / 365.25);

    res.json({
      success: true,
      child: {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        name: `${child.firstName} ${child.lastName}`.trim(),
        gender: child.gender,
        birthDate: child.birthDate,
        birthPlace: child.birthPlace,
        address: child.address,
        status: child.status,
        parentName: child.fatherName || child.motherName || "",
        parentPhone: child.phoneParent,
        fatherName: child.fatherName,
        motherName: child.motherName,
        nextAppointment: child.nextAppointment,
        healthCenter: {
          id: child.healthCenter.id,
          name: child.healthCenter.name,
          address: child.healthCenter.address,
          region: child.healthCenter.district?.commune?.region?.name ?? "",
          district: child.healthCenter.district?.name ?? "",
        },
        age: {
          days: ageInDays,
          weeks: ageInWeeks,
          months: ageInMonths,
          years: ageInYears,
        },
      },
      vaccinations: {
        due: child.dueVaccines.map((entry) => ({
          id: entry.id,
          vaccineId: entry.vaccineId,
          vaccineName: entry.vaccine.name,
          dosesRequired: entry.vaccine.dosesRequired,
          scheduledFor: entry.scheduledFor,
          calendarId: entry.vaccineCalendarId,
          calendarDescription: entry.vaccineCalendar?.description ?? null,
          ageUnit: entry.vaccineCalendar?.ageUnit ?? null,
          specificAge: entry.vaccineCalendar?.specificAge ?? null,
          minAge: entry.vaccineCalendar?.minAge ?? null,
          maxAge: entry.vaccineCalendar?.maxAge ?? null,
          dose: entry.dose ?? 1,
        })),
        scheduled: child.scheduledVaccines.map((entry) => ({
          id: entry.id,
          vaccineId: entry.vaccineId,
          vaccineName: entry.vaccine.name,
          dosesRequired: entry.vaccine.dosesRequired,
          scheduledFor: entry.scheduledFor,
          plannerId: entry.plannerId,
          plannerName: entry.planner
            ? `${entry.planner.firstName ?? ""} ${entry.planner.lastName ?? ""}`.trim()
            : null,
          calendarId: entry.vaccineCalendarId,
          calendarDescription: entry.vaccineCalendar?.description ?? null,
          dose: entry.dose ?? 1,
        })),
        late: child.lateVaccines.map((entry) => ({
          id: entry.id,
          vaccineId: entry.vaccineId,
          vaccineName: entry.vaccine.name,
          dosesRequired: entry.vaccine.dosesRequired,
          dueDate: entry.dueDate,
          calendarId: entry.vaccineCalendarId,
          calendarDescription: entry.vaccineCalendar?.description ?? null,
          ageUnit: entry.vaccineCalendar?.ageUnit ?? null,
          specificAge: entry.vaccineCalendar?.specificAge ?? null,
          minAge: entry.vaccineCalendar?.minAge ?? null,
          maxAge: entry.vaccineCalendar?.maxAge ?? null,
          dose: entry.dose ?? 1,
        })),
        overdue: child.overdueVaccines.map((entry) => ({
          id: entry.id,
          vaccineId: entry.vaccineId,
          vaccineName: entry.vaccine.name,
          dosesRequired: entry.vaccine.dosesRequired,
          dueDate: entry.dueDate,
          calendarId: entry.vaccineCalendarId,
          calendarDescription: entry.vaccineCalendar?.description ?? null,
          dose: entry.dose ?? 1,
        })),
        completed: child.completedVaccines.map((entry) => ({
          id: entry.id,
          vaccineId: entry.vaccineId,
          vaccineName: entry.vaccine.name,
          dosesRequired: entry.vaccine.dosesRequired,
          administeredAt: entry.administeredAt,
          administeredById: entry.administeredById,
          administeredByName: entry.administeredBy
            ? `${entry.administeredBy.firstName ?? ""} ${entry.administeredBy.lastName ?? ""}`.trim()
            : null,
          calendarId: entry.vaccineCalendarId,
          calendarDescription: entry.vaccineCalendar?.description ?? null,
          dose: entry.dose ?? 1,
        })),
      },
      stats: {
        totalDue: child.dueVaccines.length,
        totalScheduled: child.scheduledVaccines.length,
        totalLate: child.lateVaccines.length,
        totalOverdue: child.overdueVaccines.length,
        totalCompleted: child.completedVaccines.length,
      },
      // Ajouter le nombre de notifications non lues
      unreadNotifications: await prisma.notification.count({
        where: {
          childId: childId,
          isRead: false,
        },
      }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mobile/advice
 * Obtenir les conseils pour un enfant (filtrés par âge)
 * Query params: ?childId=xxx (optionnel, pour filtrer par âge de l'enfant)
 */
const getAdvice = async (req, res, next) => {
  try {
    const { childId } = req.query;

    let ageInWeeks = null;
    let ageInMonths = null;
    let ageInYears = null;
    let ageUnit = null;

    // Si childId est fourni, calculer l'âge de l'enfant
    if (childId) {
      const child = await prisma.children.findUnique({
        where: { id: childId },
        select: { birthDate: true },
      });

      if (child) {
        const now = new Date();
        const birth = new Date(child.birthDate);
        const ageInDays = Math.floor((now.getTime() - birth.getTime()) / 86400000);
        ageInWeeks = Math.floor(ageInDays / 7);
        ageInMonths = Math.floor(ageInDays / 30.4375);
        ageInYears = Math.floor(ageInDays / 365.25);
      }
    }

    // Construire la requête pour filtrer les conseils
    const whereClause = {
      isActive: true,
    };

    // Si on a l'âge de l'enfant, filtrer les conseils pertinents
    if (ageInWeeks !== null || ageInMonths !== null || ageInYears !== null) {
      whereClause.OR = [];

      // Conseils sans restriction d'âge
      whereClause.OR.push({
        ageUnit: null,
        minAge: null,
        maxAge: null,
        specificAge: null,
      });

      // Conseils avec âge spécifique
      if (ageInWeeks !== null) {
        whereClause.OR.push({
          ageUnit: "WEEKS",
          specificAge: ageInWeeks,
        });
      }
      if (ageInMonths !== null) {
        whereClause.OR.push({
          ageUnit: "MONTHS",
          specificAge: ageInMonths,
        });
      }
      if (ageInYears !== null) {
        whereClause.OR.push({
          ageUnit: "YEARS",
          specificAge: ageInYears,
        });
      }

      // Conseils avec plage d'âge
      if (ageInWeeks !== null) {
        whereClause.OR.push({
          ageUnit: "WEEKS",
          minAge: { lte: ageInWeeks },
          maxAge: { gte: ageInWeeks },
        });
      }
      if (ageInMonths !== null) {
        whereClause.OR.push({
          ageUnit: "MONTHS",
          minAge: { lte: ageInMonths },
          maxAge: { gte: ageInMonths },
        });
      }
      if (ageInYears !== null) {
        whereClause.OR.push({
          ageUnit: "YEARS",
          minAge: { lte: ageInYears },
          maxAge: { gte: ageInYears },
        });
      }
    }

    const advice = await prisma.advice.findMany({
      where: whereClause,
      orderBy: [
        { ageUnit: "asc" },
        { minAge: "asc" },
        { createdAt: "desc" },
      ],
    });

    res.json({
      success: true,
      total: advice.length,
      items: advice.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        ageUnit: item.ageUnit,
        minAge: item.minAge,
        maxAge: item.maxAge,
        specificAge: item.specificAge,
        category: item.category,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mobile/campaigns
 * Obtenir les campagnes de vaccination (pour les parents mobiles)
 */
const getCampaigns = async (req, res, next) => {
  try {
    // Les parents mobiles peuvent voir toutes les campagnes actives
    const campaigns = await prisma.campaign.findMany({
      include: {
        region: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    res.json({
      success: true,
      total: campaigns.length,
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        region: campaign.region,
        medias: campaign.medias || [],
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error in getCampaigns (mobile):", error);
    next(error);
  }
};

/**
 * GET /api/mobile/children/:childId/appointments
 * Obtenir les rendez-vous d'un enfant (nécessite authentification)
 */
const getAppointments = async (req, res, next) => {
  try {
    const { childId } = req.params;

    // Récupérer les vaccins programmés (scheduled)
    const scheduledVaccines = await prisma.childVaccineScheduled.findMany({
      where: {
        childId: childId,
      },
      include: {
        vaccine: {
          select: {
            id: true,
            name: true,
          },
        },
        planner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        scheduledFor: "asc",
      },
    });

    // Formater les rendez-vous
    const appointments = scheduledVaccines.map((scheduled) => ({
      id: scheduled.id,
      vaccineId: scheduled.vaccineId,
      vaccineName: scheduled.vaccine.name,
      date: scheduled.scheduledFor,
      dose: scheduled.dose,
      planner: scheduled.planner
        ? `${scheduled.planner.firstName} ${scheduled.planner.lastName}`
        : null,
      status: "scheduled",
    }));

    res.json({
      success: true,
      total: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Error in getAppointments (mobile):", error);
    next(error);
  }
};

/**
 * GET /api/mobile/children/:childId/notifications
 * Obtenir les notifications d'un enfant (nécessite authentification)
 */
const getNotifications = async (req, res, next) => {
  try {
    // Utiliser req.childId du middleware requireMobileAuth pour la sécurité
    const childId = req.childId || req.params.childId;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: "childId requis",
      });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        childId: childId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      total: notifications.length,
      notifications: notifications.map((notif) => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        read: notif.isRead,
        createdAt: notif.createdAt,
        updatedAt: notif.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error in getNotifications (mobile):", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des notifications",
      error: process.env.NODE_ENV !== "production" ? error.message : undefined,
    });
  }
};

/**
 * PUT /api/mobile/children/:childId/notifications/mark-all-read
 * Marquer toutes les notifications comme lues pour un enfant
 */
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const childId = req.childId || req.params.childId;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: "childId requis",
      });
    }

    const result = await prisma.notification.updateMany({
      where: {
        childId: childId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json({
      success: true,
      message: `${result.count} notification(s) marquée(s) comme lue(s)`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error);
    next(error);
  }
};

/**
 * GET /api/mobile/children/:childId/calendar
 * Obtenir le calendrier vaccinal d'un enfant (nécessite authentification)
 * Retourne les vaccins faits, manqués, et programmés fusionnés
 */
const getCalendar = async (req, res, next) => {
  try {
    const { childId } = req.params;

    // Récupérer tous les types de vaccins pour l'enfant
    const [completed, scheduled, overdue, late, due] = await Promise.all([
      // Vaccins complétés
      prisma.childVaccineCompleted.findMany({
        where: { childId },
        include: {
          vaccine: { select: { id: true, name: true } },
          vaccineCalendar: {
            select: {
              id: true,
              description: true,
              ageUnit: true,
              specificAge: true,
              minAge: true,
              maxAge: true,
            },
          },
        },
      }),
      // Vaccins programmés
      prisma.childVaccineScheduled.findMany({
        where: { childId },
        include: {
          vaccine: { select: { id: true, name: true } },
          vaccineCalendar: {
            select: {
              id: true,
              description: true,
              ageUnit: true,
              specificAge: true,
              minAge: true,
              maxAge: true,
            },
          },
        },
      }),
      // Vaccins en retard (ratés)
      prisma.childVaccineOverdue.findMany({
        where: { childId },
        include: {
          vaccine: { select: { id: true, name: true } },
          vaccineCalendar: {
            select: {
              id: true,
              description: true,
              ageUnit: true,
              specificAge: true,
              minAge: true,
              maxAge: true,
            },
          },
        },
      }),
      // Vaccins en retard (tardifs mais faisables)
      prisma.childVaccineLate.findMany({
        where: { childId },
        include: {
          vaccine: { select: { id: true, name: true } },
          vaccineCalendar: {
            select: {
              id: true,
              description: true,
              ageUnit: true,
              specificAge: true,
              minAge: true,
              maxAge: true,
            },
          },
        },
      }),
      // Vaccins à faire
      prisma.childVaccineDue.findMany({
        where: { childId },
        include: {
          vaccine: { select: { id: true, name: true } },
          vaccineCalendar: {
            select: {
              id: true,
              description: true,
              ageUnit: true,
              specificAge: true,
              minAge: true,
              maxAge: true,
            },
          },
        },
      }),
    ]);

    // Fusionner tous les vaccins avec leur statut
    const merged = [];

    // Vaccins complétés
    completed.forEach((item) => {
      merged.push({
        id: item.id,
        vaccineId: item.vaccineId,
        vaccineName: item.vaccine.name,
        date: item.completedAt,
        dose: item.dose,
        status: "done",
        calendarId: item.vaccineCalendarId,
        calendarDescription: item.vaccineCalendar?.description ?? null,
        ageUnit: item.vaccineCalendar?.ageUnit ?? null,
        specificAge: item.vaccineCalendar?.specificAge ?? null,
        minAge: item.vaccineCalendar?.minAge ?? null,
        maxAge: item.vaccineCalendar?.maxAge ?? null,
      });
    });

    // Vaccins programmés
    scheduled.forEach((item) => {
      merged.push({
        id: item.id,
        vaccineId: item.vaccineId,
        vaccineName: item.vaccine.name,
        date: item.scheduledFor,
        dose: item.dose,
        status: "scheduled",
        calendarId: item.vaccineCalendarId,
        calendarDescription: item.vaccineCalendar?.description ?? null,
        ageUnit: item.vaccineCalendar?.ageUnit ?? null,
        specificAge: item.vaccineCalendar?.specificAge ?? null,
        minAge: item.vaccineCalendar?.minAge ?? null,
        maxAge: item.vaccineCalendar?.maxAge ?? null,
      });
    });

    // Vaccins en retard (ratés)
    overdue.forEach((item) => {
      merged.push({
        id: item.id,
        vaccineId: item.vaccineId,
        vaccineName: item.vaccine.name,
        date: item.dueDate,
        dose: item.dose,
        status: "missed",
        calendarId: item.vaccineCalendarId,
        calendarDescription: item.vaccineCalendar?.description ?? null,
        ageUnit: item.vaccineCalendar?.ageUnit ?? null,
        specificAge: item.vaccineCalendar?.specificAge ?? null,
        minAge: item.vaccineCalendar?.minAge ?? null,
        maxAge: item.vaccineCalendar?.maxAge ?? null,
      });
    });

    // Vaccins en retard (tardifs)
    late.forEach((item) => {
      merged.push({
        id: item.id,
        vaccineId: item.vaccineId,
        vaccineName: item.vaccine.name,
        date: item.dueDate,
        dose: item.dose,
        status: "late",
        calendarId: item.vaccineCalendarId,
        calendarDescription: item.vaccineCalendar?.description ?? null,
        ageUnit: item.vaccineCalendar?.ageUnit ?? null,
        specificAge: item.vaccineCalendar?.specificAge ?? null,
        minAge: item.vaccineCalendar?.minAge ?? null,
        maxAge: item.vaccineCalendar?.maxAge ?? null,
      });
    });

    // Vaccins à faire
    due.forEach((item) => {
      merged.push({
        id: item.id,
        vaccineId: item.vaccineId,
        vaccineName: item.vaccine.name,
        date: item.scheduledFor,
        dose: item.dose,
        status: "due",
        calendarId: item.vaccineCalendarId,
        calendarDescription: item.vaccineCalendar?.description ?? null,
        ageUnit: item.vaccineCalendar?.ageUnit ?? null,
        specificAge: item.vaccineCalendar?.specificAge ?? null,
        minAge: item.vaccineCalendar?.minAge ?? null,
        maxAge: item.vaccineCalendar?.maxAge ?? null,
      });
    });

    res.json({
      success: true,
      total: merged.length,
      merged,
    });
  } catch (error) {
    console.error("Error in getCalendar (mobile):", error);
    next(error);
  }
};

/**
 * POST /api/mobile/parent-pin/request-change-code
 * Demander un code WhatsApp pour changer le PIN
 */
const requestChangePinCode = async (req, res, next) => {
  try {
    const { childId, parentPhone, oldPin } = req.body;

    if (!childId || !parentPhone || !oldPin) {
      return res.status(400).json({
        success: false,
        message: "childId, parentPhone et oldPin requis",
      });
    }

    // Trouver l'enfant
    const child = await prisma.children.findUnique({
      where: { id: childId },
    });

    if (!child || child.phoneParent !== parentPhone) {
      return res.status(404).json({
        success: false,
        message: "Enfant non trouvé",
      });
    }

    // Vérifier l'ancien PIN
    if (!child.passwordParent || child.passwordParent === "0000") {
      return res.status(401).json({
        success: false,
        message: "PIN non configuré",
      });
    }

    const isOldPinValid = await bcrypt.compare(oldPin, child.passwordParent);

    if (!isOldPinValid) {
      return res.status(401).json({
        success: false,
        message: "Ancien PIN incorrect",
      });
    }

    // Générer un code de vérification à 6 chiffres
    const verificationCode = generateAccessCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Stocker le code temporairement dans le champ code (format: CHANGE_PIN_CODE_EXPIRESAT)
    await prisma.children.update({
      where: { id: childId },
      data: {
        code: `CHANGE_PIN_${verificationCode}_${expiresAt.getTime()}`,
      },
    });

    // Envoyer le code par WhatsApp
    const parentName = child.fatherName || child.motherName || "Parent";
    await sendVerificationCode({
      to: parentPhone,
      parentName,
      verificationCode,
    });

    res.json({
      success: true,
      message: "Code de vérification envoyé par WhatsApp",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mobile/parent-pin/change
 * Changer le PIN après vérification du code WhatsApp
 */
const changeParentPin = async (req, res, next) => {
  try {
    const { childId, parentPhone, verificationCode, newPin } = req.body;

    if (!childId || !parentPhone || !verificationCode || !newPin || newPin.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "childId, parentPhone, verificationCode et newPin (4 chiffres) requis",
      });
    }

    // Trouver l'enfant
    const child = await prisma.children.findUnique({
      where: { id: childId },
    });

    if (!child || child.phoneParent !== parentPhone) {
      return res.status(404).json({
        success: false,
        message: "Enfant non trouvé",
      });
    }

    // Vérifier le code de vérification
    if (!child.code || !child.code.startsWith("CHANGE_PIN_")) {
      return res.status(400).json({
        success: false,
        message: "Aucune demande de changement de PIN en cours",
      });
    }

    const codeParts = child.code.split("_");
    if (codeParts.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Format de code invalide",
      });
    }

    const storedCode = codeParts[2];
    const expiresAt = parseInt(codeParts[3]);

    if (storedCode !== verificationCode) {
      return res.status(401).json({
        success: false,
        message: "Code de vérification incorrect",
      });
    }

    if (Date.now() > expiresAt) {
      await prisma.children.update({
        where: { id: childId },
        data: { code: null },
      });
      return res.status(400).json({
        success: false,
        message: "Code de vérification expiré",
      });
    }

    // Hasher le nouveau PIN
    const hashedPin = await bcrypt.hash(newPin, 10);

    // Mettre à jour le PIN et supprimer le code temporaire
    await prisma.children.update({
      where: { id: childId },
      data: {
        passwordParent: hashedPin,
        code: null,
      },
    });

    res.json({
      success: true,
      message: "PIN modifié avec succès",
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
  requestChangePinCode,
  changeParentPin,
  getRegions,
  getHealthCenters,
  getVaccineCalendar,
  markVaccinesDone,
  getChildDashboard,
  getAdvice,
  getCampaigns,
  getAppointments,
  getCalendar,
  getNotifications,
  markAllNotificationsAsRead,
};

