const prisma = require("../config/prismaClient");
const {
  OWNER_TYPES,
  LOT_STATUS,
  createLot,
  consumeLots,
  recordTransfer,
  deleteLotCascade,
  updateNearestExpiration,
} = require("../services/stockLotService");

const resolveRegionIdForUser = async (user) => {
  if (user.regionId) {
    return user.regionId;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { regionId: true },
  });

  return dbUser?.regionId ?? null;
};

const resolveDistrictIdForUser = async (user) => {
  if (user.districtId) {
    return user.districtId;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { districtId: true },
  });

  return dbUser?.districtId ?? null;
};

const resolveHealthCenterIdForUser = async (user) => {
  if (user.healthCenterId) {
    return user.healthCenterId;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { healthCenterId: true },
  });

  return dbUser?.healthCenterId ?? null;
};

const ensureDistrictBelongsToRegion = async (districtId, regionId) => {
  const district = await prisma.district.findUnique({
    where: { id: districtId },
    include: { commune: { select: { regionId: true } } },
  });

  if (!district) {
    const error = new Error("District introuvable");
    error.status = 404;
    throw error;
  }

  if (!district.commune || district.commune.regionId !== regionId) {
    const error = new Error("District hors de votre région");
    error.status = 403;
    throw error;
  }
};

const fetchDistrictIdsForRegion = async (regionId) => {
  const districts = await prisma.district.findMany({
    where: { commune: { regionId } },
    select: { id: true },
  });

  return districts.map((entry) => entry.id);
};

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const normalizeOwnerIdValue = (ownerType, ownerId) =>
  ownerType === OWNER_TYPES.NATIONAL ? null : ownerId ?? null;

const formatLotRecords = (records) =>
  records.map((lot) => ({
    id: lot.id,
    vaccineId: lot.vaccineId,
    quantity: lot.quantity,
    remainingQuantity: lot.remainingQuantity,
    distributedQuantity: lot.quantity - lot.remainingQuantity,
    expiration: lot.expiration,
    status: lot.status,
    sourceLotId: lot.sourceLotId,
    createdAt: lot.createdAt,
    updatedAt: lot.updatedAt,
    derivedCount: lot._count?.derivedLots ?? 0,
  }));

const buildLotsResponse = (records) => {
  const formatted = formatLotRecords(records);
  const totalRemaining = formatted.reduce(
    (sum, lot) => sum + lot.remainingQuantity,
    0,
  );

  return {
    lots: formatted,
    totalRemaining,
  };
};

const fetchLotsForOwner = async ({ vaccineId, ownerType, ownerId }) => {
  const normalizedOwnerId = normalizeOwnerIdValue(ownerType, ownerId);

  return prisma.stockLot.findMany({
    where: {
      vaccineId,
      ownerType,
      ownerId: normalizedOwnerId,
    },
    orderBy: [
      { status: "asc" },
      { expiration: "asc" },
    ],
    include: {
      _count: {
        select: {
          derivedLots: true,
        },
      },
    },
  });
};

const ensureHealthCenterAccessible = async (user, healthCenterId) => {
  const healthCenter = await prisma.healthCenter.findUnique({
    where: { id: healthCenterId },
    include: {
      district: {
        include: {
          commune: {
            select: { regionId: true },
          },
        },
      },
    },
  });

  if (!healthCenter) {
    throw createHttpError(404, "Centre de santé introuvable");
  }

  if (user.role === "DISTRICT") {
    const districtId = await resolveDistrictIdForUser(user);
    if (!districtId || healthCenter.districtId !== districtId) {
      throw createHttpError(403, "Centre hors de votre district");
    }
  } else if (user.role === "REGIONAL") {
    const regionId = await resolveRegionIdForUser(user);
    const centerRegionId = healthCenter.district?.commune?.regionId ?? null;
    if (!regionId || centerRegionId !== regionId) {
      throw createHttpError(403, "Centre hors de votre région");
    }
  }

  return healthCenter;
};

const deleteStockForOwner = async ({ ownerType, ownerId, vaccineId }) => {
  await prisma.$transaction(async (tx) => {
    let stock = null;
    switch (ownerType) {
      case OWNER_TYPES.NATIONAL:
        stock = await tx.stockNATIONAL.findUnique({
          where: { vaccineId },
        });
        if (!stock) {
          throw createHttpError(404, "Stock national introuvable");
        }
        break;
      case OWNER_TYPES.REGIONAL: {
        const regionId = ownerId;
        stock = await tx.stockREGIONAL.findUnique({
          where: {
            vaccineId_regionId: {
              vaccineId,
              regionId,
            },
          },
        });
        if (!stock) {
          throw createHttpError(404, "Stock régional introuvable");
        }
        break;
      }
      case OWNER_TYPES.DISTRICT: {
        const districtId = ownerId;
        stock = await tx.stockDISTRICT.findUnique({
          where: {
            vaccineId_districtId: {
              vaccineId,
              districtId,
            },
          },
        });
        if (!stock) {
          throw createHttpError(404, "Stock district introuvable");
        }
        break;
      }
      case OWNER_TYPES.HEALTHCENTER: {
        const healthCenterId = ownerId;
        stock = await tx.stockHEALTHCENTER.findUnique({
          where: {
            vaccineId_healthCenterId: {
              vaccineId,
              healthCenterId,
            },
          },
        });
        if (!stock) {
          throw createHttpError(404, "Stock du centre introuvable");
        }
        break;
      }
      default:
        throw createHttpError(400, "Type de stock inconnu");
    }

    const normalizedOwnerId = normalizeOwnerIdValue(ownerType, ownerId);
    const lots = await tx.stockLot.findMany({
      where: {
        vaccineId,
        ownerType,
        ownerId: normalizedOwnerId,
      },
      select: { id: true },
    });

    for (const lot of lots) {
      await deleteLotCascade(tx, lot.id);
    }

    switch (ownerType) {
      case OWNER_TYPES.NATIONAL:
        await tx.stockNATIONAL.delete({ where: { vaccineId } });
        break;
      case OWNER_TYPES.REGIONAL:
        await tx.stockREGIONAL.delete({
          where: {
            vaccineId_regionId: {
              vaccineId,
              regionId: ownerId,
            },
          },
        });
        break;
      case OWNER_TYPES.DISTRICT:
        await tx.stockDISTRICT.delete({
          where: {
            vaccineId_districtId: {
              vaccineId,
              districtId: ownerId,
            },
          },
        });
        break;
      case OWNER_TYPES.HEALTHCENTER:
        await tx.stockHEALTHCENTER.delete({
          where: {
            vaccineId_healthCenterId: {
              vaccineId,
              healthCenterId: ownerId,
            },
          },
        });
        break;
      default:
        break;
    }
  });
};

const buildExpiredLotKey = (ownerType, ownerId, vaccineId) =>
  `${ownerType}::${ownerId ?? "root"}::${vaccineId}`;

