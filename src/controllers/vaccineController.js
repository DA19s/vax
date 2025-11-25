const PDFDocument = require("pdfkit");
const prisma = require("../config/prismaClient");
const { get } = require("../routes");

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
    next(error);
  }
};

const getVaccine = async (req, res, next) => {
  if (!["NATIONAL", "REGIONAL"].includes(req.user.role)) {
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
  if (!["NATIONAL", "REGIONAL"].includes(req.user.role)) {
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
  if (!["NATIONAL", "REGIONAL"].includes(req.user.role)) {
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
  if (!["NATIONAL", "REGIONAL"].includes(req.user.role)) {
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


module.exports = {
    createVaccine,
    createVaccineCalendar,
    updateVaccineCalendar,
    deleteVaccineCalendar,
    downloadVaccineCalendarPdf,
    getVaccine,
    listVaccineCalendars,
    listVaccines,
    updateVaccine,
    deleteVaccine,
};