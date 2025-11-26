const prisma = require("../config/prismaClient");

const OWNER_TYPES = {
  NATIONAL: "NATIONAL",
  REGIONAL: "REGIONAL",
  DISTRICT: "DISTRICT",
  HEALTHCENTER: "HEALTHCENTER",
};

const LOT_STATUS = {
  VALID: "VALID",
  EXPIRED: "EXPIRED",
};

const normalizeOwnerId = (ownerType, ownerId) =>
  ownerType === OWNER_TYPES.NATIONAL ? null : ownerId ?? null;

const ownerKey = (ownerType, ownerId, vaccineId) =>
  `${ownerType}::${ownerId ?? "root"}::${vaccineId}`;

const determineStatusFromExpiration = (expirationDate) => {
  const now = new Date();
  return expirationDate <= now ? LOT_STATUS.EXPIRED : LOT_STATUS.VALID;
};

const getDbClient = (tx) => tx ?? prisma;

const updateNearestExpiration = async (
  tx,
  { vaccineId, ownerType, ownerId },
) => {
  const db = getDbClient(tx);
  const normalizedOwnerId = normalizeOwnerId(ownerType, ownerId);

  const nextLot = await db.stockLot.findFirst({
    where: {
      vaccineId,
      ownerType,
      ownerId: normalizedOwnerId,
      remainingQuantity: { gt: 0 },
    },
    orderBy: {
      expiration: "asc",
    },
  });

  const nextExpiration = nextLot?.expiration ?? null;

  switch (ownerType) {
    case OWNER_TYPES.NATIONAL:
      await db.stockNATIONAL.update({
        where: { vaccineId },
        data: { nearestExpiration: nextExpiration },
      });
      break;
    case OWNER_TYPES.REGIONAL:
      if (!normalizedOwnerId) return;
      await db.stockREGIONAL.update({
        where: {
          vaccineId_regionId: {
            vaccineId,
            regionId: normalizedOwnerId,
          },
        },
        data: { nearestExpiration: nextExpiration },
      });
      break;
    case OWNER_TYPES.DISTRICT:
      if (!normalizedOwnerId) return;
      await db.stockDISTRICT.update({
        where: {
          vaccineId_districtId: {
            vaccineId,
            districtId: normalizedOwnerId,
          },
        },
        data: { nearestExpiration: nextExpiration },
      });
      break;
    case OWNER_TYPES.HEALTHCENTER:
      if (!normalizedOwnerId) return;
      await db.stockHEALTHCENTER.update({
        where: {
          vaccineId_healthCenterId: {
            vaccineId,
            healthCenterId: normalizedOwnerId,
          },
        },
        data: { nearestExpiration: nextExpiration },
      });
      break;
    default:
      break;
  }
};

const createLot = async (
  tx,
  {
    vaccineId,
    ownerType,
    ownerId,
    quantity,
    expiration,
    sourceLotId = null,
    status,
  },
) => {
  const db = getDbClient(tx);
  const expirationDate = new Date(expiration);
  if (Number.isNaN(expirationDate.getTime())) {
    const error = new Error("Date d'expiration invalide");
    error.status = 400;
    throw error;
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    const error = new Error("La quantité du lot doit être positive");
    error.status = 400;
    throw error;
  }

  const lotStatus = status ?? determineStatusFromExpiration(expirationDate);

  const lot = await db.stockLot.create({
    data: {
      vaccineId,
      ownerType,
      ownerId: normalizeOwnerId(ownerType, ownerId),
      quantity,
      remainingQuantity: quantity,
      expiration: expirationDate,
      status: lotStatus,
      sourceLotId,
    },
  });

  await updateNearestExpiration(db, { vaccineId, ownerType, ownerId });

  return lot;
};