const fetchExpiredLotsSet = async ({
  ownerType,
  ownerIds,
}) => {
  const where = {
    ownerType,
    status: LOT_STATUS.EXPIRED,
    remainingQuantity: { gt: 0 },
  };

  if (Array.isArray(ownerIds)) {
    const filtered = ownerIds.filter((value) => value != null);
    if (filtered.length > 0) {
      where.ownerId = { in: filtered };
    }
  } else if (ownerIds != null) {
    where.ownerId = ownerIds;
  }

  const lots = await prisma.stockLot.findMany({
    where,
    select: { ownerId: true, vaccineId: true },
  });

  return new Set(
    lots.map((lot) => buildExpiredLotKey(ownerType, lot.ownerId, lot.vaccineId)),
  );
};

const getStockNATIONAL = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const national = await prisma.stockNATIONAL.findMany({
      include: { vaccine: true },
      orderBy: { vaccine: { name: "asc" } },
    });

    const expiredSet = await fetchExpiredLotsSet({
      ownerType: OWNER_TYPES.NATIONAL,
    });

    const nationalWithFlag = national.map((stock) => ({
      ...stock,
      hasExpiredLot: expiredSet.has(
        buildExpiredLotKey(OWNER_TYPES.NATIONAL, null, stock.vaccineId),
      ),
    }));

    res.json({ national: nationalWithFlag });
  } catch (error) {
    next(error);
  }
};

const listNationalLots = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  const { vaccineId } = req.params;

  if (!vaccineId) {
    return res.status(400).json({
      message: "vaccineId est requis pour consulter les lots",
    });
  }

  try {
    const lots = await fetchLotsForOwner({
      vaccineId,
      ownerType: OWNER_TYPES.NATIONAL,
      ownerId: null,
    });

    res.json(buildLotsResponse(lots));
  } catch (error) {
    next(error);
  }
};

const listRegionalLots = async (req, res, next) => {
  if (!["NATIONAL", "REGIONAL"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  const { vaccineId } = req.params;
  let regionId =
    typeof req.query.regionId === "string" ? req.query.regionId : null;

  if (!vaccineId) {
    return res
      .status(400)
      .json({ message: "vaccineId est requis pour consulter les lots" });
  }

  try {
    if (req.user.role === "REGIONAL") {
      regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        throw createHttpError(400, "Impossible d'identifier votre région");
      }
    } else if (!regionId) {
      throw createHttpError(400, "regionId est requis");
    }

    const lots = await fetchLotsForOwner({
      vaccineId,
      ownerType: OWNER_TYPES.REGIONAL,
      ownerId: regionId,
    });

    res.json(buildLotsResponse(lots));
  } catch (error) {
    next(error);
  }
};

const listDistrictLots = async (req, res, next) => {
  if (!["NATIONAL", "REGIONAL", "DISTRICT"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  const { vaccineId } = req.params;
  let districtId =
    typeof req.query.districtId === "string" ? req.query.districtId : null;

  if (!vaccineId) {
    return res
      .status(400)
      .json({ message: "vaccineId est requis pour consulter les lots" });
  }

  try {
    if (req.user.role === "DISTRICT") {
      districtId = await resolveDistrictIdForUser(req.user);
      if (!districtId) {
        throw createHttpError(400, "Impossible d'identifier votre district");
      }
    } else if (!districtId) {
      throw createHttpError(400, "districtId est requis");
    }

    if (req.user.role === "REGIONAL") {
      const regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        throw createHttpError(400, "Impossible d'identifier votre région");
      }
      await ensureDistrictBelongsToRegion(districtId, regionId);
    }

    const lots = await fetchLotsForOwner({
      vaccineId,
      ownerType: OWNER_TYPES.DISTRICT,
      ownerId: districtId,
    });

    res.json(buildLotsResponse(lots));
  } catch (error) {
    next(error);
  }
};

const listHealthCenterLots = async (req, res, next) => {
  if (
    !["NATIONAL", "REGIONAL", "DISTRICT", "AGENT"].includes(req.user.role)
  ) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  const { vaccineId } = req.params;
  let healthCenterId =
    typeof req.query.healthCenterId === "string"
      ? req.query.healthCenterId
      : null;

  if (!vaccineId) {
    return res
      .status(400)
      .json({ message: "vaccineId est requis pour consulter les lots" });
  }

  try {
    if (req.user.role === "AGENT") {
      if (req.user.agentLevel !== "ADMIN") {
        return res.status(403).json({ message: "Accès refusé" });
      }
      healthCenterId = await resolveHealthCenterIdForUser(req.user);
      if (!healthCenterId) {
        throw createHttpError(
          400,
          "Impossible d'identifier votre centre de santé",
        );
      }
    } else if (!healthCenterId) {
      throw createHttpError(400, "healthCenterId est requis");
    } else if (req.user.role === "DISTRICT" || req.user.role === "REGIONAL") {
      await ensureHealthCenterAccessible(req.user, healthCenterId);
    }

    const lots = await fetchLotsForOwner({
      vaccineId,
      ownerType: OWNER_TYPES.HEALTHCENTER,
      ownerId: healthCenterId,
    });

    res.json(buildLotsResponse(lots));
  } catch (error) {
    next(error);
  }
};

const getStockREGIONAL = async (req, res, next) => {
  if (!["NATIONAL", "REGIONAL"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    let whereClause = {};
    let resolvedDistrictId = null;

    if (req.user.role === "REGIONAL") {
      const regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        return res.json({ regional: [] });
      }
      whereClause = { regionId };
    }

    const regional = await prisma.stockREGIONAL.findMany({
      where: whereClause,
      include: { vaccine: true, region: true },
      orderBy: [
        { vaccine: { name: "asc" } },
        { region: { name: "asc" } },
      ],
    });

  const regionIds = regional
      .map((stock) => stock.regionId ?? null)
      .filter((id) => id != null);

    const expiredSet = await fetchExpiredLotsSet({
      ownerType: OWNER_TYPES.REGIONAL,
      ownerIds: regionIds.length > 0 ? regionIds : undefined,
    });

    const regionalWithFlag = regional.map((stock) => ({
      ...stock,
      hasExpiredLot: expiredSet.has(
        buildExpiredLotKey(
          OWNER_TYPES.REGIONAL,
          stock.regionId ?? null,
          stock.vaccineId,
        ),
      ),
    }));

    res.json({ regional: regionalWithFlag });
  } catch (error) {
    next(error);
  }
};

const getStockDISTRICT = async (req, res, next) => {
  if (!["NATIONAL", "REGIONAL", "DISTRICT"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    let whereClause = {};

    if (req.user.role === "REGIONAL") {
      const regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        return res.json({ district: [] });
      }

      const districtIds = await fetchDistrictIdsForRegion(regionId);
      if (!districtIds.length) {
        return res.json({ district: [] });
      }

      whereClause = { districtId: { in: districtIds } };
    } else if (req.user.role === "DISTRICT") {
      const districtId = await resolveDistrictIdForUser(req.user);
      if (!districtId) {
        return res.json({ district: [] });
      }
      resolvedDistrictId = districtId;
      whereClause = { districtId };
    }

    const district = await prisma.stockDISTRICT.findMany({
      where: whereClause,
      include: { vaccine: true, district: { include: { commune: true } } },
      orderBy: [
        { vaccine: { name: "asc" } },
        { district: { name: "asc" } },
      ],
    });

  const districtIds = district.map((stock) => stock.districtId ?? null).filter(Boolean);
    const expiredSet = await fetchExpiredLotsSet({
      ownerType: OWNER_TYPES.DISTRICT,
    ownerIds: districtIds.length > 0 ? districtIds : undefined,
    });

    const districtWithFlag = district.map((stock) => ({
      ...stock,
      hasExpiredLot: expiredSet.has(
        buildExpiredLotKey(
          OWNER_TYPES.DISTRICT,
          stock.districtId ?? null,
          stock.vaccineId,
        ),
      ),
    }));

    res.json({
      districtId: resolvedDistrictId,
      district: districtWithFlag,
    });
  } catch (error) {
    next(error);
  }
};

const getStockHEALTHCENTER = async (req, res, next) => {
  if (
    !["NATIONAL", "REGIONAL", "DISTRICT", "AGENT"].includes(req.user.role)
  ) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    let whereClause = {};

    if (req.user.role === "AGENT") {
      if (req.user.agentLevel !== "ADMIN") {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const healthCenterId = await resolveHealthCenterIdForUser(req.user);
      if (!healthCenterId) {
        return res.json({ healthCenter: [] });
      }

      whereClause = { healthCenterId };
    } else if (req.user.role === "DISTRICT") {
      const districtId = await resolveDistrictIdForUser(req.user);
      if (!districtId) {
        return res.json({ healthCenter: [] });
      }
      whereClause = {
        healthCenter: {
          districtId,
        },
      };
    } else if (req.user.role === "REGIONAL") {
      const regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        return res.json({ healthCenter: [] });
      }
      whereClause = {
        healthCenter: {
          district: {
            commune: {
              regionId,
            },
          },
        },
      };
    }

    const healthCenter = await prisma.stockHEALTHCENTER.findMany({
      where: whereClause,
      include: { vaccine: true, healthCenter: true },
      orderBy: [
        { vaccine: { name: "asc" } },
        { healthCenter: { name: "asc" } },
      ],
    });

  const centerIds = healthCenter
      .map((stock) => stock.healthCenterId ?? null)
      .filter(Boolean);

    const expiredSet = await fetchExpiredLotsSet({
      ownerType: OWNER_TYPES.HEALTHCENTER,
      ownerIds: centerIds.length > 0 ? centerIds : undefined,
    });

    const healthCenterWithFlag = healthCenter.map((stock) => ({
      ...stock,
      hasExpiredLot: expiredSet.has(
        buildExpiredLotKey(
          OWNER_TYPES.HEALTHCENTER,
          stock.healthCenterId ?? null,
          stock.vaccineId,
        ),
      ),
    }));

    res.json({ healthCenter: healthCenterWithFlag });
  } catch (error) {
    next(error);
  }
};

const createStockNATIONAL = async (req, res, next) => {

  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }  

  try {
    const newStockNATIONAL = await prisma.StockNATIONAL.create({
      data: {
        vaccineId: req.body.vaccineId,
      },
    });

    res.status(201).json(newStockNATIONAL);

  } catch (error) {
    next(error);
  }
};

