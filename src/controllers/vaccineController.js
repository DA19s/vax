const PDFDocument = require("pdfkit");
const prisma = require("../config/prismaClient");
const {
  notifyVaccineScheduled,
  notifyVaccineMissed,
  notifyVaccineLate,
} = require("../services/notificationService");
const { get } = require("../routes");
const {
  reserveDoseForHealthCenter,
  releaseDoseForHealthCenter,
  deleteLotCascade,
  OWNER_TYPES,
} = require("../services/stockLotService");

/**
 * Met à jour nextAppointment avec le prochain rendez-vous le plus proche pour un enfant
 * @param {Object} tx - Transaction Prisma
 * @param {string} childId - ID de l'enfant
 */
const updateNextAppointment = async (tx, childId) => {
  const nextScheduled = await tx.childVaccineScheduled.findFirst({
    where: { childId },
    orderBy: { scheduledFor: "asc" },
    select: { scheduledFor: true, vaccineId: true, plannerId: true },
  });

  await tx.children.update({
    where: { id: childId },
    data: {
      nextAppointment: nextScheduled?.scheduledFor || null,
      nextVaccineId: nextScheduled?.vaccineId || null,
      nextAgentId: nextScheduled?.plannerId || null,
    },
  });
};

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
        gender: req.body.gender || null, // null = pour tous, 'M' = garçons, 'F' = filles
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
  const isAgent =
    req.user.role === "AGENT" && (req.user.agentLevel === "ADMIN" || req.user.agentLevel === "STAFF");

  if (
    !["NATIONAL", "REGIONAL", "DISTRICT"].includes(req.user.role) &&
    !isAgent
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

    const vaccines = items.map((vaccine) => {
      // Calculer la somme des stocks régionaux
      const regionalTotal = Array.isArray(vaccine.StockREGIONAL)
        ? vaccine.StockREGIONAL.reduce((sum, stock) => sum + (stock.quantity ?? 0), 0)
        : 0;

      // Calculer la somme des stocks districts
      const districtTotal = Array.isArray(vaccine.StockDISTRICT)
        ? vaccine.StockDISTRICT.reduce((sum, stock) => sum + (stock.quantity ?? 0), 0)
        : 0;

      // Calculer la somme des stocks centres de santé
      const healthCenterTotal = Array.isArray(vaccine.StockHEALTHCENTER)
        ? vaccine.StockHEALTHCENTER.reduce((sum, stock) => sum + (stock.quantity ?? 0), 0)
        : 0;

      return {
        id: vaccine.id,
        name: vaccine.name,
        description: vaccine.description,
        dosesRequired: vaccine.dosesRequired,
        createdAt: vaccine.createdAt,
        updatedAt: vaccine.updatedAt,
        stock: {
          national: vaccine.StockNATIONAL?.quantity ?? 0,
          regional: regionalTotal,
          district: districtTotal,
          healthCenter: healthCenterTotal,
        },
      };
    });

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
  const isAgent =
    req.user.role === "AGENT" && (req.user.agentLevel === "ADMIN" || req.user.agentLevel === "STAFF");

  if (
    !["NATIONAL", "REGIONAL", "DISTRICT"].includes(req.user.role) &&
    !isAgent
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
  const isAgent =
    req.user.role === "AGENT" && (req.user.agentLevel === "ADMIN" || req.user.agentLevel === "STAFF");

  if (
    !["NATIONAL", "REGIONAL", "DISTRICT"].includes(req.user.role) &&
    !isAgent
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
  const { name, description, dosesRequired, gender } = req.body ?? {};

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
        gender: gender || null, // null = pour tous, 'M' = garçons, 'F' = filles
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
    // Vérifier que le vaccin existe
    const vaccine = await prisma.vaccine.findUnique({
      where: { id: vaccineId },
    });

    if (!vaccine) {
      return res.status(404).json({ message: "Vaccin non trouvé" });
    }

    // Supprimer toutes les relations dépendantes dans une transaction
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer les réservations de stock liées aux vaccins programmés
      const scheduledVaccines = await tx.childVaccineScheduled.findMany({
        where: { vaccineId },
        select: { id: true },
      });

      const scheduledIds = scheduledVaccines.map((sv) => sv.id);
      if (scheduledIds.length > 0) {
        await tx.stockReservation.deleteMany({
          where: { scheduleId: { in: scheduledIds } },
        });
      }

      // 2. Supprimer les enregistrements de vaccination des enfants
      await tx.childVaccineCompleted.deleteMany({
        where: { vaccineId },
      });

      await tx.childVaccineDue.deleteMany({
        where: { vaccineId },
      });

      await tx.childVaccineScheduled.deleteMany({
        where: { vaccineId },
      });

      await tx.childVaccineOverdue.deleteMany({
        where: { vaccineId },
      });

      await tx.childVaccineLate.deleteMany({
        where: { vaccineId },
      });

      // 3. Supprimer les lots de stock en cascade (cela gère aussi les réservations)
      const stockLots = await tx.stockLot.findMany({
        where: { vaccineId },
        select: { id: true },
      });

      // Utiliser deleteLotCascade pour chaque lot (gère les réservations et les transferts)
      for (const lot of stockLots) {
        await deleteLotCascade(tx, lot.id);
      }

      // 4. Supprimer les stocks
      await tx.stockNATIONAL.deleteMany({
        where: { vaccineId },
      });

      await tx.stockREGIONAL.deleteMany({
        where: { vaccineId },
      });

      await tx.stockDISTRICT.deleteMany({
        where: { vaccineId },
      });

      await tx.stockHEALTHCENTER.deleteMany({
        where: { vaccineId },
      });

      // 5. Supprimer les enregistrements (records)
      await tx.record.deleteMany({
        where: { vaccineId },
      });

      // 6. Supprimer les demandes de vaccin (VaccineRequest)
      // Note: VaccineRequest a une contrainte ON DELETE RESTRICT, donc on doit les supprimer avant
      await tx.vaccineRequest.deleteMany({
        where: { vaccineId },
      });

      // 7. Supprimer les transferts de stock (StockTransfer et StockTransferLot)
      // Note: StockTransfer a une contrainte ON DELETE RESTRICT sur vaccineId
      const stockTransfers = await tx.stockTransfer.findMany({
        where: { vaccineId },
        select: { id: true },
      });

      const transferIds = stockTransfers.map((st) => st.id);
      if (transferIds.length > 0) {
        // Supprimer d'abord les StockTransferLot (ils ont une FK vers StockTransfer)
        await tx.stockTransferLot.deleteMany({
          where: { transferId: { in: transferIds } },
        });

        // Puis supprimer les StockTransfer
        await tx.stockTransfer.deleteMany({
          where: { id: { in: transferIds } },
        });
      }

      // 8. Mettre à jour les enfants qui ont ce vaccin comme nextVaccineId
      await tx.children.updateMany({
        where: { nextVaccineId: vaccineId },
        data: { nextVaccineId: null },
      });

      // 9. Supprimer la relation many-to-many avec VaccineCalendar
      // (Prisma gère automatiquement la table de jointure _VaccineToVaccineCalendar)

      // 10. Supprimer le vaccin lui-même
      await tx.vaccine.delete({
        where: { id: vaccineId },
      });
    });

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting vaccine:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      meta: error.meta,
    });
    
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Vaccin non trouvé" });
    }
    
    // Erreur de contrainte de clé étrangère
    if (error.code === "P2003") {
      return res.status(400).json({ 
        message: "Impossible de supprimer ce vaccin car il est encore utilisé dans le système",
        details: error.meta?.field_name || "Relation inconnue"
      });
    }
    
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
        select: { healthCenterId: true, gender: true },
      });

      if (!child) {
        throw Object.assign(new Error("Enfant introuvable"), { status: 404 });
      }

      if (child.healthCenterId !== req.user.healthCenterId) {
        throw Object.assign(new Error("Accès refusé"), { status: 403 });
      }

      const vaccine = await tx.vaccine.findUnique({
        where: { id: vaccineId },
        select: { dosesRequired: true, gender: true },
      });

      if (!vaccine) {
        throw Object.assign(new Error("Vaccin introuvable"), { status: 404 });
      }

      // Vérifier si le vaccin correspond au genre de l'enfant
      const isSuitable = !vaccine.gender || vaccine.gender === child.gender;
      if (!isSuitable) {
        throw Object.assign(
          new Error("Ce vaccin n'est pas adapté au genre de l'enfant"),
          { status: 400 }
        );
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

      // Permettre plusieurs rendez-vous simultanés pour le même enfant
      // On ne vérifie plus s'il existe déjà un rendez-vous

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
          child: { select: { id: true, phoneParent: true } },
        },
      });

      await tx.stockReservation.create({
        data: {
          scheduleId: created.id,
          stockLotId: reservation.lotId,
          quantity: reservation.quantity,
        },
      });

      // Créer une notification pour le parent (après la transaction)
      // On le fait après la transaction pour éviter les problèmes de rollback
      if (created.child) {
        setImmediate(async () => {
          try {
            await notifyVaccineScheduled({
              childId: created.child.id,
              vaccineName: created.vaccine.name,
              scheduledDate: created.scheduledFor,
            });
          } catch (notifError) {
            console.error("Erreur création notification:", notifError);
          }
        });
      }

      // NE PAS supprimer les entrées de due, late, overdue lors de la programmation
      // On attend que le vaccin soit complété (dans completeVaccine) pour les supprimer
      // Cela garantit que les vaccins restent visibles comme "à faire" ou "en retard"
      // jusqu'à ce qu'ils soient réellement administrés

      // Mettre à jour nextAppointment avec le prochain rendez-vous le plus proche
      await updateNextAppointment(tx, childId);

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
        },
      });

      await releaseReservationForSchedule(tx, req.params.id, { consume: true });

      await tx.childVaccineScheduled.delete({ where: { id: req.params.id } });

      // Mettre à jour nextAppointment avec le prochain rendez-vous le plus proche
      await updateNextAppointment(tx, scheduled.childId);

      // Supprimer l'entrée due correspondant à ce calendrier vaccinal
      if (scheduled.vaccineCalendarId) {
        await tx.childVaccineDue.deleteMany({
          where: {
            childId: scheduled.childId,
            vaccineId: scheduled.vaccineId,
            vaccineCalendarId: scheduled.vaccineCalendarId,
          },
        });

        // Supprimer l'entrée late pour ce calendrier vaccinal
        await tx.childVaccineLate.deleteMany({
          where: {
            childId: scheduled.childId,
            vaccineId: scheduled.vaccineId,
            vaccineCalendarId: scheduled.vaccineCalendarId,
          },
        });
      } else {
        // Si vaccineCalendarId est null, supprimer toutes les entrées late pour cette dose
        await tx.childVaccineLate.deleteMany({
          where: {
            childId: scheduled.childId,
            vaccineId: scheduled.vaccineId,
            dose,
          },
        });
      }

      // Supprimer l'entrée overdue pour cette dose spécifique
      await tx.childVaccineOverdue.deleteMany({
        where: {
          childId: scheduled.childId,
          vaccineId: scheduled.vaccineId,
          dose,
        },
      });

      // Vérifier si toutes les doses requises du vaccin sont complétées
      const vaccine = await tx.vaccine.findUnique({
        where: { id: scheduled.vaccineId },
        select: { dosesRequired: true },
      });

      const dosesRequired = vaccine?.dosesRequired 
        ? parseInt(vaccine.dosesRequired, 10) 
        : 1;
      const totalDoses = isFinite(dosesRequired) && dosesRequired > 0 ? dosesRequired : 1;

      // Compter les doses complétées pour ce vaccin
      const completedCount = await tx.childVaccineCompleted.count({
        where: {
          childId: scheduled.childId,
          vaccineId: scheduled.vaccineId,
        },
      });

      // Si toutes les doses sont complétées, supprimer toutes les entrées restantes
      // (au cas où il y aurait des entrées pour d'autres doses qui n'ont pas été supprimées)
      if (completedCount >= totalDoses) {
        await tx.childVaccineDue.deleteMany({
          where: {
            childId: scheduled.childId,
            vaccineId: scheduled.vaccineId,
          },
        });

        await tx.childVaccineLate.deleteMany({
          where: {
            childId: scheduled.childId,
            vaccineId: scheduled.vaccineId,
          },
        });

        await tx.childVaccineOverdue.deleteMany({
          where: {
            childId: scheduled.childId,
            vaccineId: scheduled.vaccineId,
          },
        });
      }

      // Mettre à jour le statut de l'enfant en fonction des vaccins restants
      const hasLateOrOverdue =
        (await tx.childVaccineLate.count({ where: { childId: scheduled.childId } })) > 0 ||
        (await tx.childVaccineOverdue.count({ where: { childId: scheduled.childId } })) > 0;

      await tx.children.update({
        where: { id: scheduled.childId },
        data: {
          status: hasLateOrOverdue ? "PAS_A_JOUR" : "A_JOUR",
        },
      });

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
  const overdue = await tx.childVaccineOverdue.upsert({
    where: {
      childId_vaccineCalendarId_vaccineId: {
        childId: scheduled.childId,
        vaccineCalendarId: scheduled.vaccineCalendarId,
        vaccineId: scheduled.vaccineId,
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
    },
  });

  // NE PAS supprimer les entrées dans late et due lors du passage en overdue
  // On attend que le vaccin soit complété pour les supprimer
  // Cela garantit que les vaccins restent visibles comme "à faire" ou "en retard"
  // jusqu'à ce qu'ils soient réellement administrés

  await releaseReservationForSchedule(tx, scheduled.id, { consume: false });

  await tx.childVaccineScheduled.delete({
    where: { id: scheduled.id },
  });

  // Mettre à jour nextAppointment avec le prochain rendez-vous le plus proche
  await updateNextAppointment(tx, scheduled.childId);

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

        // NE PAS supprimer les entrées de due, late, overdue lors de la reprogrammation
        // On attend que le vaccin soit complété pour les supprimer

        // Mettre à jour nextAppointment avec le prochain rendez-vous le plus proche
        await updateNextAppointment(tx, scheduled.childId);

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

      // Mettre à jour nextAppointment avec le prochain rendez-vous le plus proche
      await updateNextAppointment(tx, scheduled.childId);

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
          childId: true,
          child: { select: { healthCenterId: true, id: true } },
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

      // Mettre à jour nextAppointment avec le prochain rendez-vous le plus proche
      await updateNextAppointment(tx, scheduled.childId);
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