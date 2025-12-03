const AGE_UNIT_TO_DAYS = {
  WEEKS: 7,
  MONTHS: 30.4375,
  YEARS: 365.25,
};

const computeAgeWeight = (calendarEntry) => {
  if (!calendarEntry) {
    return 0;
  }
  const base =
    calendarEntry.specificAge ??
    calendarEntry.maxAge ??
    calendarEntry.minAge ??
    0;
  const multiplier = AGE_UNIT_TO_DAYS[calendarEntry.ageUnit] ?? 7;
  return base * multiplier;
};

const buildVaccineDoseMap = (calendarEntries = []) => {
  const sortedEntries = [...calendarEntries].sort(
    (a, b) => computeAgeWeight(a) - computeAgeWeight(b),
  );

  const perVaccineCounters = new Map();
  const entryDoseMap = new Map();
  const doseDefinitionMap = new Map();

  for (const entry of sortedEntries) {
    if (!entry?.vaccines?.length) {
      continue;
    }

    for (const vaccine of entry.vaccines) {
      const currentCount = perVaccineCounters.get(vaccine.id) ?? 0;
      const nextCount = currentCount + 1;
      perVaccineCounters.set(vaccine.id, nextCount);
      entryDoseMap.set(`${vaccine.id}::${entry.id}`, nextCount);

      if (!doseDefinitionMap.has(vaccine.id)) {
        doseDefinitionMap.set(vaccine.id, new Map());
      }

      doseDefinitionMap.get(vaccine.id).set(nextCount, {
        calendarId: entry.id,
        ageUnit: entry.ageUnit,
        specificAge: entry.specificAge,
        minAge: entry.minAge,
        maxAge: entry.maxAge,
        description: entry.description ?? null,
      });
    }
  }

  return {
    entryDoseMap,
    doseDefinitionMap,
  };
};

const getDoseForEntry = (doseMap, vaccineId, calendarId) => {
  if (!doseMap || !vaccineId || !calendarId) {
    return 1;
  }
  return doseMap.entryDoseMap?.get(`${vaccineId}::${calendarId}`) ?? 1;
};

const getDoseDescriptor = (doseMap, vaccineId, doseNumber) => {
  if (!doseMap || !vaccineId || !doseNumber) {
    return null;
  }

  const descriptors = doseMap.doseDefinitionMap?.get(vaccineId);
  if (!descriptors || descriptors.size === 0) {
    return null;
  }

  return (
    descriptors.get(doseNumber) ??
    descriptors.get(descriptors.size) ??
    null
  );
};

module.exports = {
  buildVaccineDoseMap,
  getDoseForEntry,
  getDoseDescriptor,
};