const createStockREGIONAL = async (req, res, next) => {

  if (req.user.role !== "NATIONAL" && req.user.role !== "REGIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }  

  try {
    const { vaccineId } = req.body ?? {};
    let regionId = req.body.regionId;

    if (!vaccineId) {
      return res
        .status(400)
        .json({ message: "vaccineId est requis pour créer un stock régional" });
    }

    if (req.user.role === "REGIONAL") {
      regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        return res.status(400).json({
          message: "Votre compte n'est pas rattaché à une région",
        });
      }
    } else if (!regionId) {
      return res
        .status(400)
        .json({ message: "regionId est requis pour créer un stock régional" });
    }

    const newStockREGIONAL = await prisma.StockREGIONAL.create({
      data: {
        vaccineId,
        regionId,
      },
    });

    res.status(201).json(newStockREGIONAL);

  } catch (error) {
    next(error);
  }
};

const createStockDISTRICT = async (req, res, next) => {

  if (req.user.role !== "REGIONAL" && req.user.role !== "DISTRICT") {
    return res.status(403).json({ message: "Accès refusé" });
  }  

  try {
    const { vaccineId, districtId } = req.body ?? {};

    if (!vaccineId || !districtId) {
      return res.status(400).json({ message: "vaccineId et districtId sont requis" });
    }

    if (req.user.role === "REGIONAL") {
      const regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        return res.status(400).json({ message: "Votre compte n'est pas rattaché à une région" });
      }

      try {
        await ensureDistrictBelongsToRegion(districtId, regionId);
      } catch (validationError) {
        if (validationError.status) {
          return res.status(validationError.status).json({ message: validationError.message });
        }
        throw validationError;
      }
    } else if (req.user.role === "DISTRICT") {
      const userDistrictId = await resolveDistrictIdForUser(req.user);
      if (!userDistrictId || userDistrictId !== districtId) {
        return res.status(403).json({ message: "Accès refusé pour ce district" });
      }
    }

    const newStockDISTRICT = await prisma.StockDISTRICT.create({
      data: {
        vaccineId,
        districtId,
      },
    });

    res.status(201).json(newStockDISTRICT);

  } catch (error) {
    next(error);
  }
};

const createStockHEALTHCENTER = async (req, res, next) => {

  if (req.user.role !== "DISTRICT" && req.user.role !== "AGENT") {
    return res.status(403).json({ message: "Accès refusé" });
  }  

  try {
    const { vaccineId, healthCenterId } = req.body ?? {};

    if (!vaccineId) {
      return res.status(400).json({ message: "vaccineId est requis" });
    }

    let targetHealthCenterId = healthCenterId;

    if (req.user.role === "AGENT") {
      if (req.user.agentLevel !== "ADMIN") {
        return res.status(403).json({ message: "Accès refusé" });
      }

      targetHealthCenterId = await resolveHealthCenterIdForUser(req.user);
      if (!targetHealthCenterId) {
        return res.status(400).json({
          message: "Votre compte n'est pas rattaché à un centre de santé",
        });
      }
    } else {
      if (!healthCenterId) {
        return res
          .status(400)
          .json({ message: "healthCenterId est requis pour créer un stock" });
      }

      const districtId = await resolveDistrictIdForUser(req.user);
      if (!districtId) {
        return res.status(400).json({
          message: "Votre compte n'est pas rattaché à un district",
        });
      }

      const center = await prisma.healthCenter.findUnique({
        where: { id: healthCenterId },
        select: { districtId: true },
      });

      if (!center) {
        return res.status(404).json({ message: "Centre de santé introuvable" });
      }

      if (center.districtId !== districtId) {
        return res
          .status(403)
          .json({ message: "Ce centre de santé n'appartient pas à votre district" });
      }

      targetHealthCenterId = healthCenterId;
    }

    const newStockHEALTHCENTER = await prisma.StockHEALTHCENTER.create({
      data: {
        vaccineId,
        healthCenterId: targetHealthCenterId,
      },
    });

    res.status(201).json(newStockHEALTHCENTER);

  } catch (error) {
    next(error);
  }
};

