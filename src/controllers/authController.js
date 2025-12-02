const bcrypt = require("bcryptjs");
const prisma = require("../config/prismaClient");
const tokenService = require("../services/tokenService");
const { missVaccine } = require("./vaccineController");
const { refreshExpiredLots } = require("../services/stockLotService");

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

    // Utiliser vaccineCalendarId et vaccineId pour identifier les vaccins (plus de dose)
    const completedSet = new Set(
      (child.completedVaccines ?? []).map(
        (entry) => `${entry.vaccineId}::${entry.vaccineCalendarId ?? ""}`
      )
    );
    const scheduledSet = new Set(
      (child.scheduledVaccines ?? []).map(
        (entry) => `${entry.vaccineId}::${entry.vaccineCalendarId ?? ""}`
      )
    );
    const overdueSet = new Set(
      (child.overdueVaccines ?? []).map(
        (entry) => `${entry.vaccineId}::${entry.vaccineCalendarId ?? ""}`
      )
    );
    const dueSet = new Set(
      (child.dueVaccines ?? []).map(
        (entry) => `${entry.vaccineId}::${entry.vaccineCalendarId ?? ""}`
      )
    );
    const lateSet = new Set(
      (child.lateVaccines ?? []).map(
        (entry) => `${entry.vaccineId}::${entry.vaccineCalendarId ?? ""}`
      )
    );

    for (const calendar of calendars) {
      const ageValue = computeAgeByUnit(child.birthDate, calendar.ageUnit);

      // Vérifier si l'enfant est dans la plage d'âge (minAge à maxAge)
      // Le specificAge est utilisé uniquement pour calculer la date cible, pas pour l'éligibilité
      const withinRange = ageValue >= calendar.minAge && ageValue <= calendar.maxAge;

      // Vérifier si l'enfant a dépassé la plage d'âge
      const pastRange = ageValue > calendar.maxAge;

      const scheduledDate = computeScheduledDate(
        child.birthDate,
        calendar.specificAge,
        calendar.maxAge,
        calendar.ageUnit
      );

      for (const vaccine of calendar.vaccines) {
        // Vérifier si le vaccin correspond au genre de l'enfant
        if (!isVaccineSuitableForGender(vaccine, child.gender)) {
          continue; // Passer ce vaccin s'il ne correspond pas au genre
        }

        const key = `${vaccine.id}::${calendar.id}`;
        const hasCompleted = completedSet.has(key);
        const hasScheduled = scheduledSet.has(key);
        const hasOverdue = overdueSet.has(key);
        const hasDue = dueSet.has(key);
        const hasLate = lateSet.has(key);

        // Si l'enfant n'a pas encore ce vaccin pour ce calendrier
        if (!hasCompleted && !hasScheduled && !hasOverdue && !hasDue && !hasLate) {
          if (withinRange) {
            // Dans la plage d'âge : créer une entrée "due"
            dueCreate.push({
              childId: child.id,
              vaccineId: vaccine.id,
              vaccineCalendarId: calendar.id,
              scheduledFor: scheduledDate,
            });
          } else if (pastRange && scheduledDate < today) {
            // Dépassé la plage d'âge et la date est passée : créer une entrée "late"
            lateCreate.push({
              childId: child.id,
              vaccineId: vaccine.id,
              vaccineCalendarId: calendar.id,
              dueDate: scheduledDate,
            });
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