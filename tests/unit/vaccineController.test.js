// tests/unit/vaccineController.test.js

// Mocker le middleware requireAuth AVANT tout autre import pour éviter les erreurs de chargement
jest.mock('../../src/middleware/auth', () => ({
  requireAuth: jest.fn((req, res, next) => next()),
  requireMobileAuth: jest.fn((req, res, next) => next()),
  optionalAuth: jest.fn((req, res, next) => next()),
}));

// Mocker les routes pour éviter le chargement des routes réelles
jest.mock('../../src/routes', () => ({
  get: jest.fn(),
}));

const {
  createVaccine,
  getVaccine,
  updateVaccine,
  deleteVaccine,
  createVaccineCalendar,
  updateVaccineCalendar,
  deleteVaccineCalendar,
  listVaccineCalendars,
  listVaccineCalendarDoseWarnings,
  downloadVaccineCalendarPdf,
  listVaccines,
  ScheduleVaccine,
  listScheduledVaccines,
  updateScheduledVaccine,
  cancelScheduledVaccine,
  completeVaccine,
  missVaccine,
} = require('../../src/controllers/vaccineController');

const prisma = require('../../src/config/prismaClient');
const stockLotService = require('../../src/services/stockLotService');
const notificationService = require('../../src/services/notificationService');
const vaccineBucketService = require('../../src/services/vaccineBucketService');

// Mock des dépendances
jest.mock('../../src/config/prismaClient', () => ({
  vaccine: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  vaccineCalendar: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  vaccineCalendarDose: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  childVaccineScheduled: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  childVaccineCompleted: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
  },
  childVaccineDue: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
  },
  childVaccineLate: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  childVaccineOverdue: {
    create: jest.fn(),
    upsert: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  children: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  stockReservation: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  stockLot: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  stockNATIONAL: {
    deleteMany: jest.fn(),
  },
  stockREGIONAL: {
    deleteMany: jest.fn(),
  },
  stockDISTRICT: {
    deleteMany: jest.fn(),
  },
  stockHEALTHCENTER: {
    deleteMany: jest.fn(),
  },
  record: {
    deleteMany: jest.fn(),
  },
  vaccineRequest: {
    deleteMany: jest.fn(),
  },
  stockTransfer: {
    findMany: jest.fn(),
  },
  stockTransferLot: {
    deleteMany: jest.fn(),
  },
  region: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn((callback) => {
    const mockPrisma = require('../../src/config/prismaClient');
    const mockTx = {
      vaccine: mockPrisma.vaccine,
      vaccineCalendar: mockPrisma.vaccineCalendar,
      vaccineCalendarDose: mockPrisma.vaccineCalendarDose,
      childVaccineScheduled: mockPrisma.childVaccineScheduled,
      childVaccineCompleted: mockPrisma.childVaccineCompleted,
      childVaccineDue: mockPrisma.childVaccineDue,
      childVaccineLate: mockPrisma.childVaccineLate,
      childVaccineOverdue: mockPrisma.childVaccineOverdue,
      children: mockPrisma.children,
      stockReservation: mockPrisma.stockReservation,
      stockLot: mockPrisma.stockLot,
      stockNATIONAL: mockPrisma.stockNATIONAL,
      stockREGIONAL: mockPrisma.stockREGIONAL,
      stockDISTRICT: mockPrisma.stockDISTRICT,
      stockHEALTHCENTER: mockPrisma.stockHEALTHCENTER,
      record: mockPrisma.record,
      vaccineRequest: mockPrisma.vaccineRequest,
      stockTransfer: mockPrisma.stockTransfer,
      stockTransferLot: mockPrisma.stockTransferLot,
    };
    return callback(mockTx);
  }),
}));

jest.mock('../../src/services/stockLotService', () => ({
  OWNER_TYPES: {
    HEALTHCENTER: 'HEALTHCENTER',
  },
  reserveDoseForHealthCenter: jest.fn(),
  releaseDoseForHealthCenter: jest.fn(),
  deleteLotCascade: jest.fn(),
}));

jest.mock('../../src/services/notificationService', () => ({
  notifyVaccineScheduled: jest.fn(),
  notifyVaccineMissed: jest.fn(),
  notifyVaccineLate: jest.fn(),
  notifyAppointmentUpdated: jest.fn(),
  notifyAppointmentCancelled: jest.fn(),
}));

