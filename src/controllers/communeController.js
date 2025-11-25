const prisma = require("../config/prismaClient");

const isNational = (user) => user.role === "NATIONAL";
const isRegional = (user) => user.role === "REGIONAL";

const listCommunes = async (req, res, next) => {
  try {
    let whereClause = {};

    if (isRegional(req.user)) {
      if (!req.user.regionId) {
        return res.json({ total: 0, items: [] });
      }
      whereClause = { regionId: req.user.regionId };
    } else if (!isNational(req.user)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const communes = await prisma.commune.findMany({
      where: whereClause,
      include: {
        region: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    res.json({ total: communes.length, items: communes });
  } catch (error) {
    next(error);
  }
};

const createCommune = async (req, res, next) => {
  try {
    let regionId = req.body.regionId;

    if (isRegional(req.user)) {
      regionId = req.user.regionId;
    } else if (!isNational(req.user)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    if (!regionId || !req.body.name?.trim()) {
      return res.status(400).json({ message: "Nom et région requis" });
    }

    const commune = await prisma.commune.create({
      data: {
        name: req.body.name.trim(),
        regionId,
      },
      include: {
        region: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(commune);
  } catch (error) {
    next(error);
  }
};

const updateCommune = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, regionId } = req.body ?? {};

    const commune = await prisma.commune.findUnique({
      where: { id },
      include: { region: { select: { id: true } } },
    });

    if (!commune) {
      return res.status(404).json({ message: "Commune introuvable" });
    }

    if (isRegional(req.user)) {
      if (!req.user.regionId || commune.region?.id !== req.user.regionId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
    } else if (!isNational(req.user)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const data = {};
    if (typeof name === "string" && name.trim()) {
      data.name = name.trim();
    }
    if (regionId && isNational(req.user)) {
      data.regionId = regionId;
    }

    if (Object.keys(data).length === 0) {
      return res.json(commune);
    }

    const updated = await prisma.commune.update({
      where: { id },
      data,
      include: {
        region: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteCommune = async (req, res, next) => {
  try {
    const { id } = req.params;

    const commune = await prisma.commune.findUnique({
      where: { id },
      select: { regionId: true },
    });

    if (!commune) {
      return res.status(404).json({ message: "Commune introuvable" });
    }

    if (isRegional(req.user)) {
      if (!req.user.regionId || commune.regionId !== req.user.regionId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
    } else if (!isNational(req.user)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    await prisma.commune.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCommunes,
  createCommune,
  updateCommune,
  deleteCommune,
};