const PDFDocument = require("pdfkit");
const prisma = require("../config/prismaClient");
const { get } = require("../routes");
const {
  reserveDoseForHealthCenter,
  releaseDoseForHealthCenter,
  OWNER_TYPES,
} = require("../services/stockLotService");

const createVaccine = async (req, res, next) => {

  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const newVaccine = await prisma.vaccine.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        dosesRequired: req.body.dosesRequired,
      },
    });

    res.status(201).json(newVaccine);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

const getVaccine = async (req, res, next) => {
  const isAgentAdmin =
    req.user.role === "AGENT" && req.user.agentLevel === "ADMIN";

  if (
    !["NATIONAL", "REGIONAL", "DISTRICT"].includes(req.user.role) &&
    !isAgentAdmin
  ) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const [items, total] = await Promise.all([
      prisma.vaccine.findMany({
        include: {
          StockNATIONAL: true,
          StockREGIONAL: true,
          StockDISTRICT: true,
          StockHEALTHCENTER: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.vaccine.count(),
    ]);

    const vaccines = items.map((vaccine) => ({
      id: vaccine.id,
      name: vaccine.name,
      description: vaccine.description,
      dosesRequired: vaccine.dosesRequired,
      createdAt: vaccine.createdAt,
      updatedAt: vaccine.updatedAt,
      stock: {
        national: vaccine.StockNATIONAL?.quantity ?? 0,
        regional: vaccine.StockREGIONAL?.quantity ?? 0,
        district: vaccine.StockDISTRICT?.quantity ?? 0,
        healthCenter: vaccine.StockHEALTHCENTER?.quantity ?? 0,
      },
    }));

    res.json({ total, vaccines });
  } catch (error) {
    next(error);
  }
};

const createVaccineCalendar = async (req, res, next) => {

  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

    const {
      description,
      ageUnit,
      specificAge,
      minAge,
      maxAge,
      vaccine = [],
    } = req.body;

  try {
    const newVaccineCalendar = await prisma.vaccineCalendar.create({
      data: {
        description,
        ageUnit,
        specificAge,
        minAge,
        maxAge,
        vaccines: {
          connect: vaccine.map((id) => ({ id })),
        },
      },
      include: {
        vaccines: true,
      },
    });

    res.status(201).json(newVaccineCalendar);
  } catch (error) {
    next(error);
  }
};

const updateVaccineCalendar = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Identifiant requis." });
  }

  const {
    description,
    ageUnit,
    specificAge,
    minAge,
    maxAge,
    vaccine = [],
  } = req.body ?? {};

  if (!description?.trim()) {
    return res
      .status(400)
      .json({ message: "La description est obligatoire." });
  }

  if (!ageUnit || !["WEEKS", "MONTHS", "YEARS"].includes(ageUnit)) {
    return res
      .status(400)
      .json({ message: "L'unité d'âge fournie est invalide." });
  }

  if (!Array.isArray(vaccine)) {
    return res
      .status(400)
      .json({ message: "La liste des vaccins doit être un tableau." });
  }

  const specificAgeValue =
    specificAge !== null && specificAge !== undefined
      ? Number(specificAge)
      : null;
  const minAgeValue =
    minAge !== null && minAge !== undefined ? Number(minAge) : null;
  const maxAgeValue =
    maxAge !== null && maxAge !== undefined ? Number(maxAge) : null;

  if (
    specificAgeValue !== null &&
    Number.isNaN(specificAgeValue)
  ) {
    return res
      .status(400)
      .json({ message: "L'âge ciblé doit être un nombre valide." });
  }

  if (
    (minAgeValue !== null && Number.isNaN(minAgeValue)) ||
    (maxAgeValue !== null && Number.isNaN(maxAgeValue))
  ) {
    return res
      .status(400)
      .json({ message: "Les âges minimum et maximum doivent être des nombres valides." });
  }

  if (
    minAgeValue !== null &&
    maxAgeValue !== null &&
    minAgeValue > maxAgeValue
  ) {
    return res
      .status(400)
      .json({ message: "L'âge minimum doit être inférieur ou égal à l'âge maximum." });
  }

  try {
    const updatedCalendar = await prisma.vaccineCalendar.update({
      where: { id },
      data: {
        description: description.trim(),
        ageUnit,
        specificAge: specificAgeValue,
        minAge: minAgeValue,
        maxAge: maxAgeValue,
        vaccines: {
          set: vaccine.map((vaccineId) => ({ id: vaccineId })),
        },
      },
      include: { vaccines: true },
    });

    res.json(updatedCalendar);
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ message: "Calendrier vaccinal introuvable." });
    }
    next(error);
  }
};