const consumeLots = async (
  tx,
  { vaccineId, ownerType, ownerId, quantity },
) => {
  const db = getDbClient(tx);
  const normalizedOwnerId = normalizeOwnerId(ownerType, ownerId);
  const qty = Number(quantity);

  if (!Number.isFinite(qty) || qty <= 0) {
    const error = new Error("La quantité demandée doit être positive");
    error.status = 400;
    throw error;
  }

  const lots = await db.stockLot.findMany({
    where: {
      vaccineId,
      ownerType,
      ownerId: normalizedOwnerId,
      status: LOT_STATUS.VALID,
      remainingQuantity: { gt: 0 },
    },
    orderBy: {
      expiration: "asc",
    },
  });

  let remaining = qty;
  const allocations = [];

  for (const lot of lots) {
    if (remaining <= 0) break;
    if (lot.remainingQuantity <= 0) continue;

    const take = Math.min(remaining, lot.remainingQuantity);
    if (take <= 0) continue;

    await db.stockLot.update({
      where: { id: lot.id },
      data: { remainingQuantity: lot.remainingQuantity - take },
    });

    allocations.push({
      lotId: lot.id,
      quantity: take,
      expiration: lot.expiration,
      status: lot.status,
    });

    remaining -= take;
  }

  if (remaining > 0) {
    const error = new Error(
      "Quantité insuffisante dans les lots disponibles pour ce stock",
    );
    error.status = 400;
    throw error;
  }

  await updateNearestExpiration(db, { vaccineId, ownerType, ownerId });

  return allocations;
};

const recordTransfer = async (
  tx,
  { vaccineId, fromType, fromId, toType, toId, allocations },
) => {
  const db = getDbClient(tx);

  if (!allocations?.length) {
    return null;
  }

  const totalQuantity = allocations.reduce(
    (sum, allocation) => sum + allocation.quantity,
    0,
  );

  const transfer = await db.stockTransfer.create({
    data: {
      vaccineId,
      fromType,
      fromId: normalizeOwnerId(fromType, fromId),
      toType,
      toId: normalizeOwnerId(toType, toId),
      quantity: totalQuantity,
      lots: {
        create: allocations.map((allocation) => ({
          lotId: allocation.lotId,
          quantity: allocation.quantity,
        })),
      },
    },
    include: {
      lots: true,
    },
  });

  return transfer;
};

const refreshExpiredLots = async (tx) => {
  const db = getDbClient(tx);
  const now = new Date();

  const expiredLots = await db.stockLot.findMany({
    where: {
      status: LOT_STATUS.VALID,
      expiration: {
        lt: now,
      },
    },
  });

  if (!expiredLots.length) {
    return [];
  }

  const expiredIds = expiredLots.map((lot) => lot.id);

  await db.stockLot.updateMany({
    where: { id: { in: expiredIds } },
    data: { status: LOT_STATUS.EXPIRED },
  });

  const combos = new Map();
  expiredLots.forEach((lot) => {
    combos.set(
      ownerKey(lot.ownerType, lot.ownerId, lot.vaccineId),
      {
        ownerType: lot.ownerType,
        ownerId: lot.ownerId,
        vaccineId: lot.vaccineId,
      },
    );
  });

  for (const combo of combos.values()) {
    await updateNearestExpiration(db, combo);
  }

  return expiredLots;
};

