const prisma = require("../config/prismaClient");
const {
  buildVaccineDoseMap,
  getDoseForEntry,
  getDoseDescriptor,
} = require("../utils/vaccineDose");

const AGE_UNIT_IN_DAYS = {
  WEEKS: 7,
  MONTHS: 30.4375,
  YEARS: 365.25,
};

const isVaccineSuitableForGender = (vaccine, childGender) => {
  if (!vaccine.gender) {
    return true;
  }
  return vaccine.gender === childGender;
};

const computeAgeByUnit = (birthDate, unit) => {
  const now = new Date();
  const birth = new Date(birthDate);
  const diffDays = Math.floor((now.getTime() - birth.getTime()) / 86400000);

  switch (unit) {
    case "WEEKS":
      return Math.floor(diffDays / 7);
    case "MONTHS":
      return Math.floor(diffDays / 30.4375);
    case "YEARS":
      return Math.floor(diffDays / 365.25);
    default:
      return diffDays;
  }
};

const computeScheduledDate = (birthDate, specificAge, maxAge, unit) => {
  const base = new Date(birthDate);
  const value = specificAge != null ? specificAge : maxAge;
  if (value == null) {
    return base;
  }

  if (unit === "WEEKS") {
    base.setDate(base.getDate() + value * 7);
  } else if (unit === "MONTHS") {
    base.setMonth(base.getMonth() + value);
  } else if (unit === "YEARS") {
    base.setFullYear(base.getFullYear() + value);
  } else {
    base.setDate(base.getDate() + value);
  }

  return base;
};

const getDoseKey = (vaccineId, calendarId, dose) =>
  `${vaccineId}::${calendarId ?? "none"}::${dose ?? 1}`;

const buildKeySet = (entries = []) =>
  new Set(
    entries.map((entry) =>
      getDoseKey(entry.vaccineId, entry.vaccineCalendarId, entry.dose ?? 1),
    ),
  );

const buildVaccineMetadata = (calendars) => {
  const map = new Map();
  for (const calendar of calendars) {
    for (const vaccine of calendar.vaccines ?? []) {
      if (!map.has(vaccine.id)) {
        const parsed = parseInt(vaccine.dosesRequired, 10);
        map.set(vaccine.id, {
          dosesRequired:
            Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
          gender: vaccine.gender ?? null,
        });
      }
    }
  }
  return map;
};

const rebuildChildVaccinationBuckets = async (
  childId,
  tx = prisma,
  sharedContext = {},
) => {
  const {
    calendars: sharedCalendars,
    doseMap: sharedDoseMap,
    vaccineMeta: sharedVaccineMeta,
  } = sharedContext;
  const [calendars, child] = await Promise.all([
    sharedCalendars ??
      tx.vaccineCalendar.findMany({
        include: {
          vaccines: {
            select: {
              id: true,
              gender: true,
              dosesRequired: true,
            },
          },
        },
      }),
    tx.children.findUnique({
      where: { id: childId },
      include: {
        completedVaccines: true,
        scheduledVaccines: true,
        overdueVaccines: true,
        lateVaccines: true,
      },
    }),
  ]);

  if (!child) {
    return;
  }

  if (!calendars.length) {
    await Promise.all([
      tx.childVaccineDue.deleteMany({ where: { childId } }),
      tx.childVaccineLate.deleteMany({ where: { childId } }),
    ]);
    await tx.children.update({
      where: { id: childId },
      data: { status: "A_JOUR" },
    });
    return;
  }

  const doseMap = sharedDoseMap ?? buildVaccineDoseMap(calendars);
  const vaccineMeta = sharedVaccineMeta ?? buildVaccineMetadata(calendars);

  await Promise.all([
    tx.childVaccineDue.deleteMany({ where: { childId } }),
    tx.childVaccineLate.deleteMany({ where: { childId } }),
  ]);

  const completedSet = buildKeySet(child.completedVaccines);
  const scheduledSet = buildKeySet(child.scheduledVaccines);
  const overdueSet = buildKeySet(child.overdueVaccines);

  const dueCreate = [];
  const lateCreate = [];

  const today = new Date();

  for (const [vaccineId, meta] of vaccineMeta.entries()) {
    if (meta.gender && meta.gender !== child.gender) {
      continue;
    }

    const descriptors = doseMap.doseDefinitionMap?.get(vaccineId);
    if (!descriptors || descriptors.size === 0) {
      continue;
    }

    for (let doseIndex = 1; doseIndex <= meta.dosesRequired; doseIndex += 1) {
      const descriptor = getDoseDescriptor(doseMap, vaccineId, doseIndex);
      if (!descriptor) {
        continue;
      }

      const key = getDoseKey(vaccineId, descriptor.calendarId, doseIndex);
      if (
        completedSet.has(key) ||
        scheduledSet.has(key) ||
        overdueSet.has(key)
      ) {
        continue;
      }

      const ageValue = computeAgeByUnit(child.birthDate, descriptor.ageUnit);
      const minAge = descriptor.minAge ?? 0;
      const maxAge = descriptor.maxAge ?? null;
      const withinRange =
        ageValue >= minAge && (maxAge == null || ageValue <= maxAge);
      const pastRange = maxAge != null && ageValue > maxAge;
      const scheduledDate = computeScheduledDate(
        child.birthDate,
        descriptor.specificAge,
        descriptor.maxAge,
        descriptor.ageUnit,
      );

      if (withinRange) {
        dueCreate.push({
          childId,
          vaccineId,
          vaccineCalendarId: descriptor.calendarId,
          scheduledFor: scheduledDate,
          dose: doseIndex,
        });
      } else if (pastRange && scheduledDate < today) {
        lateCreate.push({
          childId,
          vaccineId,
          vaccineCalendarId: descriptor.calendarId,
          dueDate: scheduledDate,
          dose: doseIndex,
        });
      }
    }
  }

  if (dueCreate.length > 0) {
    await tx.childVaccineDue.createMany({
      data: dueCreate,
      skipDuplicates: true,
    });
  }

  if (lateCreate.length > 0) {
    await tx.childVaccineLate.createMany({
      data: lateCreate,
      skipDuplicates: true,
    });
  }

  const hasLateOrOverdue =
    lateCreate.length > 0 ||
    (await tx.childVaccineLate.count({ where: { childId } })) > 0 ||
    (await tx.childVaccineOverdue.count({ where: { childId } })) > 0;

  await tx.children.update({
    where: { id: childId },
    data: {
      status: hasLateOrOverdue ? "PAS_A_JOUR" : "A_JOUR",
    },
  });
};

const rebuildAllVaccinationBuckets = async () => {
  const calendars = await prisma.vaccineCalendar.findMany({
    include: {
      vaccines: {
        select: { id: true, gender: true, dosesRequired: true },
      },
    },
  });
  const doseMap = buildVaccineDoseMap(calendars);
  const vaccineMeta = buildVaccineMetadata(calendars);
  const children = await prisma.children.findMany({ select: { id: true } });

  for (const child of children) {
    await rebuildChildVaccinationBuckets(child.id, prisma, {
      calendars,
      doseMap,
      vaccineMeta,
    });
  }
};

module.exports = {
  rebuildChildVaccinationBuckets,
  rebuildAllVaccinationBuckets,
};