const deleteVaccineCalendar = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Identifiant requis." });
  }

  try {
    await prisma.vaccineCalendar.delete({
      where: { id },
    });

    res.status(204).end();
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ message: "Calendrier vaccinal introuvable." });
    }
    next(error);
  }
};

const listVaccines = async (req, res, next) => {
  const isAgentAdmin =
    req.user.role === "AGENT" && req.user.agentLevel === "ADMIN";

  if (
    !["NATIONAL", "REGIONAL", "DISTRICT"].includes(req.user.role) &&
    !isAgentAdmin
  ) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const vaccines = await prisma.vaccine.findMany({
    });
    res.json(vaccines);
  } catch (error) {
    next(error);
  }
};

const AGE_UNIT_ORDER = {
  WEEKS: 0,
  MONTHS: 1,
  YEARS: 2,
};

const AGE_UNIT_LABELS = {
  WEEKS: "Semaines",
  MONTHS: "Mois",
  YEARS: "Années",
};

const translateAgeUnit = (unit) => AGE_UNIT_LABELS[unit] || unit;

const sortCalendars = (calendars) =>
  calendars
    .slice()
    .sort((a, b) => {
      const unitDiff =
        (AGE_UNIT_ORDER[a.ageUnit] ?? 99) - (AGE_UNIT_ORDER[b.ageUnit] ?? 99);
      if (unitDiff !== 0) return unitDiff;

      const ageA = a.specificAge ?? a.minAge ?? 0;
      const ageB = b.specificAge ?? b.minAge ?? 0;
      return ageA - ageB;
    });

const fetchCalendarsWithVaccines = async () => {
  const calendars = await prisma.vaccineCalendar.findMany({
    include: { vaccines: true },
  });

  return sortCalendars(calendars);
};

const listVaccineCalendars = async (req, res, next) => {
  const isAgentAdmin =
    req.user.role === "AGENT" && req.user.agentLevel === "ADMIN";

  if (
    !["NATIONAL", "REGIONAL", "DISTRICT"].includes(req.user.role) &&
    !isAgentAdmin
  ) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const calendars = await fetchCalendarsWithVaccines();
    res.json(calendars);
  } catch (error) {
    next(error);
  }
};