const modifyStockQuantity = async (
  tx,
  { vaccineId, ownerType, ownerId, delta },
) => {
  const db = getDbClient(tx);
  if (!Number.isFinite(delta) || delta === 0) {
    return null;
  }

  switch (ownerType) {
    case OWNER_TYPES.NATIONAL: {
      const stock = await db.stockNATIONAL.findUnique({
        where: { vaccineId },
      });
      if (!stock) return null;
      const base = stock.quantity ?? 0;
      const updated = Math.max(0, base + delta);
      await db.stockNATIONAL.update({
        where: { vaccineId },
        data: { quantity: updated },
      });
      return updated;
    }
    case OWNER_TYPES.REGIONAL: {
      const regionId = normalizeOwnerId(ownerType, ownerId);
      if (!regionId) return null;
      const stock = await db.stockREGIONAL.findUnique({
        where: {
          vaccineId_regionId: {
            vaccineId,
            regionId,
          },
        },
      });
      if (!stock) return null;
      const base = stock.quantity ?? 0;
      const updated = Math.max(0, base + delta);
      await db.stockREGIONAL.update({
        where: {
          vaccineId_regionId: {
            vaccineId,
            regionId,
          },
        },
        data: { quantity: updated },
      });
      return updated;
    }
    case OWNER_TYPES.DISTRICT: {
      const districtId = normalizeOwnerId(ownerType, ownerId);
      if (!districtId) return null;
      const stock = await db.stockDISTRICT.findUnique({
        where: {
          vaccineId_districtId: {
            vaccineId,
            districtId,
          },
        },
      });
      if (!stock) return null;
      const base = stock.quantity ?? 0;
      const updated = Math.max(0, base + delta);
      await db.stockDISTRICT.update({
        where: {
          vaccineId_districtId: {
            vaccineId,
            districtId,
          },
        },
        data: { quantity: updated },
      });
      return updated;
    }
    case OWNER_TYPES.HEALTHCENTER: {
      const healthCenterId = normalizeOwnerId(ownerType, ownerId);
      if (!healthCenterId) return null;
      const stock = await db.stockHEALTHCENTER.findUnique({
        where: {
          vaccineId_healthCenterId: {
            vaccineId,
            healthCenterId,
          },
        },
      });
      if (!stock) return null;
      const base = stock.quantity ?? 0;
      const updated = Math.max(0, base + delta);
      await db.stockHEALTHCENTER.update({
        where: {
          vaccineId_healthCenterId: {
            vaccineId,
            healthCenterId,
          },
        },
        data: { quantity: updated },
      });
      return updated;
    }
    default:
      return null;
  }
};

const deleteLotCascade = async (tx, lotId) => {
  const db = getDbClient(tx);
  const stack = [{ id: lotId, depth: 0 }];
  const visited = new Set();
  const collected = [];

  while (stack.length) {
    const { id, depth } = stack.pop();
    if (visited.has(id)) continue;

    const lot = await db.stockLot.findUnique({
      where: { id },
      include: {
        derivedLots: {
          select: { id: true },
        },
      },
    });

    if (!lot) continue;
    visited.add(id);
    collected.push({ lot, depth });

    for (const child of lot.derivedLots) {
      stack.push({ id: child.id, depth: depth + 1 });
    }
  }

  if (!collected.length) {
    return [];
  }

  collected.sort((a, b) => b.depth - a.depth);

  const lotIds = collected.map(({ lot }) => lot.id);

  await db.stockTransferLot.deleteMany({
    where: {
      lotId: { in: lotIds },
    },
  });

  const combos = new Map();

  for (const { lot } of collected) {
    if (lot.remainingQuantity > 0) {
      await modifyStockQuantity(db, {
        vaccineId: lot.vaccineId,
        ownerType: lot.ownerType,
        ownerId: lot.ownerId,
        delta: -lot.remainingQuantity,
      });
    }

    combos.set(
      ownerKey(lot.ownerType, lot.ownerId, lot.vaccineId),
      {
        ownerType: lot.ownerType,
        ownerId: lot.ownerId,
        vaccineId: lot.vaccineId,
      },
    );

    await db.stockLot.delete({
      where: { id: lot.id },
    });
  }

  for (const combo of combos.values()) {
    await updateNearestExpiration(db, combo);
  }

  return collected.map(({ lot }) => lot.id);
};

module.exports = {
  OWNER_TYPES,
  LOT_STATUS,
  createLot,
  consumeLots,
  recordTransfer,
  refreshExpiredLots,
  deleteLotCascade,
  updateNearestExpiration,
  modifyStockQuantity,
};

