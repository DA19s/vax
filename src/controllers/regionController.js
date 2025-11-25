const prisma = require("../config/prismaClient");

const createRegion = async (req, res, next) => {

  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const newRegion = await prisma.region.create({
      data: {
        name: req.body.name,
      },
    });

    res.status(201).json(newRegion);
  } catch (error) {
    next(error);
  }

};

const getRegions = async (req, res, next) => {
  
  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const [ regions, total ] = await Promise.all ([
       prisma.region.findMany(),
       prisma.region.count(),
    ]);
    res.json({
      total,
      regions
  });
  } catch (error) {
    next(error);
  }
};

const updateRegion = async (req, res, next) => {

  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const regionId = req.params.id;
    const region = await prisma.region.findUnique({
      where: { id: regionId },
    });

    if (!region) {
      return res.status(404).json({ message: "Région non trouvée" });
    }

    const updatedRegion = await prisma.region.update({
      where: { id: regionId },
      data: { name: req.body.name },
    });

    res.json(updatedRegion);

  }
  catch (error) {
    next(error);
  }
};

const deleteRegion = async (req, res, next) => {

  if (req.user.role !== "NATIONAL") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {

    const regionId = req.params.id;
    const region = await prisma.region.findUnique({
      where: { id: regionId },
    });

    if (!region) {
      return res.status(404).json({ message: "Région non trouvée" });
    }

    await prisma.region.delete({
      where: { id: regionId },
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRegion,
  getRegions,
  updateRegion,
  deleteRegion,
};