const downloadVaccineCalendarPdf = async (req, res, next) => {
  const isAgentAdmin =
    req.user.role === "AGENT" && req.user.agentLevel === "ADMIN";

  if (
    !["NATIONAL", "REGIONAL", "DISTRICT"].includes(req.user.role) &&
    !isAgentAdmin
  ) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const calendars = await fetchCalendarsWithVaccines();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="calendrier-vaccinal.pdf"'
    );

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    doc.fontSize(20).text("Calendrier Vaccinal National", {
      align: "center",
    });
    doc.moveDown();

    if (calendars.length === 0) {
      doc.fontSize(12).text("Aucune entrée de calendrier n'est disponible.");
      doc.end();
      return;
    }

    let currentUnit = null;

    calendars.forEach((item, index) => {
      if (currentUnit !== item.ageUnit) {
        currentUnit = item.ageUnit;
        doc.moveDown(currentUnit ? 1 : 0.5);
        doc
          .fontSize(16)
          .fillColor("#2563eb")
          .text(translateAgeUnit(currentUnit), { underline: true });
        doc.moveDown(0.5);
      }

      const ageLabel =
        item.specificAge != null
          ? `${item.specificAge} ${translateAgeUnit(item.ageUnit)}`
          : `${item.minAge ?? "?"} - ${item.maxAge ?? "?"} ${translateAgeUnit(
              item.ageUnit
            )}`;

      doc
        .fontSize(13)
        .fillColor("#111827")
        .text(`• Intervalle : ${ageLabel}`, { continued: false });

      const vaccineNames = item.vaccines.map((v) => v.name).join(", ");
      doc
        .fontSize(12)
        .fillColor("#1f2937")
        .text(`Vaccins : ${vaccineNames || "Non spécifié"}`);

      if (item.description) {
        doc
          .fontSize(11)
          .fillColor("#4b5563")
          .text(`Notes : ${item.description}`);
      }

      if (index !== calendars.length - 1) {
        doc.moveDown(0.75);
      }
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

const releaseReservationForSchedule = async (
  tx,
  scheduleId,
  { consume = false } = {},
) => {
  if (!scheduleId) {
    return null;
  }

  const reservation = await tx.stockReservation.findUnique({
    where: { scheduleId },
    include: {
      stockLot: {
        select: {
          id: true,
          vaccineId: true,
          ownerType: true,
          ownerId: true,
        },
      },
    },
  });

  if (!reservation) {
    return null;
  }

  if (!consume) {
    const lotOwnerType = reservation.stockLot.ownerType;
    const lotOwnerId = reservation.stockLot.ownerId;
    if (lotOwnerType === OWNER_TYPES.HEALTHCENTER && lotOwnerId) {
      await releaseDoseForHealthCenter(tx, {
        vaccineId: reservation.stockLot.vaccineId,
        healthCenterId: lotOwnerId,
        lotId: reservation.stockLot.id,
        quantity: reservation.quantity,
      });
    }
  }

  await tx.stockReservation.delete({
    where: { id: reservation.id },
  });

  return reservation;
};

const updateVaccine = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  const vaccineId = req.params.id;
  const { name, description, dosesRequired } = req.body ?? {};

  if (!name?.trim() || !description?.trim() || !dosesRequired?.trim()) {
    return res
      .status(400)
      .json({ message: "Nom, description et doses requises sont obligatoires." });
  }

  try {
    const updated = await prisma.vaccine.update({
      where: { id: vaccineId },
      data: {
        name: name.trim(),
        description: description.trim(),
        dosesRequired: dosesRequired.trim(),
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteVaccine = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  const vaccineId = req.params.id;

  try {
    await prisma.vaccine.delete({ where: { id: vaccineId } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};


const ScheduleVaccine = async (req, res, next) => {
  if (req.user.role !== "AGENT" || !req.user.healthCenterId) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const {
      childId,
      vaccineId,
      vaccineCalendarId = null,
      scheduledFor,
    } = req.body ?? {};

    if (!childId || !vaccineId || !scheduledFor) {
      return res
        .status(400)
        .json({ message: "childId, vaccineId et scheduledFor sont requis." });
    }

    const scheduleDate = new Date(scheduledFor);
    if (Number.isNaN(scheduleDate.getTime())) {
      return res
        .status(400)
        .json({ message: "La date de rendez-vous est invalide." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const child = await tx.children.findUnique({
        where: { id: childId },
        select: { healthCenterId: true },
      });

      if (!child) {
        throw Object.assign(new Error("Enfant introuvable"), { status: 404 });
      }

      if (child.healthCenterId !== req.user.healthCenterId) {
        throw Object.assign(new Error("Accès refusé"), { status: 403 });
      }

      const vaccine = await tx.vaccine.findUnique({
        where: { id: vaccineId },
        select: { dosesRequired: true },
      });

      if (!vaccine) {
        throw Object.assign(new Error("Vaccin introuvable"), { status: 404 });
      }

      const dosesRequired = Number.parseInt(vaccine.dosesRequired, 10);
      const totalDoses =
        Number.isFinite(dosesRequired) && dosesRequired > 0 ? dosesRequired : 1;

      const completedCount = await tx.childVaccineCompleted.count({
        where: { childId, vaccineId },
      });

      const dose = completedCount + 1;
      if (dose > totalDoses) {
        throw Object.assign(
          new Error("Toutes les doses de ce vaccin ont déjà été administrées."),
          { status: 400 },
        );
      }

      const existingScheduled = await tx.childVaccineScheduled.findFirst({
        where: { childId, vaccineId, dose },
      });
      if (existingScheduled) {
        throw Object.assign(
          new Error("Un rendez-vous existe déjà pour cette dose."),
          { status: 409 },
        );
      }

      const reservation = await reserveDoseForHealthCenter(tx, {
        vaccineId,
        healthCenterId: child.healthCenterId,
        quantity: 1,
        appointmentDate: scheduleDate,
      });

      const created = await tx.childVaccineScheduled.create({
        data: {
          childId,
          vaccineId,
          vaccineCalendarId,
          scheduledFor: scheduleDate,
          plannerId: req.user.id,
          dose,
        },
        include: {
          vaccine: { select: { id: true, name: true, dosesRequired: true } },
        },
      });

      await tx.stockReservation.create({
        data: {
          scheduleId: created.id,
          stockLotId: reservation.lotId,
          quantity: reservation.quantity,
        },
      });

      await tx.childVaccineDue.deleteMany({
        where: {
          childId,
          vaccineId,
          dose,
          ...(vaccineCalendarId
            ? { vaccineCalendarId }
            : { vaccineCalendarId: null }),
        },
      });

      await tx.childVaccineOverdue.deleteMany({
        where: {
          childId,
          vaccineId,
          dose,
        },
      });

      await tx.childVaccineLate.deleteMany({
        where: {
          childId,
          vaccineId,
          dose,
          ...(vaccineCalendarId
            ? { vaccineCalendarId }
            : { vaccineCalendarId: null }),
        },
      });

      await tx.children.update({
        where: { id: childId },
        data: { nextAppointment: scheduleDate },
      });

      return created;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

const listScheduledVaccines = async (req, res, next) => {
  try {
    let whereClause = {};

    if (req.user.role === "AGENT") {
      if (!req.user.healthCenterId) {
        return res.json({ items: [] });
      }
      whereClause = {
        child: {
          healthCenterId: req.user.healthCenterId,
        },
      };
    } else if (req.user.role === "DISTRICT") {
      if (!req.user.districtId) {
        return res.json({ items: [] });
      }
      whereClause = {
        child: {
          healthCenter: {
            districtId: req.user.districtId,
          },
        },
      };
    } else if (req.user.role === "REGIONAL") {
      if (!req.user.regionId) {
        return res.json({ items: [] });
      }
      whereClause = {
        child: {
          healthCenter: {
            district: {
              commune: {
                regionId: req.user.regionId,
              },
            },
          },
        },
      };
    }

    const scheduledList = await prisma.childVaccineScheduled.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            birthDate: true,
            healthCenterId: true,
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
          },
        },
        vaccine: {
          select: {
            id: true,
            name: true,
            dosesRequired: true,
          },
        },
        vaccineCalendar: {
          select: {
            id: true,
            description: true,
            ageUnit: true,
            minAge: true,
            maxAge: true,
            specificAge: true,
          },
        },
      },
      orderBy: [
        { scheduledFor: "asc" },
        { dose: "asc" },
      ],
    });

    let regionsList = [];
    if (req.user.role === "NATIONAL") {
      regionsList = await prisma.region.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
    }

    const items = scheduledList.map((entry) => {
      const regionName =
        entry.child.healthCenter?.district?.commune?.region?.name ?? null;
      const districtName = entry.child.healthCenter?.district?.name ?? null;
      const healthCenterName = entry.child.healthCenter?.name ?? null;

      return {
        id: entry.id,
        scheduledFor: entry.scheduledFor,
        dose: entry.dose ?? 1,
        region: regionName,
        district: districtName,
        healthCenter: healthCenterName,
        child: {
          id: entry.child.id,
          firstName: entry.child.firstName,
          lastName: entry.child.lastName,
          gender: entry.child.gender,
          birthDate: entry.child.birthDate,
          healthCenter: entry.child.healthCenter
            ? {
                id: entry.child.healthCenter.id,
                name: entry.child.healthCenter.name,
              }
            : null,
        },
        vaccine: entry.vaccine
          ? {
              id: entry.vaccine.id,
              name: entry.vaccine.name,
              dosesRequired: entry.vaccine.dosesRequired,
            }
          : null,
        vaccineCalendar: entry.vaccineCalendar
          ? {
              id: entry.vaccineCalendar.id,
              description: entry.vaccineCalendar.description,
              ageUnit: entry.vaccineCalendar.ageUnit,
              minAge: entry.vaccineCalendar.minAge,
              maxAge: entry.vaccineCalendar.maxAge,
              specificAge: entry.vaccineCalendar.specificAge,
            }
          : null,
      };
    });

    res.json({
      items,
      regions: regionsList,
    });
  } catch (error) {
    next(error);
  }
};

const completeVaccine = async (req, res, next) => {
  if (req.user.role !== "AGENT" || !req.user.healthCenterId) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const completed = await prisma.$transaction(async (tx) => {
      const scheduled = await tx.childVaccineScheduled.findUnique({
        where: { id: req.params.id },
        select: {
          childId: true,
          vaccineCalendarId: true,
          vaccineId: true,
          plannerId: true,
          dose: true,
          child: { select: { healthCenterId: true } },
        },
      });

      if (!scheduled) {
        throw Object.assign(new Error("Rendez-vous introuvable"), {
          status: 404,
        });
      }

      if (scheduled.child?.healthCenterId !== req.user.healthCenterId) {
        throw Object.assign(new Error("Accès refusé"), { status: 403 });
      }

      const newVaccineCompleted = await tx.childVaccineCompleted.create({
        data: {
          childId: scheduled.childId,
          vaccineCalendarId: scheduled.vaccineCalendarId,
          vaccineId: scheduled.vaccineId,
          notes: req.body.notes,
          administeredById: scheduled.plannerId,
          dose: scheduled.dose ?? 1,
        },
      });

      await releaseReservationForSchedule(tx, req.params.id, { consume: true });

      await tx.childVaccineScheduled.delete({ where: { id: req.params.id } });

      const dose = scheduled.dose ?? 1;

      await tx.childVaccineDue.deleteMany({
        where: {
          childId: scheduled.childId,
          vaccineId: scheduled.vaccineId,
          dose,
        },
      });

      // Supprimer les entrées overdue pour cette dose spécifique
      await tx.childVaccineOverdue.deleteMany({
        where: {
          childId: scheduled.childId,
          vaccineId: scheduled.vaccineId,
          dose,
        },
      });

      // Supprimer les entrées late pour cette dose spécifique
      // Si vaccineCalendarId est null, supprimer toutes les entrées pour ce vaccin et cette dose
      // Sinon, supprimer uniquement celles avec le même vaccineCalendarId
      if (scheduled.vaccineCalendarId) {
        await tx.childVaccineLate.deleteMany({
          where: {
            childId: scheduled.childId,
            vaccineId: scheduled.vaccineId,
            dose,
            vaccineCalendarId: scheduled.vaccineCalendarId,
          },
        });
      } else {
        // Si vaccineCalendarId est null, supprimer toutes les entrées late pour ce vaccin et cette dose
        // car on ne peut pas faire correspondre un calendarId spécifique
        await tx.childVaccineLate.deleteMany({
          where: {
            childId: scheduled.childId,
            vaccineId: scheduled.vaccineId,
            dose,
          },
        });
      }

      return newVaccineCompleted;
    });

    return res.status(201).json(completed);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

const moveScheduledToOverdue = async (tx, scheduled) => {
  const dose = scheduled.dose ?? 1;

  const overdue = await tx.childVaccineOverdue.upsert({
    where: {
      childId_vaccineId_dose: {
        childId: scheduled.childId,
        vaccineId: scheduled.vaccineId,
        dose,
      },
    },
    update: {
      vaccineCalendarId: scheduled.vaccineCalendarId,
      escalatedToId: scheduled.plannerId,
      dueDate: scheduled.scheduledFor,
    },
    create: {
      childId: scheduled.childId,
      vaccineCalendarId: scheduled.vaccineCalendarId,
      vaccineId: scheduled.vaccineId,
      escalatedToId: scheduled.plannerId,
      dueDate: scheduled.scheduledFor,
      dose,
    },
  });

  // Supprimer les entrées correspondantes dans late et due pour éviter les doublons
  await tx.childVaccineLate.deleteMany({
    where: {
      childId: scheduled.childId,
      vaccineId: scheduled.vaccineId,
      dose,
    },
  });

  await tx.childVaccineDue.deleteMany({
    where: {
      childId: scheduled.childId,
      vaccineId: scheduled.vaccineId,
      dose,
      ...(scheduled.vaccineCalendarId
        ? { vaccineCalendarId: scheduled.vaccineCalendarId }
        : { vaccineCalendarId: null }),
    },
  });

  await releaseReservationForSchedule(tx, scheduled.id, { consume: false });

  await tx.childVaccineScheduled.delete({
    where: { id: scheduled.id },
  });

  return overdue;
};

const markScheduledAsMissed = async (scheduledId) => {
  return prisma.$transaction(async (tx) => {
    const scheduled = await tx.childVaccineScheduled.findUnique({
      where: { id: scheduledId },
    });

    if (!scheduled) {
      const error = new Error("Rendez-vous introuvable");
      error.status = 404;
      throw error;
    }

    return moveScheduledToOverdue(tx, scheduled);
  });
};

const missVaccineForPlanner = async (plannerId) => {
  if (!plannerId) return [];

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const scheduledList = await tx.childVaccineScheduled.findMany({
      where: {
        plannerId,
        scheduledFor: { lt: now },
      },
    });

    if (!scheduledList.length) {
      return [];
    }

    const results = [];
    for (const scheduled of scheduledList) {
      results.push(await moveScheduledToOverdue(tx, scheduled));
    }
    return results;
  });
};

const missVaccine = async (req, res, next) => {
  if (req.user.role !== "AGENT") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const overdue = await markScheduledAsMissed(req.params.id);
    return res.status(201).json(overdue);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

missVaccine.forPlanner = missVaccineForPlanner;

const updateScheduledVaccine = async (req, res, next) => {
  if (req.user.role !== "AGENT" || !req.user.healthCenterId) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { id } = req.params;
    const { scheduledFor, vaccineId, vaccineCalendarId } = req.body ?? {};
    if (!scheduledFor || !vaccineId) {
      return res.status(400).json({
        message: "scheduledFor et vaccineId sont requis",
      });
    }

    const scheduleDate = new Date(scheduledFor);
    if (Number.isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ message: "Date invalide" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const scheduled = await tx.childVaccineScheduled.findUnique({
        where: { id },
        select: {
          childId: true,
          vaccineId: true,
          vaccineCalendarId: true,
          dose: true,
          child: {
            select: {
              healthCenterId: true,
            },
          },
        },
      });

      if (!scheduled) {
        throw Object.assign(new Error("Rendez-vous introuvable"), {
          code: "NOT_FOUND",
        });
      }

      if (scheduled.child?.healthCenterId !== req.user.healthCenterId) {
        throw Object.assign(new Error("Accès refusé"), {
          code: "FORBIDDEN",
        });
      }

      if (scheduled.vaccineId !== vaccineId) {
        const vaccine = await tx.vaccine.findUnique({
          where: { id: vaccineId },
          select: { dosesRequired: true },
        });
        if (!vaccine) {
          throw Object.assign(new Error("Vaccin introuvable"), {
            code: "NOT_FOUND",
          });
        }
        const dosesRequired = Number.parseInt(vaccine.dosesRequired, 10);
        const totalDoses =
          Number.isFinite(dosesRequired) && dosesRequired > 0
            ? dosesRequired
            : 1;

        const completedCount = await tx.childVaccineCompleted.count({
          where: {
            childId: scheduled.childId,
            vaccineId,
          },
        });
        const dose = completedCount + 1;
        if (dose > totalDoses) {
          throw Object.assign(
            new Error(
              "Toutes les doses de ce vaccin ont déjà été administrées.",
            ),
            { code: "DOSE_LIMIT" },
          );
        }

        const targetCalendarId =
          vaccineCalendarId !== undefined
            ? vaccineCalendarId
            : scheduled.vaccineCalendarId;
        await releaseReservationForSchedule(tx, id, { consume: false });
        await tx.childVaccineScheduled.delete({ where: { id } });

        const reservation = await reserveDoseForHealthCenter(tx, {
          vaccineId,
          healthCenterId: scheduled.child.healthCenterId,
          quantity: 1,
          appointmentDate: scheduleDate,
        });

        const recreated = await tx.childVaccineScheduled.create({
          data: {
            childId: scheduled.childId,
            vaccineId,
            vaccineCalendarId: targetCalendarId,
            scheduledFor: scheduleDate,
            plannerId: req.user.id,
            dose,
          },
          include: {
            vaccine: { select: { id: true, name: true, dosesRequired: true } },
          },
        });

        await tx.stockReservation.create({
          data: {
            scheduleId: recreated.id,
            stockLotId: reservation.lotId,
            quantity: reservation.quantity,
          },
        });

        await tx.childVaccineDue.deleteMany({
          where: {
            childId: scheduled.childId,
            vaccineId,
            dose,
          },
        });
        await tx.childVaccineLate.deleteMany({
          where: {
            childId: scheduled.childId,
            vaccineId,
            dose,
          },
        });
        await tx.childVaccineOverdue.deleteMany({
          where: {
            childId: scheduled.childId,
            vaccineId,
            dose,
          },
        });

        await tx.children.update({
          where: { id: scheduled.childId },
          data: { nextAppointment: scheduleDate },
        });

        return recreated;
      }

      const updatedSchedule = await tx.childVaccineScheduled.update({
        where: { id },
        data: {
          scheduledFor: scheduleDate,
          ...(vaccineCalendarId !== undefined
            ? { vaccineCalendarId }
            : {}),
        },
        include: {
          vaccine: { select: { id: true, name: true, dosesRequired: true } },
        },
      });

      await tx.children.update({
        where: { id: scheduled.childId },
        data: { nextAppointment: scheduleDate },
      });

      return updatedSchedule;
    });

    res.json(updated);
  } catch (error) {
    if (error.code === "P2025" || error.code === "NOT_FOUND") {
      return res.status(404).json({ message: "Rendez-vous introuvable" });
    }
    if (error.code === "DOSE_LIMIT") {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === "FORBIDDEN") {
      return res.status(403).json({ message: "Accès refusé" });
    }
    next(error);
  }
};

const cancelScheduledVaccine = async (req, res, next) => {
  if (req.user.role !== "AGENT" || !req.user.healthCenterId) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { id } = req.params;
    await prisma.$transaction(async (tx) => {
      const scheduled = await tx.childVaccineScheduled.findUnique({
        where: { id },
        select: {
          id: true,
          child: { select: { healthCenterId: true } },
        },
      });

      if (!scheduled) {
        throw Object.assign(new Error("Rendez-vous introuvable"), {
          status: 404,
        });
      }

      if (scheduled.child?.healthCenterId !== req.user.healthCenterId) {
        throw Object.assign(new Error("Accès refusé"), { status: 403 });
      }

      await releaseReservationForSchedule(tx, scheduled.id, { consume: false });

      await tx.childVaccineScheduled.delete({ where: { id } });
    });

    res.status(204).send();
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

module.exports = {
    createVaccine,
    createVaccineCalendar,
    updateVaccineCalendar,
    deleteVaccineCalendar,
    downloadVaccineCalendarPdf,
    getVaccine,
    listVaccineCalendars,
    listVaccines,
    ScheduleVaccine,
    listScheduledVaccines,
    updateScheduledVaccine,
    cancelScheduledVaccine,
    updateVaccine,
    deleteVaccine,
    completeVaccine,
    missVaccine,
};