const addStockNATIONAL = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, quantity, expiration } = req.body ?? {};
    const qty = Number(quantity);

    if (!vaccineId || !Number.isFinite(qty) || qty <= 0) {
      return res
        .status(400)
        .json({ message: "vaccineId et quantity (> 0) sont requis" });
    }

    if (!expiration) {
      return res.status(400).json({
        message: "La date d'expiration est requise pour créer un nouveau lot",
      });
    }

    let updatedStock = null;
    let createdLot = null;

    await prisma.$transaction(async (tx) => {
      const stock = await tx.stockNATIONAL.findUnique({
        where: { vaccineId },
      });

      if (!stock) {
        throw Object.assign(new Error("Stock national introuvable"), {
          status: 404,
        });
      }

      await tx.stockNATIONAL.update({
        where: { vaccineId },
        data: { quantity: (stock.quantity ?? 0) + qty },
      });

      createdLot = await createLot(tx, {
        vaccineId,
        ownerType: OWNER_TYPES.NATIONAL,
        ownerId: null,
        quantity: qty,
        expiration,
      });

      updatedStock = await tx.stockNATIONAL.findUnique({
        where: { vaccineId },
        include: { vaccine: true },
      });
    });

    return res.json({ stock: updatedStock, lot: createdLot });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

const addStockREGIONAL = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, regionId, quantity } = req.body ?? {};
    const qty = Number(quantity);

    if (!vaccineId || !regionId || !Number.isFinite(qty) || qty <= 0) {
      return res
        .status(400)
        .json({ message: "vaccineId, regionId et quantity (> 0) sont requis" });
    }

    let updatedNational = null;
    let updatedRegional = null;

    await prisma.$transaction(async (tx) => {
      const regionalStock = await tx.stockREGIONAL.findUnique({
        where: { vaccineId_regionId: { vaccineId, regionId } },
      });

      if (!regionalStock) {
        throw Object.assign(new Error("Stock régional introuvable"), {
          status: 404,
        });
      }

      const nationalStock = await tx.stockNATIONAL.findUnique({
        where: { vaccineId },
      });

      if (!nationalStock || (nationalStock.quantity ?? 0) < qty) {
        throw Object.assign(
          new Error("Quantité insuffisante dans le stock national"),
          { status: 400 },
        );
      }

      const allocations = await consumeLots(tx, {
        vaccineId,
        ownerType: OWNER_TYPES.NATIONAL,
        ownerId: null,
        quantity: qty,
      });

      await tx.stockNATIONAL.update({
        where: { vaccineId },
        data: { quantity: (nationalStock.quantity ?? 0) - qty },
      });

      await tx.stockREGIONAL.update({
        where: { vaccineId_regionId: { vaccineId, regionId } },
        data: { quantity: (regionalStock.quantity ?? 0) + qty },
      });

      for (const allocation of allocations) {
        await createLot(tx, {
          vaccineId,
          ownerType: OWNER_TYPES.REGIONAL,
          ownerId: regionId,
          quantity: allocation.quantity,
          expiration: allocation.expiration,
          sourceLotId: allocation.lotId,
          status: allocation.status ?? LOT_STATUS.VALID,
        });
      }

      await recordTransfer(tx, {
        vaccineId,
        fromType: OWNER_TYPES.NATIONAL,
        fromId: null,
        toType: OWNER_TYPES.REGIONAL,
        toId: regionId,
        allocations,
      });

      updatedNational = await tx.stockNATIONAL.findUnique({
        where: { vaccineId },
        include: { vaccine: true },
      });

      updatedRegional = await tx.stockREGIONAL.findUnique({
        where: { vaccineId_regionId: { vaccineId, regionId } },
        include: { vaccine: true, region: true },
      });
    });

    res.json({ national: updatedNational, regional: updatedRegional });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

