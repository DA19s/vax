const prisma = require("../config/prismaClient");

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

const getStockNATIONAL = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const national = await prisma.stockNATIONAL.findMany({
      include: { vaccine: true },
      orderBy: { vaccine: { name: "asc" } },
    });

    res.json({ national });
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

    res.json({ regional });
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

    res.json({ districtId: resolvedDistrictId, district });
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

    res.json({ healthCenter });
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
        const { vaccineId, quantity } = req.body;

        if (!vaccineId || !quantity) {
            return res.status(400).json({ message: "vaccineId et quantity sont requis" });
        }

        const stock = await prisma.stockNATIONAL.findUnique({
            where: { vaccineId },
        });
        if (!stock) {
            return res.status(404).json({ message: "Stock introuvable" });
        }
        const updatedStock = await prisma.stockNATIONAL.update({
            where: { vaccineId },
            data: { quantity: stock.quantity + quantity },
        });
        res.json(updatedStock);
    } catch (error) {
        next(error);
    }
};

const addStockREGIONAL = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, regionId, quantity } = req.body;
    const qty = Number(quantity);

    if (!vaccineId || !regionId || !Number.isFinite(qty) || qty <= 0) {
      return res
        .status(400)
        .json({ message: "vaccineId, regionId et quantity (> 0) sont requis" });
    }

    const regionalStock = await prisma.stockREGIONAL.findUnique({
      where: { vaccineId_regionId: { vaccineId, regionId } },
    });

    if (!regionalStock) {
      return res.status(404).json({ message: "Stock régional introuvable" });
    }

    const nationalStock = await prisma.stockNATIONAL.findUnique({
      where: { vaccineId },
    });

    if (!nationalStock || (nationalStock.quantity ?? 0) < qty) {
      return res
        .status(400)
        .json({ message: "Quantité insuffisante dans le stock national" });
    }

    const updatedNational = await prisma.stockNATIONAL.update({
      where: { vaccineId },
      data: { quantity: (nationalStock.quantity ?? 0) - qty },
    });

    const updatedRegional = await prisma.stockREGIONAL.update({
      where: { vaccineId_regionId: { vaccineId, regionId } },
      data: { quantity: (regionalStock.quantity ?? 0) + qty },
    });

    res.json({ national: updatedNational, regional: updatedRegional });
  } catch (error) {
    next(error);
  }
};

const addStockDISTRICT = async (req, res, next) => {
  if (!["REGIONAL", "NATIONAL"].includes(req.user.role)) {
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

    const districtStock = await prisma.stockDISTRICT.findUnique({
      where: { vaccineId_districtId: { vaccineId, districtId } },
    });

    if (!districtStock) {
      return res.status(404).json({ message: "Stock district introuvable" });
    }

    const regionalStock = await prisma.stockREGIONAL.findUnique({
      where: { vaccineId_regionId: { vaccineId, regionId: regionIdPayload } },
    });

    if (!regionalStock || (regionalStock.quantity ?? 0) < qty) {
      return res
        .status(400)
        .json({ message: "Quantité insuffisante dans le stock régional" });
    }

    const updatedRegional = await prisma.stockREGIONAL.update({
      where: { vaccineId_regionId: { vaccineId, regionId: regionIdPayload } },
      data: { quantity: (regionalStock.quantity ?? 0) - qty },
    });

    const updatedDistrict = await prisma.stockDISTRICT.update({
      where: { vaccineId_districtId: { vaccineId, districtId } },
      data: { quantity: (districtStock.quantity ?? 0) + qty },
    });

    res.json({ regional: updatedRegional, district: updatedDistrict });
  } catch (error) {
    next(error);
  }
};

