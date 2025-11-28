const prisma = require("../config/prismaClient");
const { OWNER_TYPES } = require("../services/stockLotService");

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

    await prisma.$transaction(async (tx) => {
      const [communes, districts, healthCenters, children] = await Promise.all([
        tx.commune.findMany({
          where: { regionId },
          select: { id: true },
        }),
        tx.district.findMany({
          where: { commune: { regionId } },
          select: { id: true },
        }),
        tx.healthCenter.findMany({
          where: { district: { commune: { regionId } } },
          select: { id: true },
        }),
        tx.children.findMany({
          where: { healthCenter: { district: { commune: { regionId } } } },
          select: { id: true },
        }),
      ]);

      const communeIds = communes.map((item) => item.id);
      const districtIds = districts.map((item) => item.id);
      const healthCenterIds = healthCenters.map((item) => item.id);
      const childIds = children.map((item) => item.id);

      if (childIds.length) {
        await tx.stockReservation.deleteMany({
          where: { schedule: { childId: { in: childIds } } },
        });

        await tx.childVaccineScheduled.deleteMany({
          where: { childId: { in: childIds } },
        });
        await tx.childVaccineCompleted.deleteMany({
          where: { childId: { in: childIds } },
        });
        await tx.childVaccineDue.deleteMany({
          where: { childId: { in: childIds } },
        });
        await tx.childVaccineLate.deleteMany({
          where: { childId: { in: childIds } },
        });
        await tx.childVaccineOverdue.deleteMany({
          where: { childId: { in: childIds } },
        });
      }

      const recordConditions = [];
      if (childIds.length) {
        recordConditions.push({ childrenId: { in: childIds } });
      }
      if (healthCenterIds.length) {
        recordConditions.push({ healthCenterId: { in: healthCenterIds } });
      }
      if (recordConditions.length) {
        await tx.record.deleteMany({ where: { OR: recordConditions } });
      }

      if (childIds.length) {
        await tx.children.deleteMany({
          where: { id: { in: childIds } },
        });
      }

      const lotConditions = [
        { ownerType: OWNER_TYPES.REGIONAL, ownerId: regionId },
      ];
      if (districtIds.length) {
        lotConditions.push({
          ownerType: OWNER_TYPES.DISTRICT,
          ownerId: { in: districtIds },
        });
      }
      if (healthCenterIds.length) {
        lotConditions.push({
          ownerType: OWNER_TYPES.HEALTHCENTER,
          ownerId: { in: healthCenterIds },
        });
      }

      await tx.stockLot.deleteMany({ where: { OR: lotConditions } });

      if (healthCenterIds.length) {
        await tx.stockHEALTHCENTER.deleteMany({
          where: { healthCenterId: { in: healthCenterIds } },
        });
      }

      if (districtIds.length) {
        await tx.stockDISTRICT.deleteMany({
          where: { districtId: { in: districtIds } },
        });
      }

      await tx.stockREGIONAL.deleteMany({
        where: { regionId },
      });

      const userConditions = [{ regionId }];
      if (districtIds.length) {
        userConditions.push({ districtId: { in: districtIds } });
      }
      if (healthCenterIds.length) {
        userConditions.push({ healthCenterId: { in: healthCenterIds } });
      }

      await tx.user.deleteMany({
        where: { OR: userConditions },
      });

      if (healthCenterIds.length) {
        await tx.healthCenter.deleteMany({
          where: { id: { in: healthCenterIds } },
        });
      }

      if (districtIds.length) {
        await tx.district.deleteMany({
          where: { id: { in: districtIds } },
        });
      }

      if (communeIds.length) {
        await tx.commune.deleteMany({
          where: { id: { in: communeIds } },
        });
      }

      await tx.region.delete({
        where: { id: regionId },
      });
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