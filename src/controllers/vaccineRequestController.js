const prisma = require("../config/prismaClient");
const { sendVaccineRequestEmail } = require("../services/emailService");
const { notifyVaccineScheduled } = require("../services/notificationService");

/**
 * POST /api/mobile/children/:childId/vaccine-requests
 * Créer une demande de vaccin (pour les parents)
 */
const createVaccineRequest = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { vaccineId, vaccineCalendarId, dose = 1 } = req.body;

    if (!vaccineId) {
      return res.status(400).json({
        success: false,
        message: "vaccineId est requis",
      });
    }

    // Vérifier que l'enfant existe et appartient au parent
    const child = await prisma.children.findUnique({
      where: { id: childId },
      include: {
        healthCenter: {
          include: {
            district: {
              include: {
                commune: {
                  include: {
                    region: true,
                  },
                },
              },
            },
          },
        },
        vaccine: true,
      },
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Enfant non trouvé",
      });
    }

    // Vérifier que le vaccin existe
    const vaccine = await prisma.vaccine.findUnique({
      where: { id: vaccineId },
    });

    if (!vaccine) {
      return res.status(404).json({
        success: false,
        message: "Vaccin non trouvé",
      });
    }

    // Vérifier si toutes les doses précédentes sont complétées
    if (dose > 1) {
      const missingDoses = [];
      for (let previousDose = 1; previousDose < dose; previousDose++) {
        const previousCompleted = await prisma.childVaccineCompleted.findFirst({
          where: {
            childId,
            vaccineId,
            dose: previousDose,
          },
        });

        if (!previousCompleted) {
          missingDoses.push(previousDose);
        }
      }

      if (missingDoses.length > 0) {
        const dosesText = missingDoses.length === 1 
          ? `la dose ${missingDoses[0]}`
          : `les doses ${missingDoses.join(", ")}`;
        return res.status(400).json({
          success: false,
          message: `Vous devez d'abord compléter ${dosesText} avant de demander la dose ${dose}`,
        });
      }
    }

    // Vérifier si une demande existe déjà pour cette dose (PENDING ou SCHEDULED)
    const existingRequest = await prisma.vaccineRequest.findFirst({
      where: {
        childId,
        vaccineId,
        dose,
        status: {
          in: ["PENDING", "SCHEDULED"],
        },
      },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: existingRequest.status === "PENDING"
          ? "Une demande est déjà en attente pour cette dose"
          : "Un rendez-vous a déjà été programmé pour cette dose",
      });
    }

    // Vérifier si un rendez-vous est déjà programmé pour cette dose (non complété)
    const existingScheduled = await prisma.childVaccineScheduled.findFirst({
      where: {
        childId,
        vaccineId,
        dose,
      },
    });

    if (existingScheduled) {
      // Vérifier si le rendez-vous a déjà été complété
      const isCompleted = await prisma.childVaccineCompleted.findFirst({
        where: {
          childId,
          vaccineId,
          dose,
        },
      });

      if (!isCompleted) {
        return res.status(400).json({
          success: false,
          message: "Un rendez-vous est déjà programmé pour cette dose",
        });
      }
    }

    // Créer la demande
    const request = await prisma.vaccineRequest.create({
      data: {
        childId,
        vaccineId,
        vaccineCalendarId: vaccineCalendarId || null,
        dose,
        status: "PENDING",
      },
      include: {
        child: {
          select: {
            firstName: true,
            lastName: true,
            healthCenter: {
              select: {
                name: true,
              },
            },
          },
        },
        vaccine: {
          select: {
            name: true,
          },
        },
      },
    });

    // Récupérer les agents du centre de santé
    const agents = await prisma.user.findMany({
      where: {
        role: "AGENT",
        healthCenterId: child.healthCenterId,
        isActive: true,
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Envoyer un email à chaque agent
    const emailPromises = agents.map((agent) =>
      sendVaccineRequestEmail({
        agentEmail: agent.email,
        agentName: `${agent.firstName} ${agent.lastName}`.trim(),
        childName: `${child.firstName} ${child.lastName}`.trim(),
        vaccineName: vaccine.name,
        dose,
        healthCenter: child.healthCenter?.name || "Non spécifié",
      })
    );

    await Promise.allSettled(emailPromises);

    res.status(201).json({
      success: true,
      message: "Demande de vaccin créée avec succès",
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/vaccine-requests
 * Récupérer les demandes de vaccin (pour les agents)
 */
const getVaccineRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};

    // Filtrer par statut si fourni
    if (status) {
      where.status = status;
    }

    // Si l'utilisateur est un agent, filtrer par son centre de santé
    if (req.user.role === "AGENT" && req.user.healthCenterId) {
      where.child = {
        healthCenterId: req.user.healthCenterId,
      };
    }

    const requests = await prisma.vaccineRequest.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            gender: true,
            healthCenter: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        vaccine: {
          select: {
            id: true,
            name: true,
            description: true,
            dosesRequired: true,
          },
        },
        vaccineCalendar: {
          select: {
            id: true,
            description: true,
          },
        },
        scheduledBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/vaccine-requests/:id/schedule
 * Programmer un rendez-vous à partir d'une demande
 */
const scheduleVaccineRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scheduledFor, notes } = req.body;

    if (!scheduledFor) {
      return res.status(400).json({
        success: false,
        message: "scheduledFor est requis",
      });
    }

    const scheduledDate = new Date(scheduledFor);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "La date de rendez-vous est invalide",
      });
    }

    const request = await prisma.vaccineRequest.findUnique({
      where: { id },
      include: {
        child: {
          select: {
            id: true,
            healthCenterId: true,
          },
        },
        vaccine: {
          select: {
            id: true,
            name: true,
            dosesRequired: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Demande non trouvée",
      });
    }

    // Vérifier les permissions
    if (req.user.role === "AGENT" && req.user.healthCenterId !== request.child.healthCenterId) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Cette demande a déjà été traitée",
      });
    }

    // Créer le rendez-vous programmé
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'entrée dans childVaccineScheduled
      const scheduled = await tx.childVaccineScheduled.create({
        data: {
          childId: request.childId,
          vaccineId: request.vaccineId,
          vaccineCalendarId: request.vaccineCalendarId,
          scheduledFor: scheduledDate,
          plannerId: req.user.id,
          dose: request.dose,
        },
      });

      // Mettre à jour la demande
      const updatedRequest = await tx.vaccineRequest.update({
        where: { id },
        data: {
          status: "SCHEDULED",
          scheduledFor: scheduledDate,
          scheduledById: req.user.id,
          appointmentId: scheduled.id,
          notes: notes || null,
        },
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          vaccine: {
            select: {
              id: true,
              name: true,
            },
          },
          scheduledBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return { scheduled, request: updatedRequest };
    });

    // Créer une notification pour le parent (après la transaction)
    // On le fait après la transaction pour éviter les problèmes de rollback
    setImmediate(async () => {
      try {
        console.log("🔔 Création notification pour rendez-vous programmé:", {
          childId: request.child.id,
          vaccineName: request.vaccine.name,
          scheduledDate: scheduledDate,
        });
        await notifyVaccineScheduled({
          childId: request.child.id,
          vaccineName: request.vaccine.name,
          scheduledDate: scheduledDate,
        });
        console.log("✅ Notification créée et envoyée avec succès");
      } catch (notifError) {
        console.error("❌ Erreur création notification:", notifError);
      }
    });

    res.json({
      success: true,
      message: "Rendez-vous programmé avec succès",
      appointment: result.scheduled,
      request: result.request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/vaccine-requests/:id
 * Annuler une demande
 */
const cancelVaccineRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.vaccineRequest.findUnique({
      where: { id },
      include: {
        child: {
          select: {
            healthCenterId: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Demande non trouvée",
      });
    }

    // Vérifier les permissions (parent ou agent du même centre)
    if (req.user.role === "AGENT" && req.user.healthCenterId !== request.child.healthCenterId) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Seules les demandes en attente peuvent être annulées",
      });
    }

    await prisma.vaccineRequest.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });

    res.json({
      success: true,
      message: "Demande annulée avec succès",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVaccineRequest,
  getVaccineRequests,
  scheduleVaccineRequest,
  cancelVaccineRequest,
};