const addStockDISTRICT = async (req, res, next) => {
  if (!["REGIONAL", "NATIONAL"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, districtId, quantity } = req.body ?? {};
    const qty = Number(quantity);

    if (!vaccineId || !districtId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({
        message: "vaccineId, districtId et quantity (> 0) sont requis",
      });
    }

    let regionIdPayload = req.body.regionId;

    if (req.user.role === "REGIONAL") {
      regionIdPayload = await resolveRegionIdForUser(req.user);
      if (!regionIdPayload) {
        return res.status(400).json({
          message: "Votre compte n'est pas rattaché à une région",
        });
      }
      try {
        await ensureDistrictBelongsToRegion(districtId, regionIdPayload);
      } catch (validationError) {
        if (validationError.status) {
          return res.status(validationError.status).json({ message: validationError.message });
        }
        throw validationError;
      }
    } else if (!regionIdPayload) {
      return res.status(400).json({
        message: "regionId est requis pour ce transfert",
      });
    }

    if (req.user.role === "NATIONAL") {
      try {
        await ensureDistrictBelongsToRegion(districtId, regionIdPayload);
      } catch (validationError) {
        if (validationError.status) {
          return res
            .status(validationError.status)
            .json({ message: validationError.message });
        }
        throw validationError;
      }
    }

    let updatedRegional = null;
    let updatedDistrict = null;

    await prisma.$transaction(async (tx) => {
      const districtStock = await tx.stockDISTRICT.findUnique({
        where: { vaccineId_districtId: { vaccineId, districtId } },
      });

      if (!districtStock) {
        throw Object.assign(new Error("Stock district introuvable"), {
          status: 404,
        });
      }

      const regionalStock = await tx.stockREGIONAL.findUnique({
        where: { vaccineId_regionId: { vaccineId, regionId: regionIdPayload } },
      });

      if (!regionalStock || (regionalStock.quantity ?? 0) < qty) {
        throw Object.assign(
          new Error("Quantité insuffisante dans le stock régional"),
          { status: 400 },
        );
      }

      const allocations = await consumeLots(tx, {
        vaccineId,
        ownerType: OWNER_TYPES.REGIONAL,
        ownerId: regionIdPayload,
        quantity: qty,
      });

      await tx.stockREGIONAL.update({
        where: { vaccineId_regionId: { vaccineId, regionId: regionIdPayload } },
        data: { quantity: (regionalStock.quantity ?? 0) - qty },
      });

      await tx.stockDISTRICT.update({
        where: { vaccineId_districtId: { vaccineId, districtId } },
        data: { quantity: (districtStock.quantity ?? 0) + qty },
      });

      for (const allocation of allocations) {
        await createLot(tx, {
          vaccineId,
          ownerType: OWNER_TYPES.DISTRICT,
          ownerId: districtId,
          quantity: allocation.quantity,
          expiration: allocation.expiration,
          sourceLotId: allocation.lotId,
          status: allocation.status ?? LOT_STATUS.VALID,
        });
      }

      await recordTransfer(tx, {
        vaccineId,
        fromType: OWNER_TYPES.REGIONAL,
        fromId: regionIdPayload,
        toType: OWNER_TYPES.DISTRICT,
        toId: districtId,
        allocations,
      });

      updatedRegional = await tx.stockREGIONAL.findUnique({
        where: { vaccineId_regionId: { vaccineId, regionId: regionIdPayload } },
        include: { vaccine: true, region: true },
      });

      updatedDistrict = await tx.stockDISTRICT.findUnique({
        where: { vaccineId_districtId: { vaccineId, districtId } },
        include: { vaccine: true, district: { include: { commune: true } } },
      });
    });

    res.json({ regional: updatedRegional, district: updatedDistrict });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

const addStockHEALTHCENTER = async (req, res, next) => {
  if (req.user.role !== "DISTRICT") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, healthCenterId, quantity } = req.body ?? {};
    const qty = Number(quantity);

    if (
      !vaccineId ||
      !healthCenterId ||
      !Number.isFinite(qty) ||
      qty <= 0
    ) {
      return res.status(400).json({
        message:
          "vaccineId, healthCenterId et quantity (> 0) sont requis",
      });
    }

    const districtId = await resolveDistrictIdForUser(req.user);
    if (!districtId) {
      return res.status(400).json({
        message: "Votre compte n'est pas rattaché à un district",
      });
    }

    const healthCenter = await prisma.healthCenter.findUnique({
      where: { id: healthCenterId },
      select: { districtId: true },
    });

    if (!healthCenter) {
      return res.status(404).json({ message: "Centre de santé introuvable" });
    }

    if (healthCenter.districtId !== districtId) {
      return res
        .status(403)
        .json({ message: "Ce centre de santé n'appartient pas à votre district" });
    }

    let updatedDistrict = null;
    let updatedHealthCenter = null;

    await prisma.$transaction(async (tx) => {
      const healthCenterStock = await tx.stockHEALTHCENTER.findUnique({
        where: { vaccineId_healthCenterId: { vaccineId, healthCenterId } },
      });

      if (!healthCenterStock) {
        throw Object.assign(
          new Error("Stock centre de santé introuvable"),
          { status: 404 },
        );
      }

      const districtStock = await tx.stockDISTRICT.findUnique({
        where: { vaccineId_districtId: { vaccineId, districtId } },
      });

      if (!districtStock || (districtStock.quantity ?? 0) < qty) {
        throw Object.assign(
          new Error("Quantité insuffisante dans le stock district"),
          { status: 400 },
        );
      }

      const allocations = await consumeLots(tx, {
        vaccineId,
        ownerType: OWNER_TYPES.DISTRICT,
        ownerId: districtId,
        quantity: qty,
      });

      await tx.stockDISTRICT.update({
        where: { vaccineId_districtId: { vaccineId, districtId } },
        data: { quantity: (districtStock.quantity ?? 0) - qty },
      });

      await tx.stockHEALTHCENTER.update({
        where: { vaccineId_healthCenterId: { vaccineId, healthCenterId } },
        data: { quantity: (healthCenterStock.quantity ?? 0) + qty },
      });

      for (const allocation of allocations) {
        await createLot(tx, {
          vaccineId,
          ownerType: OWNER_TYPES.HEALTHCENTER,
          ownerId: healthCenterId,
          quantity: allocation.quantity,
          expiration: allocation.expiration,
          sourceLotId: allocation.lotId,
          status: allocation.status ?? LOT_STATUS.VALID,
        });
      }

      await recordTransfer(tx, {
        vaccineId,
        fromType: OWNER_TYPES.DISTRICT,
        fromId: districtId,
        toType: OWNER_TYPES.HEALTHCENTER,
        toId: healthCenterId,
        allocations,
      });

      updatedDistrict = await tx.stockDISTRICT.findUnique({
        where: { vaccineId_districtId: { vaccineId, districtId } },
        include: { vaccine: true, district: { include: { commune: true } } },
      });

      updatedHealthCenter = await tx.stockHEALTHCENTER.findUnique({
        where: { vaccineId_healthCenterId: { vaccineId, healthCenterId } },
        include: { vaccine: true, healthCenter: true },
      });
    });

    res.json({ district: updatedDistrict, healthCenter: updatedHealthCenter });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};


const updateStockNATIONAL = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, quantity, expiration } = req.body ?? {};
    const qty = Number(quantity);

    if (!vaccineId || !Number.isFinite(qty) || qty < 0) {
      return res
        .status(400)
        .json({ message: "vaccineId et quantity (>= 0) sont requis" });
    }

    let updatedStock = null;

    await prisma.$transaction(async (tx) => {
      const stock = await tx.stockNATIONAL.findUnique({ where: { vaccineId } });
      if (!stock) {
        throw Object.assign(new Error("Stock national introuvable"), {
          status: 404,
        });
      }

      const previousQuantity = stock.quantity ?? 0;
      const delta = qty - previousQuantity;

      await tx.stockNATIONAL.update({
        where: { vaccineId },
        data: { quantity: qty },
      });

      if (delta > 0) {
        if (!expiration) {
          throw Object.assign(
            new Error(
              "La date d'expiration est requise pour l'ajout de nouveaux lots",
            ),
            { status: 400 },
          );
        }

        await createLot(tx, {
          vaccineId,
          ownerType: OWNER_TYPES.NATIONAL,
          ownerId: null,
          quantity: delta,
          expiration,
        });
      }

      await updateNearestExpiration(tx, {
        vaccineId,
        ownerType: OWNER_TYPES.NATIONAL,
        ownerId: null,
      });

      updatedStock = await tx.stockNATIONAL.findUnique({
        where: { vaccineId },
        include: { vaccine: true },
      });
    });

    res.json(updatedStock);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

