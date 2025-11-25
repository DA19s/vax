const bcrypt = require("bcryptjs");
const prisma = require("../config/prismaClient");
const tokenService = require("../services/tokenService");

const computeAgeByUnit = (birthDate, unit) => {
  const now = new Date();
  const birth = new Date(birthDate);
  const diffDays = Math.floor(
    (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)
  );

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
  if (value == null) return base;

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

const ensureNationalBuckets = async () => {
  const [calendars, children] = await Promise.all([
    prisma.vaccineCalendar.findMany({ include: { vaccines: true } }),
    prisma.children.findMany({
      include: {
        completedVaccines: true,
        dueVaccines: true,
        lateVaccines: true,
        overdueVaccines: true,
      },
    }),
  ]);

  if (calendars.length === 0 || children.length === 0) return;

  const today = new Date();

    for (const child of children) {
    const dueCreate = [];
    const lateCreate = [];

    const completedSet = new Set(
      child.completedVaccines.map(
        (entry) =>
          `${entry.childId}-${entry.vaccineId}-${entry.vaccineCalendarId}`
      )
    );

    const dueSet = new Set(
      child.dueVaccines.map(
        (entry) =>
          `${entry.childId}-${entry.vaccineId}-${entry.vaccineCalendarId}`
      )
    );

    const lateSet = new Set(
      child.lateVaccines.map(
        (entry) =>
          `${entry.childId}-${entry.vaccineId}-${entry.vaccineCalendarId}`
      )
    );

    for (const calendar of calendars) {
      const ageValue = computeAgeByUnit(child.birthDate, calendar.ageUnit);

      const withinRange =
        calendar.specificAge != null
          ? ageValue === calendar.specificAge
          : ageValue >= calendar.minAge && ageValue <= calendar.maxAge;

      const pastRange =
        calendar.specificAge != null
          ? ageValue > calendar.specificAge
          : ageValue > calendar.maxAge;

      const scheduledDate = computeScheduledDate(
        child.birthDate,
        calendar.specificAge,
        calendar.maxAge,
        calendar.ageUnit
      );

      for (const vaccine of calendar.vaccines) {
        const key = `${child.id}-${vaccine.id}-${calendar.id}`;

        if (completedSet.has(key)) {
          dueSet.delete(key);
          lateSet.delete(key);
          continue;
        }

        if (withinRange && !dueSet.has(key)) {
          dueCreate.push({
            childId: child.id,
            vaccineId: vaccine.id,
            vaccineCalendarId: calendar.id,
            scheduledFor: scheduledDate,
          });
          continue;
        }

        if (pastRange && scheduledDate < today && !lateSet.has(key)) {
          lateCreate.push({
            childId: child.id,
            vaccineId: vaccine.id,
            vaccineCalendarId: calendar.id,
            dueDate: scheduledDate,
          });
        }
      }
    }

    if (dueCreate.length > 0) {
      await prisma.childVaccineDue.createMany({
        data: dueCreate,
        skipDuplicates: true,
      });
    }

    if (lateCreate.length > 0) {
      await prisma.childVaccineLate.createMany({
        data: lateCreate,
        skipDuplicates: true,
      });
    }

    const hasLateOrOverdue =
      child.overdueVaccines.length > 0 ||
      child.lateVaccines.length > 0 ||
      lateCreate.length > 0;
    const newStatus = hasLateOrOverdue ? "PAS_A_JOUR" : "A_JOUR";

    if (child.status !== newStatus) {
      await prisma.children.update({
        where: { id: child.id },
        data: { status: newStatus },
      });
    }
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    if (user.role === "NATIONAL") {
      await ensureNationalBuckets();
    }

    const payload = {
      sub: user.id,
      role: user.role,
      agentLevel: user.agentLevel,
    };

    const accessToken = tokenService.signAccessToken(payload);
    const refreshToken = tokenService.signRefreshToken(payload);

    res.json({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
};