jest.mock('../../src/services/vaccineBucketService', () => ({
  rebuildChildVaccinationBuckets: jest.fn(),
}));

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn(),
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    end: jest.fn(),
  }));
});

describe('vaccineController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        id: 'user-1',
        role: 'NATIONAL',
        regionId: 'region-1',
        districtId: 'district-1',
        healthCenterId: 'healthcenter-1',
        agentLevel: 'ADMIN',
      },
      body: {},
      params: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe('createVaccine', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await createVaccine(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    });

    it('devrait créer un vaccin avec succès', async () => {
      req.body.name = 'BCG';
      req.body.description = 'Vaccin BCG';
      req.body.dosesRequired = 1;
      req.body.gender = null;
      const mockVaccine = {
        id: 'vaccine-1',
        name: 'BCG',
        description: 'Vaccin BCG',
        dosesRequired: 1,
        gender: null,
      };
      prisma.vaccine.create.mockResolvedValue(mockVaccine);

      await createVaccine(req, res, next);

      expect(prisma.vaccine.create).toHaveBeenCalledWith({
        data: {
          name: 'BCG',
          description: 'Vaccin BCG',
          dosesRequired: 1,
          gender: null,
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockVaccine);
    });

    it('devrait gérer les erreurs de base de données', async () => {
      req.body.name = 'BCG';
      req.body.description = 'Vaccin BCG';
      req.body.dosesRequired = 1;
      const error = new Error('Erreur DB');
      prisma.vaccine.create.mockRejectedValue(error);

      await createVaccine(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getVaccine', () => {
    it('devrait retourner 403 si utilisateur n\'a pas les permissions', async () => {
      req.user.role = 'PARENT';
      await getVaccine(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner la liste des vaccins avec succès', async () => {
      const mockVaccines = [
        {
          id: 'vaccine-1',
          name: 'BCG',
          description: 'Vaccin BCG',
          dosesRequired: 1,
          StockNATIONAL: { quantity: 100 },
          StockREGIONAL: [],
          StockDISTRICT: [],
          StockHEALTHCENTER: [],
        },
      ];
      prisma.vaccine.findMany.mockResolvedValue(mockVaccines);
      prisma.vaccine.count.mockResolvedValue(1);

      await getVaccine(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.vaccines).toBeDefined();
      expect(response.total).toBe(1);
    });
  });

  describe('updateVaccine', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await updateVaccine(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait mettre à jour un vaccin avec succès', async () => {
      req.params.id = 'vaccine-1';
      req.body.name = 'BCG Modifié';
      req.body.description = 'Description modifiée';
      req.body.dosesRequired = '2';
      req.body.gender = null;
      const mockVaccine = {
        id: 'vaccine-1',
        name: 'BCG Modifié',
        description: 'Description modifiée',
        dosesRequired: 2,
        gender: null,
      };
      prisma.vaccine.update.mockResolvedValue(mockVaccine);

      await updateVaccine(req, res, next);

      expect(prisma.vaccine.update).toHaveBeenCalledWith({
        where: { id: 'vaccine-1' },
        data: {
          name: 'BCG Modifié',
          description: 'Description modifiée',
          dosesRequired: '2',
          gender: null,
        },
      });
      expect(res.json).toHaveBeenCalledWith(mockVaccine);
    });

    it('devrait retourner 400 si champs obligatoires manquants', async () => {
      req.params.id = 'vaccine-1';
      req.body.name = '';
      await updateVaccine(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteVaccine', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await deleteVaccine(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait supprimer un vaccin avec succès', async () => {
      req.params.id = 'vaccine-1';
      prisma.vaccine.findUnique.mockResolvedValue({ id: 'vaccine-1', name: 'BCG' });
      prisma.childVaccineScheduled.findMany.mockResolvedValue([]);
      prisma.stockLot.findMany.mockResolvedValue([]);
      stockLotService.deleteLotCascade.mockResolvedValue([]);
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          vaccine: {
            findUnique: prisma.vaccine.findUnique,
            delete: jest.fn().mockResolvedValue({}),
          },
          childVaccineScheduled: {
            findMany: prisma.childVaccineScheduled.findMany,
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          childVaccineCompleted: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          childVaccineDue: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          childVaccineLate: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          childVaccineOverdue: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          stockReservation: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          stockLot: {
            findMany: prisma.stockLot.findMany,
          },
          stockNATIONAL: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          stockREGIONAL: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          stockDISTRICT: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          stockHEALTHCENTER: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          record: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          vaccineRequest: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          stockTransfer: {
            findMany: jest.fn().mockResolvedValue([]),
          },
          stockTransferLot: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          children: {
            updateMany: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      await deleteVaccine(req, res, next);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });

    it('devrait retourner 404 si vaccin introuvable', async () => {
      req.params.id = 'vaccine-1';
      prisma.vaccine.findUnique.mockResolvedValue(null);

      await deleteVaccine(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createVaccineCalendar', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await createVaccineCalendar(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait créer un calendrier vaccinal avec succès', async () => {
      req.body.description = 'Calendrier 0-2 mois';
      req.body.ageUnit = 'MONTHS';
      req.body.specificAge = 2;
      req.body.vaccine = [{ vaccineId: 'vaccine-1', doseCount: 1 }];
      const mockCalendar = {
        id: 'calendar-1',
        description: 'Calendrier 0-2 mois',
        ageUnit: 'MONTHS',
        specificAge: 2,
        doseAssignments: [],
      };
      prisma.vaccineCalendar.create.mockResolvedValue(mockCalendar);
      prisma.vaccineCalendarDose.groupBy.mockResolvedValue([]);
      prisma.vaccine.findMany.mockResolvedValue([{ id: 'vaccine-1', name: 'BCG', dosesRequired: 1 }]);
      prisma.vaccineCalendarDose.createMany.mockResolvedValue({});
      prisma.vaccineCalendar.findUnique.mockResolvedValue(mockCalendar);
      prisma.vaccineCalendarDose.findMany.mockResolvedValue([]);
      prisma.vaccineCalendarDose.updateMany.mockResolvedValue({});
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          vaccineCalendar: {
            create: prisma.vaccineCalendar.create,
            findUnique: prisma.vaccineCalendar.findUnique,
          },
          vaccineCalendarDose: {
            groupBy: prisma.vaccineCalendarDose.groupBy,
            createMany: prisma.vaccineCalendarDose.createMany,
            findMany: prisma.vaccineCalendarDose.findMany,
            updateMany: prisma.vaccineCalendarDose.updateMany,
          },
          vaccine: {
            findMany: prisma.vaccine.findMany,
          },
        };
        const result = await callback(mockTx);
        return result;
      });

      await createVaccineCalendar(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 400 si aucun vaccin fourni', async () => {
      req.body.description = 'Calendrier 0-2 mois';
      req.body.ageUnit = 'MONTHS';
      req.body.vaccine = [];
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          vaccine: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        };
        return callback(mockTx);
      });

      await createVaccineCalendar(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toContain('Veuillez sélectionner au moins un vaccin');
    });
  });

  describe('ScheduleVaccine', () => {
    it('devrait retourner 403 si utilisateur n\'est pas AGENT', async () => {
      req.user.role = 'NATIONAL';
      await ScheduleVaccine(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner 403 si agent n\'a pas de healthCenterId', async () => {
      req.user.role = 'AGENT';
      req.user.healthCenterId = null;
      await ScheduleVaccine(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait programmer un vaccin avec succès', async () => {
      req.user.role = 'AGENT';
      req.user.healthCenterId = 'healthcenter-1';
      req.body.childId = 'child-1';
      req.body.vaccineId = 'vaccine-1';
      req.body.scheduledFor = '2025-12-31T10:00:00Z';
      const mockChild = { id: 'child-1', healthCenterId: 'healthcenter-1', gender: 'M' };
      const mockVaccine = { id: 'vaccine-1', dosesRequired: 1, gender: null };
      const mockScheduled = {
        id: 'scheduled-1',
        childId: 'child-1',
        vaccineId: 'vaccine-1',
        scheduledFor: new Date('2025-12-31T10:00:00Z'),
        dose: 1,
        vaccine: { id: 'vaccine-1', name: 'BCG', dosesRequired: 1 },
        child: { id: 'child-1', phoneParent: '+221123456789' },
      };
      prisma.children.findUnique.mockResolvedValue(mockChild);
      prisma.vaccine.findUnique.mockResolvedValue(mockVaccine);
      prisma.childVaccineCompleted.count.mockResolvedValue(0);
      prisma.childVaccineScheduled.count.mockResolvedValue(0);
      stockLotService.reserveDoseForHealthCenter.mockResolvedValue({ lotId: 'lot-1', quantity: 1 });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          children: {
            findUnique: prisma.children.findUnique,
            update: jest.fn().mockResolvedValue({}),
          },
          vaccine: {
            findUnique: prisma.vaccine.findUnique,
          },
          childVaccineCompleted: {
            count: prisma.childVaccineCompleted.count,
            findMany: jest.fn().mockResolvedValue([]),
          },
          childVaccineScheduled: {
            count: prisma.childVaccineScheduled.count,
            create: jest.fn().mockResolvedValue(mockScheduled),
            findUnique: jest.fn().mockResolvedValue(mockScheduled),
            findFirst: jest.fn().mockResolvedValue(mockScheduled),
            findMany: jest.fn().mockResolvedValue([mockScheduled]),
            update: jest.fn().mockResolvedValue(mockScheduled),
            updateMany: jest.fn().mockResolvedValue({}),
          },
          stockReservation: {
            create: jest.fn().mockResolvedValue({ id: 'reservation-1' }),
          },
        };
        const result = await callback(mockTx);
        return result;
      });

      await ScheduleVaccine(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 400 si tous les champs requis ne sont pas fournis', async () => {
      req.user.role = 'AGENT';
      req.user.healthCenterId = 'healthcenter-1';
      req.body.childId = 'child-1';
      // vaccineId et scheduledFor manquants
      await ScheduleVaccine(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 404 si enfant introuvable', async () => {
      req.user.role = 'AGENT';
      req.user.healthCenterId = 'healthcenter-1';
      req.body.childId = 'child-1';
      req.body.vaccineId = 'vaccine-1';
      req.body.scheduledFor = '2025-12-31T10:00:00Z';
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          children: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(mockTx);
      });

      await ScheduleVaccine(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('devrait retourner 403 si enfant n\'appartient pas au centre de santé de l\'agent', async () => {
      req.user.role = 'AGENT';
      req.user.healthCenterId = 'healthcenter-1';
      req.body.childId = 'child-1';
      req.body.vaccineId = 'vaccine-1';
      req.body.scheduledFor = '2025-12-31T10:00:00Z';
      const mockChild = { id: 'child-1', healthCenterId: 'healthcenter-2' }; // Différent
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          children: {
            findUnique: jest.fn().mockResolvedValue(mockChild),
          },
        };
        return callback(mockTx);
      });

      await ScheduleVaccine(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('completeVaccine', () => {
    it('devrait retourner 403 si utilisateur n\'est pas AGENT', async () => {
      req.user.role = 'NATIONAL';
      await completeVaccine(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait compléter un vaccin avec succès', async () => {
      req.user.role = 'AGENT';
      req.user.healthCenterId = 'healthcenter-1';
      req.params.id = 'scheduled-1';
      req.body.notes = 'Vaccin administré avec succès';
      const mockScheduled = {
        id: 'scheduled-1',
        childId: 'child-1',
        vaccineId: 'vaccine-1',
        vaccineCalendarId: 'calendar-1',
        plannerId: 'user-1',
        dose: 1,
        child: { healthCenterId: 'healthcenter-1' },
      };
      const mockCompleted = {
        id: 'completed-1',
        childId: 'child-1',
        vaccineId: 'vaccine-1',
        dose: 1,
      };
      const mockVaccine = { dosesRequired: 1 };
      prisma.childVaccineScheduled.findUnique.mockResolvedValue(mockScheduled);
      prisma.vaccine.findUnique.mockResolvedValue(mockVaccine);
      prisma.childVaccineCompleted.count.mockResolvedValue(1);
      prisma.childVaccineLate.count.mockResolvedValue(0);
      prisma.childVaccineOverdue.count.mockResolvedValue(0);
      stockLotService.releaseDoseForHealthCenter.mockResolvedValue();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          childVaccineScheduled: {
            findUnique: prisma.childVaccineScheduled.findUnique,
            delete: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue(mockScheduled),
            findFirst: jest.fn().mockResolvedValue(mockScheduled),
            findMany: jest.fn().mockResolvedValue([mockScheduled]),
            updateMany: jest.fn().mockResolvedValue({}),
          },
          childVaccineCompleted: {
            create: jest.fn().mockResolvedValue(mockCompleted),
            count: prisma.childVaccineCompleted.count,
            findMany: jest.fn().mockResolvedValue([]),
          },
          childVaccineDue: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          childVaccineLate: {
            deleteMany: jest.fn().mockResolvedValue({}),
            count: prisma.childVaccineLate.count,
          },
          childVaccineOverdue: {
            deleteMany: jest.fn().mockResolvedValue({}),
            count: prisma.childVaccineOverdue.count,
          },
          vaccine: {
            findUnique: prisma.vaccine.findUnique,
          },
          children: {
            update: jest.fn().mockResolvedValue({}),
          },
          stockReservation: {
            findUnique: jest.fn().mockResolvedValue({ id: 'reservation-1', quantity: 1, stockLot: { id: 'lot-1', ownerType: 'HEALTHCENTER', ownerId: 'healthcenter-1', vaccineId: 'vaccine-1' } }),
            delete: jest.fn().mockResolvedValue({}),
          },
        };
        const result = await callback(mockTx);
        return result;
      });

      await completeVaccine(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 404 si rendez-vous introuvable', async () => {
      req.user.role = 'AGENT';
      req.user.healthCenterId = 'healthcenter-1';
      req.params.id = 'scheduled-1';
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          childVaccineScheduled: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(mockTx);
      });

      await completeVaccine(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('cancelScheduledVaccine', () => {
    it('devrait retourner 403 si utilisateur n\'est pas AGENT', async () => {
      req.user.role = 'NATIONAL';
      await cancelScheduledVaccine(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait annuler un rendez-vous avec succès', async () => {
      req.user.role = 'AGENT';
      req.user.healthCenterId = 'healthcenter-1';
      req.params.id = 'scheduled-1';
      const mockScheduled = {
        id: 'scheduled-1',
        childId: 'child-1',
        scheduledFor: new Date('2025-12-31T10:00:00Z'),
        child: { healthCenterId: 'healthcenter-1', id: 'child-1' },
        vaccine: { id: 'vaccine-1', name: 'BCG' },
      };
      prisma.childVaccineScheduled.findUnique.mockResolvedValue(mockScheduled);
      stockLotService.releaseDoseForHealthCenter.mockResolvedValue();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          childVaccineScheduled: {
            findUnique: prisma.childVaccineScheduled.findUnique,
            delete: jest.fn().mockResolvedValue({}),
            findFirst: jest.fn().mockResolvedValue(null),
            findMany: jest.fn().mockResolvedValue([]),
            updateMany: jest.fn().mockResolvedValue({}),
          },
          children: {
            update: jest.fn().mockResolvedValue({}),
          },
          stockReservation: {
            findUnique: jest.fn().mockResolvedValue({ id: 'reservation-1', quantity: 1, stockLot: { id: 'lot-1', ownerType: 'HEALTHCENTER', ownerId: 'healthcenter-1', vaccineId: 'vaccine-1' } }),
            delete: jest.fn().mockResolvedValue({}),
          },
          childVaccineCompleted: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        };
        const result = await callback(mockTx);
        return result;
      });

      await cancelScheduledVaccine(req, res, next);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('listVaccines', () => {
    it('devrait retourner 403 si utilisateur n\'a pas les permissions', async () => {
      req.user.role = 'PARENT';
      await listVaccines(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner la liste des vaccins avec succès', async () => {
      const mockVaccines = [
        { id: 'vaccine-1', name: 'BCG', description: 'Vaccin BCG', dosesRequired: 1 },
      ];
      prisma.vaccine.findMany.mockResolvedValue(mockVaccines);

      await listVaccines(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockVaccines);
    });
  });

  describe('listVaccineCalendars', () => {
    it('devrait retourner 403 si utilisateur n\'a pas les permissions', async () => {
      req.user.role = 'PARENT';
      await listVaccineCalendars(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner la liste des calendriers avec succès', async () => {
      const mockCalendars = [
        {
          id: 'calendar-1',
          description: 'Calendrier 0-2 mois',
          ageUnit: 'MONTHS',
          specificAge: 2,
          doseAssignments: [],
        },
      ];
      prisma.vaccineCalendar.findMany.mockResolvedValue(mockCalendars);

      await listVaccineCalendars(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('listVaccineCalendarDoseWarnings', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await listVaccineCalendarDoseWarnings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner les avertissements de doses manquantes', async () => {
      const mockVaccines = [
        { id: 'vaccine-1', name: 'BCG', dosesRequired: 2 },
      ];
      const mockCounts = [
        { vaccineId: 'vaccine-1', _count: { vaccineId: 1 } },
      ];
      prisma.vaccine.findMany.mockResolvedValue(mockVaccines);
      prisma.vaccineCalendarDose.groupBy.mockResolvedValue(mockCounts);

      await listVaccineCalendarDoseWarnings(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.warnings).toBeDefined();
    });
  });
});






