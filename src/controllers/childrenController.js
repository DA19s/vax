const prisma = require("../config/prismaClient");
const { sendParentAccessCode } = require("../services/notification");
const { generateAccessCode } = require("../utils/accessCode");

/**
 * Vérifie si un vaccin correspond au genre d'un enfant
 * @param {Object} vaccine - Le vaccin avec son champ gender (peut être null, 'M', ou 'F')
 * @param {string} childGender - Le genre de l'enfant ('M' ou 'F')
 * @returns {boolean} - true si le vaccin peut être administré à cet enfant
 */
const isVaccineSuitableForGender = (vaccine, childGender) => {
  // Si le vaccin n'a pas de genre spécifié (null), il est pour tous
  if (!vaccine.gender) {
    return true;
  }
  // Si le vaccin a un genre, il doit correspondre au genre de l'enfant
  return vaccine.gender === childGender;
};

const mapChildrenForResponse = (child) => {
  const dueVaccines =
    child.dueVaccines?.map((entry) => ({
      name: entry.vaccine.name,
      scheduledFor: entry.scheduledFor,
      ageWindow: {
        unit: entry.vaccineCalendar?.ageUnit ?? null,
        specificAge: entry.vaccineCalendar?.specificAge ?? null,
        min: entry.vaccineCalendar?.minAge ?? null,
        max: entry.vaccineCalendar?.maxAge ?? null,
      },
    })) ?? [];

  const scheduledVaccines =
    child.scheduledVaccines?.map((entry) => ({
      name: entry.vaccine.name,
      scheduledFor: entry.scheduledFor,
      plannerId: entry.plannerId,
      plannerName: entry.planner
        ? `${entry.planner.firstName ?? ""} ${entry.planner.lastName ?? ""}`.trim()
        : null,
    })) ?? [];

  const lateVaccines =
    child.lateVaccines?.map((entry) => ({
      name: entry.vaccine.name,
      dueDate: entry.dueDate,
    })) ?? [];

  const overdueVaccines =
    child.overdueVaccines?.map((entry) => ({
      name: entry.vaccine.name,
      dueDate: entry.dueDate,
    })) ?? [];

  const completedVaccines =
    child.completedVaccines?.map((entry) => ({
      name: entry.vaccine.name,
      administeredAt: entry.administeredAt,
      administeredById: entry.administeredById,
      administeredByName: entry.administeredBy
        ? `${entry.administeredBy.firstName ?? ""} ${entry.administeredBy.lastName ?? ""}`.trim()
        : null,
    })) ?? [];

  return {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    name: `${child.firstName} ${child.lastName}`.trim(),
    gender: child.gender,
    birthDate: child.birthDate,
    region: child.healthCenter?.district?.commune?.region?.name ?? "",
    district: child.healthCenter?.district?.name ?? "",
    healthCenter: child.healthCenter?.name ?? "",
    parentName: child.fatherName || child.motherName || "",
    parentPhone: child.phoneParent,
    address: child.address ?? "",
    status: child.status,
    nextAppointment: child.nextAppointment,
    vaccinesDue: dueVaccines,
    vaccinesScheduled: scheduledVaccines,
    vaccinesLate: lateVaccines,
    vaccinesOverdue: overdueVaccines,
    vaccinesCompleted: completedVaccines,
    createdAt: child.birthDate,
    updatedAt: child.birthDate,
  };
};

