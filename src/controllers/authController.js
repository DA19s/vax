const bcrypt = require("bcryptjs");
const prisma = require("../config/prismaClient");
const tokenService = require("../services/tokenService");
const { missVaccine } = require("./vaccineController");
const { refreshExpiredLots } = require("../services/stockLotService");

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

    const completedDoseSet = new Set(
      (child.completedVaccines ?? []).map(
        (entry) => `${entry.vaccineId}::${entry.dose ?? 1}`
      )
    );
    const scheduledDoseSet = new Set(
      (child.scheduledVaccines ?? []).map(
        (entry) => `${entry.vaccineId}::${entry.dose ?? 1}`
      )
    );
    const overdueDoseSet = new Set(
      (child.overdueVaccines ?? []).map(
        (entry) => `${entry.vaccineId}::${entry.dose ?? 1}`
      )
    );
    const dueDoseSet = new Set(
      (child.dueVaccines ?? []).map(
        (entry) =>
          `${entry.vaccineId}::${entry.vaccineCalendarId ?? ""}::${entry.dose ?? 1}`
      )
    );
    const lateDoseSet = new Set(
      (child.lateVaccines ?? []).map(
        (entry) =>
          `${entry.vaccineId}::${entry.vaccineCalendarId ?? ""}::${entry.dose ?? 1}`
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
        const dosesRequired = Number.parseInt(vaccine.dosesRequired, 10);
        const totalDoses = Number.isFinite(dosesRequired) && dosesRequired > 0 ? dosesRequired : 1;

        const missingDoses = [];
        for (let dose = 1; dose <= totalDoses; dose += 1) {
          const doseKey = `${vaccine.id}::${dose}`;
          const hasCompleted = completedDoseSet.has(doseKey);
          const hasScheduled = scheduledDoseSet.has(doseKey);
          const hasOverdue = overdueDoseSet.has(doseKey);

          if (!hasCompleted && !hasScheduled && !hasOverdue) {
            missingDoses.push(dose);
          }
        }

        if (withinRange && missingDoses.length > 0) {
          const nextDose = missingDoses[0];
          const dueKey = `${vaccine.id}::${calendar.id}::${nextDose}`;
          if (!dueDoseSet.has(dueKey)) {
            dueCreate.push({
              childId: child.id,
              vaccineId: vaccine.id,
              vaccineCalendarId: calendar.id,
              scheduledFor: scheduledDate,
              dose: nextDose,
            });
            dueDoseSet.add(dueKey);
          }
        }

        if (pastRange && scheduledDate < today && missingDoses.length > 0) {
          for (const dose of missingDoses) {
            const lateKey = `${vaccine.id}::${calendar.id}::${dose}`;
            if (lateDoseSet.has(lateKey)) {
              continue;
            }

            lateCreate.push({
              childId: child.id,
              vaccineId: vaccine.id,
              vaccineCalendarId: calendar.id,
              dueDate: scheduledDate,
              dose,
            });
            lateDoseSet.add(lateKey);
          }
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
    const { email, password, role: requestedRole } = req.body ?? {};

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    const includeRelations = {
      region: { select: { id: true, name: true } },
      district: {
        select: {
          id: true,
          name: true,
          commune: {
            select: {
              id: true,
              name: true,
              regionId: true,
            },
          },
        },
      },
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
                  regionId: true,
                },
              },
            },
          },
        },
      },
    };

    let candidateUsers = [];

    if (requestedRole) {
      const user = await prisma.user.findUnique({
        where: {
          email_role: {
            email,
            role: requestedRole,
          },
        },
        include: includeRelations,
      });
      candidateUsers = user ? [user] : [];
    } else {
      candidateUsers = await prisma.user.findMany({
        where: { email },
        include: includeRelations,
      });
    }

    if (!candidateUsers.length) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const matchingUsers = [];
    for (const user of candidateUsers) {
      if (!user.isActive) {
        continue;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        matchingUsers.push(user);
      }
    }

    if (!matchingUsers.length) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    if (matchingUsers.length > 1 && !requestedRole) {
      return res.json({
        requiresRoleSelection: true,
        roles: matchingUsers.map((user) => ({
          role: user.role,
          agentLevel: user.agentLevel,
          region: user.region
            ? { id: user.region.id, name: user.region.name }
            : null,
          district: user.district
            ? { id: user.district.id, name: user.district.name }
            : null,
          healthCenter: user.healthCenter
            ? { id: user.healthCenter.id, name: user.healthCenter.name }
            : null,
        })),
      });
    }

    const user = matchingUsers[0];

    let expiredLotsSummary = [];

    if (user.role === "NATIONAL") {
      await ensureNationalBuckets();
      const expiredLots = await refreshExpiredLots();
      expiredLotsSummary = expiredLots.map((lot) => ({
        id: lot.id,
        vaccineId: lot.vaccineId,
        expiration: lot.expiration,
        remainingQuantity: lot.remainingQuantity,
      }));
    }

    if (user.role === "AGENT" && typeof missVaccine.forPlanner === "function") {
      missVaccine
        .forPlanner(user.id)
        .catch((error) =>
          console.error("[login] missVaccine.forPlanner failed", error)
        );
    }

    const payload = {
      sub: user.id,
      role: user.role,
      agentLevel: user.agentLevel,
    };

    const accessToken = tokenService.signAccessToken(payload);
    const refreshToken = tokenService.signRefreshToken(payload);

    res.json({ accessToken, refreshToken, expiredLots: expiredLotsSummary });
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