const addStockHEALTHCENTER = async (req, res, next) => {
  if (req.user.role !== "DISTRICT") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, healthCenterId, quantity } = req.body;
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

    const healthCenterStock = await prisma.stockHEALTHCENTER.findUnique({
      where: { vaccineId_healthCenterId: { vaccineId, healthCenterId } },
    });

    if (!healthCenterStock) {
      return res
        .status(404)
        .json({ message: "Stock centre de santé introuvable" });
    }

    const districtStock = await prisma.stockDISTRICT.findUnique({
      where: { vaccineId_districtId: { vaccineId, districtId } },
    });

    if (!districtStock || (districtStock.quantity ?? 0) < qty) {
      return res
        .status(400)
        .json({ message: "Quantité insuffisante dans le stock district" });
    }

    const updatedDistrict = await prisma.stockDISTRICT.update({
      where: { vaccineId_districtId: { vaccineId, districtId } },
      data: { quantity: (districtStock.quantity ?? 0) - qty },
    });

    const updatedHealthCenter = await prisma.stockHEALTHCENTER.update({
      where: { vaccineId_healthCenterId: { vaccineId, healthCenterId } },
      data: { quantity: (healthCenterStock.quantity ?? 0) + qty },
    });

    res.json({ district: updatedDistrict, healthCenter: updatedHealthCenter });
  } catch (error) {
    next(error);
  }
};


const updateStockNATIONAL = async (req, res, next) => {
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, quantity } = req.body;
    const qty = Number(quantity);

    if (!vaccineId || !Number.isFinite(qty) || qty < 0) {
      return res
        .status(400)
        .json({ message: "vaccineId et quantity (>= 0) sont requis" });
    }

    const stock = await prisma.stockNATIONAL.findUnique({ where: { vaccineId } });
    if (!stock) {
      return res.status(404).json({ message: "Stock national introuvable" });
    }

    const updated = await prisma.stockNATIONAL.update({
      where: { vaccineId },
      data: { quantity: qty },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const updateStockREGIONAL = async (req, res, next) => {
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

    if (!vaccineId || !regionId || !Number.isFinite(qty) || qty < 0) {
      return res
        .status(400)
        .json({ message: "vaccineId, regionId et quantity (>= 0) sont requis" });
    }

    const stock = await prisma.stockREGIONAL.findFirst({
      where: { vaccineId_regionId: { vaccineId, regionId } },
    });

    if (!stock) {
      return res.status(404).json({ message: "Stock régional introuvable" });
    }

    const updated = await prisma.stockREGIONAL.update({
      where: { vaccineId_regionId: { vaccineId, regionId } },
      data: { quantity: qty },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const updateStockDISTRICT = async (req, res, next) => {
  if (!["REGIONAL", "DISTRICT"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, districtId, quantity } = req.body;
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

    if (!stock) {
      return res.status(404).json({ message: "Stock district introuvable" });
    }

    const updated = await prisma.stockDISTRICT.update({
      where: { vaccineId_districtId: { vaccineId, districtId } },
      data: { quantity: qty },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const updateStockHEALTHCENTER = async (req, res, next) => {
  if (!["DISTRICT", "AGENT"].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const { vaccineId, healthCenterId, quantity } = req.body;
    const qty = Number(quantity);

    if (!vaccineId || !healthCenterId || !Number.isFinite(qty) || qty < 0) {
      return res.status(400).json({
        message: "vaccineId, healthCenterId et quantity (>= 0) sont requis",
      });
    }

    const stock = await prisma.stockHEALTHCENTER.findUnique({
      where: { vaccineId_healthCenterId: { vaccineId, healthCenterId } },
    });

    if (!stock) {
      return res
        .status(404)
        .json({ message: "Stock centre de santé introuvable" });
    }

    const updated = await prisma.stockHEALTHCENTER.update({
      where: { vaccineId_healthCenterId: { vaccineId, healthCenterId } },
      data: { quantity: qty },
    });

    res.json(updated);
  } catch (error) {
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

    res.json({
      totalLots: aggregates._count._all,
      totalQuantity: aggregates._sum.quantity ?? 0,
      lowStockCount,
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

    res.json({
      totalLots: aggregates._count._all,
      totalQuantity: aggregates._sum.quantity ?? 0,
      lowStockCount,
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

    res.json({
      totalLots: aggregates._count._all,
      totalQuantity: aggregates._sum.quantity ?? 0,
      lowStockCount,
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

    res.json({
      totalLots: aggregates._count._all,
      totalQuantity: aggregates._sum.quantity ?? 0,
      lowStockCount,
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
    getStockREGIONAL,
    getStockDISTRICT,
    getStockHEALTHCENTER,
    getNationalStockStats,
    getRegionalStockStats,
    getDistrictStockStats,
    getHealthCenterStockStats,
};