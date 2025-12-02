const prisma = require("../config/prismaClient");

const ensureRegional = (user) => {
  if (user.role !== "REGIONAL") {
    const error = new Error("Accès refusé");
    error.status = 403;
    throw error;
  }
  if (!user.regionId) {
    const error = new Error("Region non définie pour cet utilisateur");
    error.status = 400;
    throw error;
  }
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
    const error = new Error("Accès refusé à ce district");
    error.status = 403;
    throw error;
  }

  return district;
};

const ensureCommuneBelongsToRegion = async (communeId, regionId) => {
  const commune = await prisma.commune.findUnique({
    where: { id: communeId },
    select: { regionId: true },
  });

  if (!commune) {
    const error = new Error("Commune introuvable");
    error.status = 404;
    throw error;
  }

  if (commune.regionId !== regionId) {
    const error = new Error("Commune hors de votre région");
    error.status = 403;
    throw error;
  }
};

const listDistricts = async (req, res, next) => {
  try {
    let whereClause = {};

    if (req.user.role === "REGIONAL") {
      if (!req.user.regionId) {
        return res.json({ total: 0, items: [] });
      }
      whereClause = {
        commune: {
          regionId: req.user.regionId,
        },
      };
    } else if (req.user.role !== "NATIONAL") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const districts = await prisma.district.findMany({
      where: whereClause,
      include: {
        commune: {
          select: {
            id: true,
            name: true,
            region: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      total: districts.length,
      items: districts,
    });
  } catch (error) {
    next(error);
  }
};

const createDistrict = async (req, res, next) => {
  try {
    ensureRegional(req.user);

    const { name, communeId } = req.body ?? {};

    if (!name?.trim() || !communeId) {
      return res.status(400).json({ message: "Nom et commune requis" });
    }

    await ensureCommuneBelongsToRegion(communeId, req.user.regionId);

    // Vérifier si la commune a déjà un district
    const existingDistrict = await prisma.district.findUnique({
      where: { communeId },
      include: {
        commune: {
          select: {
            name: true,
          },
        },
      },
    });

    if (existingDistrict) {
      return res.status(400).json({
        message: `La commune "${existingDistrict.commune.name}" a déjà un district associé (${existingDistrict.name}). Une commune ne peut avoir qu'un seul district.`,
      });
    }

    const district = await prisma.district.create({
      data: {
        name: name.trim(),
        communeId,
      },
      include: {
        commune: {
          select: {
            id: true,
            name: true,
            region: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.status(201).json(district);
  } catch (error) {
    // Gérer aussi l'erreur de contrainte unique au cas où
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Cette commune a déjà un district associé. Une commune ne peut avoir qu'un seul district.",
      });
    }
    next(error);
  }
};

const updateDistrict = async (req, res, next) => {
  try {
    ensureRegional(req.user);

    const { id } = req.params;
    const { name, communeId } = req.body ?? {};

    const district = await ensureDistrictBelongsToRegion(id, req.user.regionId);

    const updateData = {};

    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (communeId && communeId !== district.communeId) {
      await ensureCommuneBelongsToRegion(communeId, req.user.regionId);
      
      // Vérifier si la nouvelle commune a déjà un district
      const existingDistrict = await prisma.district.findUnique({
        where: { communeId },
        include: {
          commune: {
            select: {
              name: true,
            },
          },
        },
      });

      if (existingDistrict) {
        return res.status(400).json({
          message: `La commune "${existingDistrict.commune.name}" a déjà un district associé (${existingDistrict.name}). Une commune ne peut avoir qu'un seul district.`,
        });
      }

      updateData.communeId = communeId;
    }

    if (Object.keys(updateData).length === 0) {
      return res.json(district);
    }

    const updated = await prisma.district.update({
      where: { id },
      data: updateData,
      include: {
        commune: {
          select: {
            id: true,
            name: true,
            region: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    // Gérer l'erreur de contrainte unique au cas où
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Cette commune a déjà un district associé. Une commune ne peut avoir qu'un seul district.",
      });
    }
    next(error);
  }
};

const deleteDistrict = async (req, res, next) => {
  try {
    ensureRegional(req.user);

    const { id } = req.params;
    await ensureDistrictBelongsToRegion(id, req.user.regionId);

    await prisma.district.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listDistricts,
  createDistrict,
  updateDistrict,
  deleteDistrict,
};