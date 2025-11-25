const prisma = require("../config/prismaClient");

const ensureDistrictUser = (user) => {
  if (user.role !== "DISTRICT") {
    const error = new Error("Accès refusé");
    error.status = 403;
    throw error;
  }
  if (!user.districtId) {
    const error = new Error("Votre compte n'est pas rattaché à un district");
    error.status = 400;
    throw error;
  }
};

const listHealthCenters = async (req, res, next) => {
  try {
    let whereClause = {};

    if (req.user.role === "DISTRICT") {
      if (!req.user.districtId) {
        return res.json({ total: 0, items: [] });
      }
      whereClause = { districtId: req.user.districtId };
    } else if (req.user.role !== "NATIONAL" && req.user.role !== "REGIONAL") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const centers = await prisma.healthCenter.findMany({
      where: whereClause,
      include: {
        district: {
          select: {
            id: true,
            name: true,
            commune: {
              select: {
                id: true,
                name: true,
                region: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({ total: centers.length, items: centers });
  } catch (error) {
    next(error);
  }
};

const createHealthCenter = async (req, res, next) => {
  try {
    try {
      ensureDistrictUser(req.user);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      throw error;
    }

    const { name, address } = req.body ?? {};

    if (!name?.trim() || !address?.trim()) {
      return res.status(400).json({ message: "Nom et adresse requis" });
    }

    const center = await prisma.healthCenter.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        districtId: req.user.districtId,
      },
      include: {
        district: {
          select: {
            id: true,
            name: true,
            commune: {
              select: {
                id: true,
                name: true,
                region: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    res.status(201).json(center);
  } catch (error) {
    next(error);
  }
};

const updateHealthCenter = async (req, res, next) => {
  try {
    try {
      ensureDistrictUser(req.user);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      throw error;
    }

    const { id } = req.params;
    const { name, address } = req.body ?? {};

    const center = await prisma.healthCenter.findUnique({
      where: { id },
    });

    if (!center || center.districtId !== req.user.districtId) {
      return res.status(center ? 403 : 404).json({ message: center ? "Accès refusé" : "Centre introuvable" });
    }

    const data = {};
    if (typeof name === "string" && name.trim()) {
      data.name = name.trim();
    }
    if (typeof address === "string" && address.trim()) {
      data.address = address.trim();
    }

    if (Object.keys(data).length === 0) {
      return res.json(center);
    }

    const updated = await prisma.healthCenter.update({
      where: { id },
      data,
      include: {
        district: {
          select: {
            id: true,
            name: true,
            commune: {
              select: {
                id: true,
                name: true,
                region: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteHealthCenter = async (req, res, next) => {
  try {
    try {
      ensureDistrictUser(req.user);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      throw error;
    }

    const { id } = req.params;

    const center = await prisma.healthCenter.findUnique({ where: { id } });

    if (!center || center.districtId !== req.user.districtId) {
      return res.status(center ? 403 : 404).json({ message: center ? "Accès refusé" : "Centre introuvable" });
    }

    await prisma.healthCenter.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listHealthCenters,
  createHealthCenter,
  updateHealthCenter,
  deleteHealthCenter,
};