const createChildren = async (req, res, next) => {
  if (req.user.role !== "AGENT") {
    return res.status(403).json({ message: "Accès refusé. Seuls les agents peuvent créer des enfants." });
  }

  if (!req.user.healthCenterId) {
    return res.status(400).json({ message: "Votre compte n'est pas associé à un centre de santé." });
  }

  const {
    firstName,
    lastName,
    birthDate,
    birthPlace,
    address,
    gender,
    healthCenterId,
    emailParent,
    phoneParent,
    fatherName,
    motherName,
  } = req.body;

  const finalHealthCenterId = req.user.healthCenterId;

  const now = new Date();
  const birth = new Date(birthDate);

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
    if (value == null) return result;
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

  try {
    const calendarEntries = await prisma.vaccineCalendar.findMany({
      include: { vaccines: true },
    });

    let createdChild;

    await prisma.$transaction(async (tx) => {
      createdChild = await tx.children.create({
        data: {
          firstName,
          lastName,
          birthDate: birth,
          birthPlace,
          address,
          gender,
          healthCenterId: finalHealthCenterId,
          status: "A_JOUR",
          emailParent,
          phoneParent,
          fatherName,
          motherName,
          code: generateAccessCode(),
        },
      });

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
            // Vérifier si le vaccin correspond au genre de l'enfant
            if (!isVaccineSuitableForGender(vaccine, gender)) {
              continue; // Passer ce vaccin s'il ne correspond pas au genre
            }
            // Chaque entrée du calendrier représente une dose unique
            duePayload.push({
              childId: createdChild.id,
              vaccineCalendarId: entry.id,
              vaccineId: vaccine.id,
              scheduledFor: dueDate,
            });
          }
        } else if (isPastRange) {
          for (const vaccine of entry.vaccines) {
            // Vérifier si le vaccin correspond au genre de l'enfant
            if (!isVaccineSuitableForGender(vaccine, gender)) {
              continue; // Passer ce vaccin s'il ne correspond pas au genre
            }
            // Chaque entrée du calendrier représente une dose unique
            latePayload.push({
              childId: createdChild.id,
              vaccineCalendarId: entry.id,
              vaccineId: vaccine.id,
              dueDate,
            });
            hasLate = true;
          }
        }
      }

      if (duePayload.length > 0) {
        await tx.childVaccineDue.createMany({
          data: duePayload,
          skipDuplicates: true,
        });
      }

      if (latePayload.length > 0) {
        await tx.childVaccineLate.createMany({
          data: latePayload,
          skipDuplicates: true,
        });
      }

      if (hasLate) {
        await tx.children.update({
          where: { id: createdChild.id },
          data: { status: "PAS_A_JOUR" },
        });
      }
    });

    const fullChild = await prisma.children.findUnique({
      where: { id: createdChild.id },
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
          include: {
            vaccine: { select: { name: true } },
            administeredBy: { select: { firstName: true, lastName: true } },
          },
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
          include: { vaccine: { select: { name: true } } },
        },
        lateVaccines: {
          include: { vaccine: { select: { name: true } } },
        },
        overdueVaccines: {
          include: { vaccine: { select: { name: true } } },
        },
      },
    });

    res.status(201).json(mapChildrenForResponse(fullChild));

    await sendParentAccessCode({
      to: fullChild.phoneParent,
      parentName: fatherName || motherName || "Parent",
      childName: `${fullChild.firstName} ${fullChild.lastName}`,
      accessCode: fullChild.code,
    });
  } catch (error) {
    next(error);
  }
};

const updateChildren = async (req, res, next) => {
  if (req.user.role !== "AGENT" && req.user.role !== "DISTRICT") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { nextVaccineId, nextAgentId, nextAppointment } = req.body;
    const childrenId = req.params.id;

    const existingChild = await prisma.children.findUnique({
      where: { id: childrenId },
    });

    if (!existingChild) {
      return res.status(404).json({ message: "Enfant non trouvé" });
    }

    const updatedChild = await prisma.children.update({
      where: { id: childrenId },
      data: {
        nextVaccineId,
        nextAgentId,
        nextAppointment,
      },
    });

    res.json(updatedChild);
  } catch (error) {
    next(error);
  }
};

const getChildren = async (req, res, next) => {
  if (!["NATIONAL", "REGIONAL", "DISTRICT", "AGENT"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    let whereClause = {};

    if (req.user.role === "REGIONAL") {
      const regional = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { regionId: true },
      });

      if (!regional?.regionId) {
        return res.json({ total: 0, items: [] });
      }

      whereClause = {
        healthCenter: {
          district: {
            commune: {
              regionId: regional.regionId,
            },
          },
        },
      };
    }

    if (req.user.role === "DISTRICT") {
      const districtUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { districtId: true },
      });

      if (!districtUser?.districtId) {
        return res.json({ total: 0, items: [] });
      }

      whereClause = {
        healthCenter: {
          districtId: districtUser.districtId,
        },
      };
    }

    if (req.user.role === "AGENT") {
      const agent = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { healthCenterId: true },
      });

      if (!agent?.healthCenterId) {
        return res.json({ total: 0, items: [] });
      }

      whereClause = {
        healthCenterId: agent.healthCenterId,
      };
    }

    const children = await prisma.children.findMany({
      where: whereClause,
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

    res.json({
      total: children.length,
      items: children.map(mapChildrenForResponse),
    });
  } catch (error) {
    console.error("getChildren error:", error);
    next(error);
  }
};