const updateStockREGIONAL = async (req, res, next) => {
  if (!["NATIONAL", "REGIONAL"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, quantity, expiration } = req.body ?? {};
    const qty = Number(quantity);

    let regionId = req.body.regionId;

    if (req.user.role === "REGIONAL") {
      regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        return res.status(400).json({
          message: "Votre compte n'est pas rattaché à une région",
        });
      }
    }

    if (!vaccineId || !regionId || !Number.isFinite(qty) || qty < 0) {
      return res
        .status(400)
        .json({ message: "vaccineId, regionId et quantity (>= 0) sont requis" });
    }

    const stock = await prisma.stockREGIONAL.findFirst({
      where: { vaccineId_regionId: { vaccineId, regionId } },
    });

    let updated = null;

    await prisma.$transaction(async (tx) => {
      const current = await tx.stockREGIONAL.findUnique({
        where: { vaccineId_regionId: { vaccineId, regionId } },
      });

      if (!current) {
        throw Object.assign(new Error("Stock régional introuvable"), {
          status: 404,
        });
      }

      const previousQuantity = current.quantity ?? 0;
      const delta = qty - previousQuantity;

      await tx.stockREGIONAL.update({
        where: { vaccineId_regionId: { vaccineId, regionId } },
        data: { quantity: qty },
      });

      if (delta > 0) {
        if (!expiration) {
          throw Object.assign(
            new Error(
              "La date d'expiration est requise pour l'ajout de nouveaux lots",
            ),
            { status: 400 },
          );
        }

        await createLot(tx, {
          vaccineId,
          ownerType: OWNER_TYPES.REGIONAL,
          ownerId: regionId,
          quantity: delta,
          expiration,
        });
      }

      await updateNearestExpiration(tx, {
        vaccineId,
        ownerType: OWNER_TYPES.REGIONAL,
        ownerId: regionId,
      });

      updated = await tx.stockREGIONAL.findUnique({
        where: { vaccineId_regionId: { vaccineId, regionId } },
        include: { vaccine: true, region: true },
      });
    });

    res.json(updated);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

const updateStockDISTRICT = async (req, res, next) => {
  if (!["REGIONAL", "DISTRICT"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, districtId, quantity, expiration } = req.body ?? {};
    const qty = Number(quantity);

    if (!vaccineId || !districtId || !Number.isFinite(qty) || qty < 0) {
      return res.status(400).json({
        message: "vaccineId, districtId et quantity (>= 0) sont requis",
      });
    }

    if (req.user.role === "REGIONAL") {
      const regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        return res.status(400).json({
          message: "Votre compte n'est pas rattaché à une région",
        });
      }
      try {
        await ensureDistrictBelongsToRegion(districtId, regionId);
      } catch (validationError) {
        if (validationError.status) {
          return res.status(validationError.status).json({ message: validationError.message });
        }
        throw validationError;
      }
    } else {
      const userDistrictId = await resolveDistrictIdForUser(req.user);
      if (!userDistrictId || userDistrictId !== districtId) {
        return res.status(403).json({ message: "Accès refusé pour ce district" });
      }
    }

    const stock = await prisma.stockDISTRICT.findUnique({
      where: { vaccineId_districtId: { vaccineId, districtId } },
    });

    let updated = null;

    await prisma.$transaction(async (tx) => {
      const current = await tx.stockDISTRICT.findUnique({
        where: { vaccineId_districtId: { vaccineId, districtId } },
      });

      if (!current) {
        throw Object.assign(new Error("Stock district introuvable"), {
          status: 404,
        });
      }

      const previousQuantity = current.quantity ?? 0;
      const delta = qty - previousQuantity;

      await tx.stockDISTRICT.update({
        where: { vaccineId_districtId: { vaccineId, districtId } },
        data: { quantity: qty },
      });

      if (delta > 0) {
        if (!expiration) {
          throw Object.assign(
            new Error(
              "La date d'expiration est requise pour l'ajout de nouveaux lots",
            ),
            { status: 400 },
          );
        }

        await createLot(tx, {
          vaccineId,
          ownerType: OWNER_TYPES.DISTRICT,
          ownerId: districtId,
          quantity: delta,
          expiration,
        });
      }

      await updateNearestExpiration(tx, {
        vaccineId,
        ownerType: OWNER_TYPES.DISTRICT,
        ownerId: districtId,
      });

      updated = await tx.stockDISTRICT.findUnique({
        where: { vaccineId_districtId: { vaccineId, districtId } },
        include: { vaccine: true, district: { include: { commune: true } } },
      });
    });

    res.json(updated);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

const updateStockHEALTHCENTER = async (req, res, next) => {
  if (!["DISTRICT", "AGENT"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, healthCenterId, quantity, expiration } = req.body ?? {};
    const qty = Number(quantity);

    if (!vaccineId || !healthCenterId || !Number.isFinite(qty) || qty < 0) {
      return res.status(400).json({
        message: "vaccineId, healthCenterId et quantity (>= 0) sont requis",
      });
    }

    const stock = await prisma.stockHEALTHCENTER.findUnique({
      where: { vaccineId_healthCenterId: { vaccineId, healthCenterId } },
    });

    let updated = null;

    await prisma.$transaction(async (tx) => {
      const current = await tx.stockHEALTHCENTER.findUnique({
        where: { vaccineId_healthCenterId: { vaccineId, healthCenterId } },
      });

      if (!current) {
        throw Object.assign(
          new Error("Stock centre de santé introuvable"),
          { status: 404 },
        );
      }

      const previousQuantity = current.quantity ?? 0;
      const delta = qty - previousQuantity;

      await tx.stockHEALTHCENTER.update({
        where: { vaccineId_healthCenterId: { vaccineId, healthCenterId } },
        data: { quantity: qty },
      });

      if (delta > 0) {
        if (!expiration) {
          throw Object.assign(
            new Error(
              "La date d'expiration est requise pour l'ajout de nouveaux lots",
            ),
            { status: 400 },
          );
        }

        await createLot(tx, {
          vaccineId,
          ownerType: OWNER_TYPES.HEALTHCENTER,
          ownerId: healthCenterId,
          quantity: delta,
          expiration,
        });
      }

      await updateNearestExpiration(tx, {
        vaccineId,
        ownerType: OWNER_TYPES.HEALTHCENTER,
        ownerId: healthCenterId,
      });

      updated = await tx.stockHEALTHCENTER.findUnique({
        where: { vaccineId_healthCenterId: { vaccineId, healthCenterId } },
        include: { vaccine: true, healthCenter: true },
      });
    });

    res.json(updated);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

const deleteLot = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "lotId est requis" });
  }

  try {
    let deletedIds = [];

    await prisma.$transaction(async (tx) => {
      const existing = await tx.stockLot.findUnique({ where: { id } });
      if (!existing) {
        throw Object.assign(new Error("Lot introuvable"), { status: 404 });
      }

      deletedIds = await deleteLotCascade(tx, id);
    });

    res.json({ deletedIds });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

const reduceStockNATIONAL = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, quantity } = req.body;
    const qty = Number(quantity);

    if (!vaccineId || !Number.isFinite(qty) || qty <= 0) {
      return res
        .status(400)
        .json({ message: "vaccineId et quantity (> 0) sont requis" });
    }

    const stock = await prisma.stockNATIONAL.findUnique({ where: { vaccineId } });
    if (!stock || (stock.quantity ?? 0) < qty) {
      return res.status(400).json({ message: "Quantité insuffisante" });
    }

    const updated = await prisma.stockNATIONAL.update({
      where: { vaccineId },
      data: { quantity: (stock.quantity ?? 0) - qty },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const reduceStockREGIONAL = async (req, res, next) => {
  if (!["NATIONAL", "REGIONAL"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, quantity } = req.body;
    const qty = Number(quantity);

    let regionId = req.body.regionId;

    if (req.user.role === "REGIONAL") {
      regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        return res.status(400).json({
          message: "Votre compte n'est pas rattaché à une région",
        });
      }
    }

    if (!vaccineId || !regionId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({
        message: "vaccineId, regionId et quantity (> 0) sont requis",
      });
    }

    const stock = await prisma.stockREGIONAL.findUnique({
      where: { vaccineId_regionId: { vaccineId, regionId } },
    });

    if (!stock || (stock.quantity ?? 0) < qty) {
      return res.status(400).json({ message: "Quantité insuffisante" });
    }

    const updated = await prisma.stockREGIONAL.update({
      where: { vaccineId_regionId: { vaccineId, regionId } },
      data: { quantity: (stock.quantity ?? 0) - qty },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const reduceStockDISTRICT = async (req, res, next) => {
  if (!["REGIONAL", "DISTRICT"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, districtId, quantity } = req.body;
    const qty = Number(quantity);

    if (!vaccineId || !districtId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({
        message: "vaccineId, districtId et quantity (> 0) sont requis",
      });
    }

    if (req.user.role === "REGIONAL") {
      const regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        return res.status(400).json({
          message: "Votre compte n'est pas rattaché à une région",
        });
      }
      try {
        await ensureDistrictBelongsToRegion(districtId, regionId);
      } catch (validationError) {
        if (validationError.status) {
          return res.status(validationError.status).json({ message: validationError.message });
        }
        throw validationError;
      }
    } else {
      const userDistrictId = await resolveDistrictIdForUser(req.user);
      if (!userDistrictId || userDistrictId !== districtId) {
        return res.status(403).json({ message: "Accès refusé pour ce district" });
      }
    }

    const stock = await prisma.stockDISTRICT.findUnique({
      where: { vaccineId_districtId: { vaccineId, districtId } },
    });

    if (!stock || (stock.quantity ?? 0) < qty) {
      return res.status(400).json({ message: "Quantité insuffisante" });
    }

    const updated = await prisma.stockDISTRICT.update({
      where: { vaccineId_districtId: { vaccineId, districtId } },
      data: { quantity: (stock.quantity ?? 0) - qty },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const reduceStockHEALTHCENTER = async (req, res, next) => {
  if (!["DISTRICT", "AGENT"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, healthCenterId, quantity } = req.body;
    const qty = Number(quantity);

    if (!vaccineId || !healthCenterId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({
        message: "vaccineId, healthCenterId et quantity (> 0) sont requis",
      });
    }

    const stock = await prisma.stockHEALTHCENTER.findUnique({
      where: { vaccineId_healthCenterId: { vaccineId, healthCenterId } },
    });

    if (!stock || (stock.quantity ?? 0) < qty) {
      return res.status(400).json({ message: "Quantité insuffisante" });
    }

    const updated = await prisma.stockHEALTHCENTER.update({
      where: { vaccineId_healthCenterId: { vaccineId, healthCenterId } },
      data: { quantity: (stock.quantity ?? 0) - qty },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteStockNATIONAL = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  const { vaccineId } = req.body ?? {};

  if (!vaccineId) {
    return res.status(400).json({ message: "vaccineId est requis" });
  }

  try {
    await deleteStockForOwner({
      ownerType: OWNER_TYPES.NATIONAL,
      ownerId: null,
      vaccineId,
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const deleteStockREGIONAL = async (req, res, next) => {
  if (!["NATIONAL", "REGIONAL"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  const { vaccineId, regionId: bodyRegionId } = req.body ?? {};
  let regionId = bodyRegionId ?? null;

  if (!vaccineId) {
    return res.status(400).json({ message: "vaccineId est requis" });
  }

  try {
    if (req.user.role === "REGIONAL") {
      regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        throw createHttpError(400, "Impossible d'identifier votre région");
      }
    } else if (!regionId) {
      throw createHttpError(400, "regionId est requis");
    }

    await deleteStockForOwner({
      ownerType: OWNER_TYPES.REGIONAL,
      ownerId: regionId,
      vaccineId,
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const deleteStockDISTRICT = async (req, res, next) => {
  if (!["NATIONAL", "REGIONAL", "DISTRICT"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  const { vaccineId, districtId: bodyDistrictId } = req.body ?? {};
  let districtId = bodyDistrictId ?? null;

  if (!vaccineId) {
    return res.status(400).json({ message: "vaccineId est requis" });
  }

  try {
    if (req.user.role === "DISTRICT") {
      districtId = await resolveDistrictIdForUser(req.user);
      if (!districtId) {
        throw createHttpError(400, "Impossible d'identifier votre district");
      }
    } else if (!districtId) {
      throw createHttpError(400, "districtId est requis");
    }

    if (req.user.role === "REGIONAL") {
      const regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        throw createHttpError(400, "Impossible d'identifier votre région");
      }
      await ensureDistrictBelongsToRegion(districtId, regionId);
    }

    await deleteStockForOwner({
      ownerType: OWNER_TYPES.DISTRICT,
      ownerId: districtId,
      vaccineId,
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const deleteStockHEALTHCENTER = async (req, res, next) => {
  if (
    !["NATIONAL", "REGIONAL", "DISTRICT", "AGENT"].includes(req.user.role)
  ) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  const { vaccineId, healthCenterId: bodyHealthCenterId } = req.body ?? {};
  let healthCenterId = bodyHealthCenterId ?? null;

  if (!vaccineId) {
    return res.status(400).json({ message: "vaccineId est requis" });
  }

  try {
    if (req.user.role === "AGENT") {
      if (req.user.agentLevel !== "ADMIN") {
        return res.status(403).json({ message: "Accès refusé" });
      }
      healthCenterId = await resolveHealthCenterIdForUser(req.user);
      if (!healthCenterId) {
        throw createHttpError(
          400,
          "Impossible d'identifier votre centre de santé",
        );
      }
    } else if (!healthCenterId) {
      throw createHttpError(400, "healthCenterId est requis");
    } else if (
      req.user.role === "DISTRICT" ||
      req.user.role === "REGIONAL"
    ) {
      await ensureHealthCenterAccessible(req.user, healthCenterId);
    }

    await deleteStockForOwner({
      ownerType: OWNER_TYPES.HEALTHCENTER,
      ownerId: healthCenterId,
      vaccineId,
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const LOW_STOCK_THRESHOLD = 50;

const getNationalStockStats = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const aggregates = await prisma.stockNATIONAL.aggregate({
      _sum: { quantity: true },
      _count: { _all: true },
    });

    const lowStockCount = await prisma.stockNATIONAL.count({
      where: {
        quantity: {
          lt: LOW_STOCK_THRESHOLD,
          not: null,
        },
      },
    });

    const expiredLots = await prisma.stockLot.count({
      where: {
        ownerType: OWNER_TYPES.NATIONAL,
        status: LOT_STATUS.EXPIRED,
      },
    });

    res.json({
      totalLots: aggregates._count._all,
      totalQuantity: aggregates._sum.quantity ?? 0,
      lowStockCount,
      expiredLots,
      threshold: LOW_STOCK_THRESHOLD,
    });
  } catch (error) {
    next(error);
  }
};

const getRegionalStockStats = async (req, res, next) => {
  if (!["NATIONAL", "REGIONAL"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    let whereClause = {};

    if (req.user.role === "REGIONAL") {
      const regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        return res.json({
          totalLots: 0,
          totalQuantity: 0,
          lowStockCount: 0,
          threshold: LOW_STOCK_THRESHOLD,
        });
      }
      whereClause = { regionId };
    }

    const aggregates = await prisma.stockREGIONAL.aggregate({
      where: whereClause,
      _sum: { quantity: true },
      _count: { _all: true },
    });

    const lowStockCount = await prisma.stockREGIONAL.count({
      where: {
        ...whereClause,
        quantity: {
          lt: LOW_STOCK_THRESHOLD,
          not: null,
        },
      },
    });

    const expiredLots = await prisma.stockLot.count({
      where: {
        ownerType: OWNER_TYPES.REGIONAL,
        status: LOT_STATUS.EXPIRED,
        ownerId:
          req.user.role === "REGIONAL"
            ? await resolveRegionIdForUser(req.user)
            : undefined,
      },
    });

    res.json({
      totalLots: aggregates._count._all,
      totalQuantity: aggregates._sum.quantity ?? 0,
      lowStockCount,
      expiredLots,
      threshold: LOW_STOCK_THRESHOLD,
    });
  } catch (error) {
    next(error);
  }
};

const getDistrictStockStats = async (req, res, next) => {
  if (!["NATIONAL", "REGIONAL", "DISTRICT"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    let whereClause = {};

    if (req.user.role === "REGIONAL") {
      const regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        return res.json({
          totalLots: 0,
          totalQuantity: 0,
          lowStockCount: 0,
          threshold: LOW_STOCK_THRESHOLD,
        });
      }
      const districtIds = await fetchDistrictIdsForRegion(regionId);
      if (!districtIds.length) {
        return res.json({
          totalLots: 0,
          totalQuantity: 0,
          lowStockCount: 0,
          threshold: LOW_STOCK_THRESHOLD,
        });
      }
      whereClause = { districtId: { in: districtIds } };
    } else if (req.user.role === "DISTRICT") {
      const districtId = await resolveDistrictIdForUser(req.user);
      if (!districtId) {
        return res.json({
          totalLots: 0,
          totalQuantity: 0,
          lowStockCount: 0,
          threshold: LOW_STOCK_THRESHOLD,
        });
      }
      whereClause = { districtId };
    }

    const aggregates = await prisma.stockDISTRICT.aggregate({
      where: whereClause,
      _sum: { quantity: true },
      _count: { _all: true },
    });

    const lowStockCount = await prisma.stockDISTRICT.count({
      where: {
        ...whereClause,
        quantity: {
          lt: LOW_STOCK_THRESHOLD,
          not: null,
        },
      },
    });

    const expiredLots = await prisma.stockLot.count({
      where: {
        ownerType: OWNER_TYPES.DISTRICT,
        status: LOT_STATUS.EXPIRED,
        ownerId:
          req.user.role === "DISTRICT"
            ? await resolveDistrictIdForUser(req.user)
            : undefined,
        ...(req.user.role === "REGIONAL"
          ? {
              ownerId: {
                in: await fetchDistrictIdsForRegion(
                  await resolveRegionIdForUser(req.user),
                ),
              },
            }
          : {}),
      },
    });

    res.json({
      totalLots: aggregates._count._all,
      totalQuantity: aggregates._sum.quantity ?? 0,
      lowStockCount,
      expiredLots,
      threshold: LOW_STOCK_THRESHOLD,
    });
  } catch (error) {
    next(error);
  }
};

const getHealthCenterStockStats = async (req, res, next) => {
  if (!["NATIONAL", "REGIONAL", "DISTRICT", "AGENT"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    let whereClause = {};

    if (req.user.role === "AGENT") {
      if (req.user.agentLevel !== "ADMIN") {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const healthCenterId = await resolveHealthCenterIdForUser(req.user);
      if (!healthCenterId) {
        return res.json({
          totalLots: 0,
          totalQuantity: 0,
          lowStockCount: 0,
          threshold: LOW_STOCK_THRESHOLD,
        });
      }

      whereClause = { healthCenterId };
    } else if (req.user.role === "DISTRICT") {
      const districtId = await resolveDistrictIdForUser(req.user);
      if (!districtId) {
        return res.json({
          totalLots: 0,
          totalQuantity: 0,
          lowStockCount: 0,
          threshold: LOW_STOCK_THRESHOLD,
        });
      }

      whereClause = {
        healthCenter: {
          districtId,
        },
      };
    } else if (req.user.role === "REGIONAL") {
      const regionId = await resolveRegionIdForUser(req.user);
      if (!regionId) {
        return res.json({
          totalLots: 0,
          totalQuantity: 0,
          lowStockCount: 0,
          threshold: LOW_STOCK_THRESHOLD,
        });
      }

      whereClause = {
        healthCenter: {
          district: {
            commune: {
              regionId,
            },
          },
        },
      };
    }

    const aggregates = await prisma.stockHEALTHCENTER.aggregate({
      where: whereClause,
      _sum: { quantity: true },
      _count: { _all: true },
    });

    const lowStockCount = await prisma.stockHEALTHCENTER.count({
      where: {
        ...whereClause,
        quantity: {
          lt: LOW_STOCK_THRESHOLD,
          not: null,
        },
      },
    });

    const expiredLots = await prisma.stockLot.count({
      where: {
        ownerType: OWNER_TYPES.HEALTHCENTER,
        status: LOT_STATUS.EXPIRED,
        ownerId:
          req.user.role === "AGENT"
            ? await resolveHealthCenterIdForUser(req.user)
            : undefined,
      },
    });

    res.json({
      totalLots: aggregates._count._all,
      totalQuantity: aggregates._sum.quantity ?? 0,
      lowStockCount,
      expiredLots,
      threshold: LOW_STOCK_THRESHOLD,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStockNATIONAL,
  createStockREGIONAL,
  createStockDISTRICT,
  createStockHEALTHCENTER,
  addStockDISTRICT,
  addStockHEALTHCENTER,
  addStockNATIONAL,
  addStockREGIONAL,
  reduceStockDISTRICT,
  reduceStockHEALTHCENTER,
  reduceStockNATIONAL,
  reduceStockREGIONAL,
  updateStockDISTRICT,
  updateStockHEALTHCENTER,
  updateStockNATIONAL,
  updateStockREGIONAL,
  getStockNATIONAL,
  listNationalLots,
  listRegionalLots,
  listDistrictLots,
  listHealthCenterLots,
  getStockREGIONAL,
  getStockDISTRICT,
  getStockHEALTHCENTER,
  deleteStockNATIONAL,
  deleteStockREGIONAL,
  deleteStockDISTRICT,
  deleteStockHEALTHCENTER,
  getNationalStockStats,
  getRegionalStockStats,
  getDistrictStockStats,
  getHealthCenterStockStats,
  deleteLot,
};