const getChildVaccinations = async (req, res, next) => {
  const { id } = req.params;

  try {
    const child = await prisma.children.findUnique({
      where: { id },
      include: {
        healthCenter: {
          select: {
            id: true,
            name: true,
            district: {
              select: {
                id: true,
                name: true,
                commune: {
                  select: {
                    id: true,
                    name: true,
                    region: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
        dueVaccines: {
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
        },
        scheduledVaccines: {
          include: {
            vaccine: { select: { id: true, name: true } },
            planner: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        lateVaccines: {
          include: {
            vaccine: { select: { id: true, name: true } },
            vaccineCalendar: { select: { id: true, description: true } },
          },
        },
        overdueVaccines: {
          include: {
            vaccine: { select: { id: true, name: true } },
            vaccineCalendar: { select: { id: true, description: true } },
          },
        },
        completedVaccines: {
          include: {
            vaccine: { select: { id: true, name: true } },
            administeredBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Enfant non trouvé" });
    }

    const childRegionId =
      child.healthCenter?.district?.commune?.region?.id ?? null;
    const childDistrictId = child.healthCenter?.district?.id ?? null;
    const childHealthCenterId = child.healthCenterId ?? null;

    const hasAccess = (() => {
      if (req.user.role === "NATIONAL") {
        return true;
      }

      if (req.user.role === "REGIONAL") {
        return (
          req.user.regionId != null &&
          childRegionId != null &&
          req.user.regionId === childRegionId
        );
      }

      if (req.user.role === "DISTRICT") {
        return (
          req.user.districtId != null &&
          childDistrictId != null &&
          req.user.districtId === childDistrictId
        );
      }

      if (req.user.role === "AGENT") {
        return (
          req.user.healthCenterId != null &&
          childHealthCenterId != null &&
          req.user.healthCenterId === childHealthCenterId
        );
      }

      return false;
    })();

    if (!hasAccess) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    res.json({
      child: {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        name: `${child.firstName} ${child.lastName}`.trim(),
        gender: child.gender,
        birthDate: child.birthDate,
        status: child.status,
        parentName: child.fatherName || child.motherName || "",
        parentPhone: child.phoneParent,
        address: child.address,
        region: child.healthCenter?.district?.commune?.region?.name ?? "",
        district: child.healthCenter?.district?.name ?? "",
        healthCenter: child.healthCenter?.name ?? "",
      },
      vaccinations: {
        due: child.dueVaccines.map((entry) => ({
          id: entry.id,
          vaccineId: entry.vaccineId,
          vaccineName: entry.vaccine.name,
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
          scheduledFor: entry.scheduledFor,
          plannerId: entry.plannerId,
          plannerName: entry.planner
            ? `${entry.planner.firstName ?? ""} ${entry.planner.lastName ?? ""}`.trim()
            : null,
          calendarId: entry.vaccineCalendarId,
        })),
        late: child.lateVaccines.map((entry) => ({
          id: entry.id,
          vaccineId: entry.vaccineId,
          vaccineName: entry.vaccine.name,
          dueDate: entry.dueDate,
          calendarId: entry.vaccineCalendarId,
          calendarDescription: entry.vaccineCalendar?.description,
        })),
        overdue: child.overdueVaccines.map((entry) => ({
          id: entry.id,
          vaccineId: entry.vaccineId,
          vaccineName: entry.vaccine.name,
          dueDate: entry.dueDate,
          calendarId: entry.vaccineCalendarId,
          calendarDescription: entry.vaccineCalendar?.description,
        })),
        completed: child.completedVaccines.map((entry) => ({
          id: entry.id,
          vaccineId: entry.vaccineId,
          vaccineName: entry.vaccine.name,
          administeredAt: entry.administeredAt,
          administeredById: entry.administeredById,
          administeredByName: entry.administeredBy
            ? `${entry.administeredBy.firstName ?? ""} ${entry.administeredBy.lastName ?? ""}`.trim()
            : null,
          calendarId: entry.vaccineCalendarId,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getParentsOverview = async (req, res, next) => {
  if (
    !["NATIONAL", "REGIONAL", "DISTRICT", "AGENT"].includes(req.user.role)
  ) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  // Pour les agents, vérifier qu'ils sont admin ou staff
  if (req.user.role === "AGENT") {
    if (!["ADMIN", "STAFF"].includes(req.user.agentLevel)) {
      return res.status(403).json({ message: "Accès refusé" });
    }
  }

  try {
    let whereClause = {};

    if (req.user.role === "REGIONAL") {
      const regionUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { regionId: true },
      });

      if (!regionUser?.regionId) {
        return res.json({ success: true, data: [] });
      }

      whereClause = {
        healthCenter: {
          district: {
            commune: {
              regionId: regionUser.regionId,
            },
          },
        },
      };
    } else if (req.user.role === "DISTRICT") {
      // Pour les districts, filtrer par leur district
      if (!req.user.districtId) {
        return res.json({ success: true, data: [] });
      }

      whereClause = {
        healthCenter: {
          districtId: req.user.districtId,
        },
      };
    } else if (req.user.role === "AGENT") {
      // Pour les agents, filtrer par leur centre de santé
      if (!req.user.healthCenterId) {
        return res.json({ success: true, data: [] });
      }

      whereClause = {
        healthCenterId: req.user.healthCenterId,
      };
    }

    const children = await prisma.children.findMany({
      where: whereClause,
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

    const parentsMap = new Map();

    children.forEach((child) => {
      const key =
        child.phoneParent ||
        `${child.fatherName ?? ""}-${child.motherName ?? ""}`.trim();
      if (!key) return;

      if (!parentsMap.has(key)) {
        parentsMap.set(key, {
          parentPhone: child.phoneParent ?? "",
          parentName: child.fatherName || child.motherName || "Parent",
          parentEmail: child.emailParent ?? null,
          children: [],
          regions: new Set(),
          healthCenters: new Set(),
        });
      }

      const parentEntry = parentsMap.get(key);
      parentEntry.children.push({
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        gender: child.gender,
        status: child.status,
        region: child.healthCenter?.district?.commune?.region?.name ?? child.healthCenter?.district?.name ?? "",
        healthCenter: child.healthCenter?.name ?? "",
        nextAppointment: child.nextAppointment,
        birthDate: child.birthDate,
      });

      if (child.healthCenter?.district?.commune?.region?.name) {
        parentEntry.regions.add(child.healthCenter.district.commune.region.name);
      }
      if (child.healthCenter?.name) {
        parentEntry.healthCenters.add(child.healthCenter.name);
      }
    });

    const data = Array.from(parentsMap.values()).map((entry) => ({
      parentPhone: entry.parentPhone,
      parentName: entry.parentName,
      parentEmail: entry.parentEmail,
      childrenCount: entry.children.length,
      children: entry.children,
      regions: Array.from(entry.regions),
      healthCenters: Array.from(entry.healthCenters),
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const deleteChild = async (req, res, next) => {
  if (req.user.role !== "AGENT" || !req.user.healthCenterId) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { id } = req.params;

    const child = await prisma.children.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        healthCenterId: true,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Enfant introuvable" });
    }

    // Vérifier que l'enfant appartient au centre de santé de l'agent
    if (child.healthCenterId !== req.user.healthCenterId) {
      return res.status(403).json({ message: "Accès refusé pour cet enfant" });
    }

    // Supprimer toutes les données liées en cascade
    await prisma.$transaction(async (tx) => {
      // Supprimer les réservations de stock liées aux rendez-vous
      const scheduledVaccines = await tx.childVaccineScheduled.findMany({
        where: { childId: id },
        select: { id: true },
      });

      const scheduleIds = scheduledVaccines.map((s) => s.id);
      if (scheduleIds.length > 0) {
        await tx.stockReservation.deleteMany({
          where: { scheduleId: { in: scheduleIds } },
        });
      }

      // Supprimer les vaccinations
      await tx.childVaccineScheduled.deleteMany({ where: { childId: id } });
      await tx.childVaccineCompleted.deleteMany({ where: { childId: id } });
      await tx.childVaccineDue.deleteMany({ where: { childId: id } });
      await tx.childVaccineLate.deleteMany({ where: { childId: id } });
      await tx.childVaccineOverdue.deleteMany({ where: { childId: id } });

      // Supprimer l'enfant
      await tx.children.delete({ where: { id } });
    });

    res.json({ message: "Enfant supprimé avec succès" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChildren,
  updateChildren,
  getChildren,
  getChildVaccinations,
  getParentsOverview,
  deleteChild,
};