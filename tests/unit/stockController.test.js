// tests/unit/stockController.test.js

const {
  createStockNATIONAL,
  createStockREGIONAL,
  createStockDISTRICT,
  createStockHEALTHCENTER,
  addStockNATIONAL,
  addStockREGIONAL,
  addStockDISTRICT,
  addStockHEALTHCENTER,
  updateStockNATIONAL,
  updateStockREGIONAL,
  updateStockDISTRICT,
  updateStockHEALTHCENTER,
  reduceStockNATIONAL,
  reduceStockREGIONAL,
  reduceStockDISTRICT,
  reduceStockHEALTHCENTER,
  deleteStockNATIONAL,
  deleteStockREGIONAL,
  deleteStockDISTRICT,
  deleteStockHEALTHCENTER,
  getStockNATIONAL,
  getStockREGIONAL,
  getStockDISTRICT,
  getStockHEALTHCENTER,
  listNationalLots,
  listRegionalLots,
  listDistrictLots,
  listHealthCenterLots,
  reduceLotNATIONAL,
  reduceLotREGIONAL,
  reduceLotDISTRICT,
  reduceLotHEALTHCENTER,
  deleteLot,
  getNationalStockStats,
  getRegionalStockStats,
  getDistrictStockStats,
  getHealthCenterStockStats,
  getHealthCenterReservations,
  getPendingTransfers,
  confirmPendingTransfer,
  rejectPendingTransfer,
  cancelPendingTransfer,
  getTransferHistory,
  getPendingTransfersForSender,
  getStockHealthCenterDeleteImpact,
  getLotDeleteImpact,
  getLotReduceImpact,
} = require('../../src/controllers/stockController');

const prisma = require('../../src/config/prismaClient');
const stockLotService = require('../../src/services/stockLotService');
const emailService = require('../../src/services/emailService');

// Mock des dépendances
jest.mock('../../src/config/prismaClient', () => ({
  StockNATIONAL: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  StockREGIONAL: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  StockDISTRICT: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  StockHEALTHCENTER: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  stockNATIONAL: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  stockREGIONAL: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  stockDISTRICT: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  stockHEALTHCENTER: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  stockLot: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  stockReservation: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  pendingStockTransfer: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  pendingStockTransferLot: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
  stockTransfer: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  stockTransferHistory: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  stockTransferLot: {
    findMany: jest.fn(),
  },
  childVaccineScheduled: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  district: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  commune: {
    findUnique: jest.fn(),
  },
  healthCenter: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  region: {
    findUnique: jest.fn(),
  },
  eventLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn(async (callback) => {
    const mockPrisma = require('../../src/config/prismaClient');
    const mockTx = {
      StockNATIONAL: mockPrisma.StockNATIONAL,
      StockREGIONAL: mockPrisma.StockREGIONAL,
      StockDISTRICT: mockPrisma.StockDISTRICT,
      StockHEALTHCENTER: mockPrisma.StockHEALTHCENTER,
      stockNATIONAL: mockPrisma.stockNATIONAL,
      stockREGIONAL: mockPrisma.stockREGIONAL,
      stockDISTRICT: mockPrisma.stockDISTRICT,
      stockHEALTHCENTER: mockPrisma.stockHEALTHCENTER,
      stockLot: mockPrisma.stockLot,
      stockReservation: mockPrisma.stockReservation,
      pendingStockTransfer: mockPrisma.pendingStockTransfer,
      pendingStockTransferLot: mockPrisma.pendingStockTransferLot,
      stockTransfer: mockPrisma.stockTransfer,
      stockTransferHistory: mockPrisma.stockTransferHistory,
      stockTransferLot: mockPrisma.stockTransferLot,
      childVaccineScheduled: mockPrisma.childVaccineScheduled,
      user: mockPrisma.user,
      district: mockPrisma.district,
      commune: mockPrisma.commune,
      healthCenter: mockPrisma.healthCenter,
      region: mockPrisma.region,
      eventLog: mockPrisma.eventLog,
    };
    return await callback(mockTx);
  }),
}));

jest.mock('../../src/services/stockLotService', () => ({
  OWNER_TYPES: {
    NATIONAL: 'NATIONAL',
    REGIONAL: 'REGIONAL',
    DISTRICT: 'DISTRICT',
    HEALTHCENTER: 'HEALTHCENTER',
  },
  LOT_STATUS: {
    VALID: 'VALID',
    EXPIRED: 'EXPIRED',
    PENDING: 'PENDING',
  },
  deleteLotDirect: jest.fn(),
  createLot: jest.fn(),
  consumeLots: jest.fn(),
  recordTransfer: jest.fn(),
  deleteLotCascade: jest.fn(),
  updateNearestExpiration: jest.fn(),
  restoreOrRecreateLotForRejectedTransfer: jest.fn(),
  normalizeOwnerId: jest.fn(),
}));

jest.mock('../../src/services/emailService', () => ({
  sendStockTransferNotificationEmail: jest.fn(),
  sendTransferRejectedEmail: jest.fn(),
  sendTransferCancelledEmail: jest.fn(),
}));

describe('stockController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Définir des valeurs par défaut pour les mocks qui peuvent être appelés de manière asynchrone
    prisma.user.findMany.mockResolvedValue([]);
    prisma.eventLog.create.mockResolvedValue({ id: 'event-1' });

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
    };

    next = jest.fn();
  });

  describe('createStockNATIONAL', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await createStockNATIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    });

    it('devrait créer un stock national avec succès', async () => {
      req.body.vaccineId = 'vaccine-1';
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1' };
      prisma.StockNATIONAL.create.mockResolvedValue(mockStock);

      await createStockNATIONAL(req, res, next);

      expect(prisma.StockNATIONAL.create).toHaveBeenCalledWith({
        data: { vaccineId: 'vaccine-1' },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockStock);
    });

    it('devrait gérer les erreurs de base de données', async () => {
      req.body.vaccineId = 'vaccine-1';
      const error = new Error('Erreur DB');
      prisma.StockNATIONAL.create.mockRejectedValue(error);

      await createStockNATIONAL(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createStockREGIONAL', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL ou REGIONAL', async () => {
      req.user.role = 'DISTRICT';
      await createStockREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    });

    it('devrait créer un stock régional avec succès (NATIONAL)', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.regionId = 'region-1';
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', regionId: 'region-1' };
      prisma.StockREGIONAL.create.mockResolvedValue(mockStock);

      await createStockREGIONAL(req, res, next);

      expect(prisma.StockREGIONAL.create).toHaveBeenCalledWith({
        data: { vaccineId: 'vaccine-1', regionId: 'region-1' },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockStock);
    });

    it('devrait créer un stock régional avec succès (REGIONAL)', async () => {
      req.user.role = 'REGIONAL';
      req.user.regionId = 'region-1';
      req.body.vaccineId = 'vaccine-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', regionId: 'region-1' };
      prisma.StockREGIONAL.create.mockResolvedValue(mockStock);

      await createStockREGIONAL(req, res, next);

      expect(prisma.StockREGIONAL.create).toHaveBeenCalledWith({
        data: { vaccineId: 'vaccine-1', regionId: 'region-1' },
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('devrait retourner 400 si vaccineId manquant', async () => {
      req.body.regionId = 'region-1';
      await createStockREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'vaccineId est requis pour créer un stock régional',
      });
    });

    it('devrait retourner 400 si regionId manquant pour NATIONAL', async () => {
      req.body.vaccineId = 'vaccine-1';
      await createStockREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'regionId est requis pour créer un stock régional',
      });
    });
  });

  describe('createStockDISTRICT', () => {
    it('devrait retourner 403 si utilisateur n\'est pas REGIONAL ou DISTRICT', async () => {
      req.user.role = 'NATIONAL';
      await createStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    });

    it('devrait créer un stock district avec succès (REGIONAL)', async () => {
      req.user.role = 'REGIONAL';
      req.user.regionId = 'region-1';
      req.body.vaccineId = 'vaccine-1';
      req.body.districtId = 'district-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      prisma.district.findUnique.mockResolvedValue({
        id: 'district-1',
        commune: { regionId: 'region-1' },
      });
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', districtId: 'district-1' };
      prisma.StockDISTRICT.create.mockResolvedValue(mockStock);

      await createStockDISTRICT(req, res, next);

      expect(prisma.StockDISTRICT.create).toHaveBeenCalledWith({
        data: { vaccineId: 'vaccine-1', districtId: 'district-1' },
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('devrait retourner 400 si vaccineId ou districtId manquant', async () => {
      req.user.role = 'REGIONAL';
      await createStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'vaccineId et districtId sont requis',
      });
    });
  });

  describe('createStockHEALTHCENTER', () => {
    it('devrait retourner 403 si utilisateur n\'est pas DISTRICT ou AGENT', async () => {
      req.user.role = 'NATIONAL';
      await createStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    });

    it('devrait créer un stock health center avec succès (AGENT ADMIN)', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.body.vaccineId = 'vaccine-1';
      prisma.user.findUnique.mockResolvedValue({ healthCenterId: 'healthcenter-1' });
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', healthCenterId: 'healthcenter-1' };
      prisma.StockHEALTHCENTER.create.mockResolvedValue(mockStock);

      await createStockHEALTHCENTER(req, res, next);

      expect(prisma.StockHEALTHCENTER.create).toHaveBeenCalledWith({
        data: { vaccineId: 'vaccine-1', healthCenterId: 'healthcenter-1' },
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('devrait retourner 403 si agent n\'est pas ADMIN', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'STAFF';
      req.body.vaccineId = 'vaccine-1';
      await createStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    });
  });

  describe('addStockNATIONAL', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await addStockNATIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    });

    it('devrait ajouter du stock national avec succès', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 100;
      req.body.expiration = '2025-12-31';
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', quantity: 100 };
      const mockLot = { id: 'lot-1', quantity: 100 };
      prisma.stockNATIONAL.findUnique.mockResolvedValue({ id: 'stock-1', quantity: 0 });
      prisma.stockNATIONAL.update.mockResolvedValue(mockStock);
      stockLotService.createLot.mockResolvedValue(mockLot);
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockNATIONAL: {
            findUnique: prisma.stockNATIONAL.findUnique,
            update: prisma.stockNATIONAL.update,
          },
        };
        return callback(mockTx);
      });

      await addStockNATIONAL(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.stock).toBeDefined();
      expect(response.lot).toBeDefined();
    });

    it('devrait retourner 400 si quantity invalide', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = -10;
      await addStockNATIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si expiration manquante', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 100;
      await addStockNATIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 404 si stock national introuvable', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 100;
      req.body.expiration = '2025-12-31';
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockNATIONAL: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(mockTx);
      });

      await addStockNATIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('addStockREGIONAL', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await addStockREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait ajouter du stock régional avec succès', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.regionId = 'region-1';
      req.body.quantity = 100;
      req.user.role = 'NATIONAL';
      
      const mockRegionalStock = { 
        id: 'stock-1', 
        vaccineId: 'vaccine-1', 
        regionId: 'region-1', 
        quantity: 0, 
        region: { name: 'Dakar' }, 
        vaccine: { name: 'BCG' } 
      };
      const mockNationalStock = { 
        id: 'stock-1', 
        vaccineId: 'vaccine-1', 
        quantity: 200,
        vaccine: { name: 'BCG' }
      };
      const mockAllocations = [{ lotId: 'lot-1', quantity: 100 }];
      const mockFirstLot = { id: 'lot-1', expiration: new Date('2025-12-31') };
      const mockPendingTransfer = { 
        id: 'transfer-1',
        vaccine: { name: 'BCG' },
        lots: [{ lot: { id: 'lot-1' } }],
      };
      const mockUpdatedNational = { 
        id: 'stock-1', 
        vaccineId: 'vaccine-1', 
        quantity: 100,
        vaccine: { name: 'BCG' }
      };

      stockLotService.consumeLots.mockResolvedValue([{ lotId: 'lot-1', quantity: 100 }]);
      stockLotService.createLot.mockResolvedValue({ id: 'pending-lot-1' });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockREGIONAL: {
            findUnique: jest.fn().mockResolvedValue(mockRegionalStock),
            create: jest.fn().mockResolvedValue(mockRegionalStock),
          },
          stockNATIONAL: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockNationalStock) // Vérification quantité
              .mockResolvedValueOnce(mockUpdatedNational), // Récupération après update
            update: jest.fn().mockResolvedValue({ ...mockNationalStock, quantity: 100 }),
          },
          stockLot: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ remainingQuantity: 0, quantity: 0 }) // Vérification lot vide
              .mockResolvedValueOnce(mockFirstLot), // Récupération expiration
            delete: jest.fn().mockResolvedValue({}),
          },
          pendingStockTransfer: {
            create: jest.fn().mockResolvedValue(mockPendingTransfer),
          },
        };
        return callback(mockTx);
      });

      await addStockREGIONAL(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          national: expect.any(Object),
          pendingTransfer: expect.any(Object),
          message: expect.any(String),
        })
      );
    });

    it('devrait retourner 400 si quantité insuffisante dans stock national', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.regionId = 'region-1';
      req.body.quantity = 100;
      const mockRegionalStock = { id: 'stock-1', vaccineId: 'vaccine-1', regionId: 'region-1', quantity: 100, region: { name: 'Dakar' }, vaccine: { name: 'BCG' } };
      const mockNationalStock = { id: 'stock-1', vaccineId: 'vaccine-1', quantity: 50 };
      prisma.stockREGIONAL.findUnique.mockResolvedValue(mockRegionalStock);
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockREGIONAL: {
            findUnique: prisma.stockREGIONAL.findUnique,
          },
          stockNATIONAL: {
            findUnique: jest.fn().mockResolvedValue(mockNationalStock),
          },
        };
        // La transaction doit lancer une erreur avec status 400
        const error = Object.assign(new Error('Quantité insuffisante dans le stock national'), { status: 400 });
        throw error;
      });

      await addStockREGIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quantité insuffisante dans le stock national',
      });
    });
  });

  describe('updateStockNATIONAL', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await updateStockNATIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait mettre à jour le stock national avec succès', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 200;
      req.body.expiration = '2025-12-31';
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', quantity: 200 };
      prisma.stockNATIONAL.findUnique.mockResolvedValue({ id: 'stock-1', quantity: 100 });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockNATIONAL: {
            findUnique: prisma.stockNATIONAL.findUnique,
            update: jest.fn().mockResolvedValue(mockStock),
          },
        };
        stockLotService.createLot.mockResolvedValue({ id: 'lot-1' });
        stockLotService.updateNearestExpiration.mockResolvedValue();
        return callback(mockTx);
      });

      await updateStockNATIONAL(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 404 si stock national introuvable', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 200;
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockNATIONAL: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(mockTx);
      });

      await updateStockNATIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('devrait retourner 400 si vaccineId manquant', async () => {
      req.body.quantity = 200;
      await updateStockNATIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'vaccineId et quantity (>= 0) sont requis',
      });
    });

    it('devrait retourner 400 si quantity est négative', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = -10;
      await updateStockNATIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'vaccineId et quantity (>= 0) sont requis',
      });
    });

    it('devrait retourner 400 si quantity n\'est pas un nombre', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 'not-a-number';
      await updateStockNATIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si expiration manquante quand delta > 0', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 200; // Plus que le stock actuel (100)
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockNATIONAL: {
            findUnique: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 100 }),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        try {
          return await callback(mockTx);
        } catch (error) {
          throw error;
        }
      });

      await updateStockNATIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'La date d\'expiration est requise pour l\'ajout de nouveaux lots',
      });
    });

    it('devrait gérer les erreurs avec status', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 200;
      const error = new Error('Erreur test');
      error.status = 500;
      prisma.$transaction.mockRejectedValue(error);

      await updateStockNATIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Erreur test' });
    });

    it('devrait gérer les erreurs sans status', async () => {
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 200;
      const error = new Error('Erreur DB');
      prisma.$transaction.mockRejectedValue(error);

      await updateStockNATIONAL(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteStockNATIONAL', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await deleteStockNATIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait supprimer le stock national avec succès', async () => {
      req.body.vaccineId = 'vaccine-1';
      prisma.stockNATIONAL.findUnique.mockResolvedValue({ id: 'stock-1', vaccineId: 'vaccine-1' });
      prisma.stockLot.findMany.mockResolvedValue([{ id: 'lot-1' }]);
      stockLotService.deleteLotDirect.mockResolvedValue('lot-1');
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockNATIONAL: {
            findUnique: jest.fn().mockResolvedValue({ id: 'stock-1', vaccineId: 'vaccine-1' }),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockLot: {
            findMany: jest.fn().mockResolvedValue([{ id: 'lot-1' }]),
          },
        };
        return callback(mockTx);
      });

      await deleteStockNATIONAL(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('devrait retourner 400 si vaccineId manquant', async () => {
      await deleteStockNATIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getStockNATIONAL', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await getStockNATIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner la liste des stocks nationaux avec succès', async () => {
      const mockStocks = [
        { id: 'stock-1', vaccineId: 'vaccine-1', vaccine: { name: 'BCG' } },
      ];
      prisma.stockNATIONAL.findMany.mockResolvedValue(mockStocks);
      prisma.stockLot.findMany.mockResolvedValue([]);

      await getStockNATIONAL(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.national).toBeDefined();
    });

    it('devrait retourner la liste des stocks nationaux avec succès pour SUPERADMIN', async () => {
      req.user.role = 'SUPERADMIN';
      const mockStocks = [
        { id: 'stock-1', vaccineId: 'vaccine-1', vaccine: { name: 'BCG' } },
      ];
      prisma.stockNATIONAL.findMany.mockResolvedValue(mockStocks);
      prisma.stockLot.findMany.mockResolvedValue([]);

      await getStockNATIONAL(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.national).toBeDefined();
    });

    it('devrait gérer les erreurs', async () => {
      const error = new Error('Erreur base de données');
      prisma.stockNATIONAL.findMany.mockRejectedValue(error);

      await getStockNATIONAL(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('listNationalLots', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await listNationalLots(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner la liste des lots nationaux avec succès', async () => {
      req.params.vaccineId = 'vaccine-1';
      const mockLots = [
        { id: 'lot-1', vaccineId: 'vaccine-1', quantity: 100, remainingQuantity: 100, expiration: new Date(), status: 'VALID', _count: { derivedLots: 0 } },
      ];
      prisma.stockLot.findMany.mockResolvedValue(mockLots);

      await listNationalLots(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.lots).toBeDefined();
      expect(response.totalRemaining).toBeDefined();
    });

    it('devrait retourner la liste des lots nationaux avec succès pour SUPERADMIN', async () => {
      req.user.role = 'SUPERADMIN';
      req.params.vaccineId = 'vaccine-1';
      const mockLots = [
        { id: 'lot-1', vaccineId: 'vaccine-1', quantity: 100, remainingQuantity: 100, expiration: new Date(), status: 'VALID', _count: { derivedLots: 0 } },
      ];
      prisma.stockLot.findMany.mockResolvedValue(mockLots);

      await listNationalLots(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.lots).toBeDefined();
    });

    it('devrait retourner 400 si vaccineId manquant', async () => {
      await listNationalLots(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait gérer les erreurs', async () => {
      req.params.vaccineId = 'vaccine-1';
      const error = new Error('Erreur base de données');
      prisma.stockLot.findMany.mockRejectedValue(error);

      await listNationalLots(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('reduceLotNATIONAL', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      req.user = { role: 'NATIONAL', id: 'user-1' };
      req.params = {};
      req.body = {};
    });

    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL ou SUPERADMIN', async () => {
      req.user.role = 'REGIONAL';
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      await reduceLotNATIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait réduire la quantité d\'un lot avec succès', async () => {
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      
      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'NATIONAL',
        ownerId: null,
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      const mockUpdatedLot = {
        ...mockLot,
        remainingQuantity: 90,
      };

      const mockAllLots = [
        { remainingQuantity: 90 },
        { remainingQuantity: 50 },
      ];

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
            findMany: jest.fn().mockResolvedValue(mockAllLots),
            update: jest.fn().mockResolvedValue(mockUpdatedLot),
          },
          stockNATIONAL: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        stockLotService.updateNearestExpiration.mockResolvedValue();
        return callback(mockTx);
      });

      await reduceLotNATIONAL(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.remainingQuantity).toBe(90);
    });

    it('devrait recalculer la quantité totale du stock après réduction', async () => {
      req.params.id = 'lot-1';
      req.body.quantity = 20;
      
      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'NATIONAL',
        ownerId: null,
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      const mockAllLots = [
        { remainingQuantity: 80 }, // lot-1 après réduction
        { remainingQuantity: 50 }, // autre lot
      ];

      let stockUpdateCalled = false;
      let stockUpdateQuantity = null;

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
            findMany: jest.fn().mockResolvedValue(mockAllLots),
            update: jest.fn().mockResolvedValue({ ...mockLot, remainingQuantity: 80 }),
          },
          stockNATIONAL: {
            update: jest.fn().mockImplementation(async (args) => {
              stockUpdateCalled = true;
              stockUpdateQuantity = args.data.quantity;
              return {};
            }),
          },
        };
        stockLotService.updateNearestExpiration.mockResolvedValue();
        return callback(mockTx);
      });

      await reduceLotNATIONAL(req, res, next);

      expect(stockUpdateCalled).toBe(true);
      expect(stockUpdateQuantity).toBe(130); // 80 + 50
    });

    it('devrait appeler updateNearestExpiration après réduction', async () => {
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      
      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'NATIONAL',
        ownerId: null,
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      const mockAllLots = [{ remainingQuantity: 90 }];

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
            findMany: jest.fn().mockResolvedValue(mockAllLots),
            update: jest.fn().mockResolvedValue({ ...mockLot, remainingQuantity: 90 }),
          },
          stockNATIONAL: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        stockLotService.updateNearestExpiration.mockResolvedValue();
        return callback(mockTx);
      });

      await reduceLotNATIONAL(req, res, next);

      expect(stockLotService.updateNearestExpiration).toHaveBeenCalledWith(
        expect.any(Object), // mockTx
        expect.objectContaining({
          vaccineId: 'vaccine-1',
          ownerType: 'NATIONAL',
          ownerId: null,
        })
      );
    });

    it('devrait retourner 404 si lot introuvable', async () => {
      req.params.id = 'lot-inexistant';
      req.body.quantity = 10;

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(mockTx);
      });

      await reduceLotNATIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Lot introuvable' });
    });

    it('devrait retourner 400 si quantité supérieure à la quantité restante du lot', async () => {
      req.params.id = 'lot-1';
      req.body.quantity = 150; // Supérieur à remainingQuantity

      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'NATIONAL',
        ownerId: null,
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
          },
        };
        return callback(mockTx);
      });

      await reduceLotNATIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('dépasse la quantité restante'),
      });
    });

    it('devrait retourner 403 si le lot n\'appartient pas au stock national', async () => {
      req.params.id = 'lot-1';
      req.body.quantity = 10;

      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'REGIONAL', // Pas NATIONAL
        ownerId: 'region-1',
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
          },
        };
        return callback(mockTx);
      });

      await reduceLotNATIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ce lot n'appartient pas au stock national",
      });
    });

    it('devrait retourner 400 si lotId manquant', async () => {
      req.params.id = undefined;
      req.body.quantity = 10;

      await reduceLotNATIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'lotId est requis' });
    });

    it('devrait retourner 400 si quantity manquant ou invalide', async () => {
      req.params.id = 'lot-1';
      req.body.quantity = undefined;

      await reduceLotNATIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'quantity doit être un nombre positif',
      });
    });

    it('devrait retourner 400 si quantity est négatif', async () => {
      req.params.id = 'lot-1';
      req.body.quantity = -10;

      await reduceLotNATIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'quantity doit être un nombre positif',
      });
    });

    it('devrait retourner 400 si quantity est zéro', async () => {
      req.params.id = 'lot-1';
      req.body.quantity = 0;

      await reduceLotNATIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'quantity doit être un nombre positif',
      });
    });

    it('devrait gérer plusieurs lots et recalculer correctement la quantité totale', async () => {
      req.params.id = 'lot-1';
      req.body.quantity = 30;
      
      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'NATIONAL',
        ownerId: null,
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      const mockAllLots = [
        { remainingQuantity: 70 }, // lot-1 après réduction de 30
        { remainingQuantity: 50 }, // lot-2
        { remainingQuantity: 25 }, // lot-3
      ];

      let stockUpdateQuantity = null;

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
            findMany: jest.fn().mockResolvedValue(mockAllLots),
            update: jest.fn().mockResolvedValue({ ...mockLot, remainingQuantity: 70 }),
          },
          stockNATIONAL: {
            update: jest.fn().mockImplementation(async (args) => {
              stockUpdateQuantity = args.data.quantity;
              return {};
            }),
          },
        };
        stockLotService.updateNearestExpiration.mockResolvedValue();
        return callback(mockTx);
      });

      await reduceLotNATIONAL(req, res, next);

      expect(stockUpdateQuantity).toBe(145); // 70 + 50 + 25
    });
  });

  describe('getNationalStockStats', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await getNationalStockStats(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner les statistiques du stock national avec succès', async () => {
      prisma.stockNATIONAL.aggregate.mockResolvedValue({
        _sum: { quantity: 1000 },
        _count: { _all: 5 },
      });
      prisma.stockNATIONAL.count.mockResolvedValue(2);
      prisma.stockLot.count.mockResolvedValue(1);

      await getNationalStockStats(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.totalLots).toBe(5);
      expect(response.totalQuantity).toBe(1000);
      expect(response.lowStockCount).toBe(2);
      expect(response.expiredLots).toBe(1);
    });
  });

  describe('deleteLot', () => {
    it('devrait retourner 403 si utilisateur n\'est pas autorisé', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'STAFF'; // STAFF ne peut pas supprimer
      req.params.id = 'lot-1';
      await deleteLot(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait supprimer un lot avec succès', async () => {
      req.user.role = 'NATIONAL';
      req.params.id = 'lot-1';
      const mockLot = { 
        id: 'lot-1', 
        ownerType: 'NATIONAL', // Doit correspondre à OWNER_TYPES.NATIONAL
        ownerId: null,
        status: 'VALID', // Utiliser LOT_STATUS.VALID au lieu de 'ACTIVE'
        expiration: new Date('2025-12-31')
      };
      
      // S'assurer que deleteLotDirect retourne bien 'lot-1'
      stockLotService.deleteLotDirect.mockImplementation(async (tx, lotId) => {
        // Vérifier que tx et lotId sont bien passés
        expect(tx).toBeDefined();
        expect(lotId).toBe('lot-1');
        return 'lot-1';
      });
      
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
          },
          stockReservation: {
            findMany: jest.fn().mockResolvedValue([]), // Pas de réservations pour NATIONAL
          },
          childVaccineScheduled: {
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      await deleteLot(req, res, next);

      expect(stockLotService.deleteLotDirect).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.deletedId).toEqual('lot-1');
    });

    it('devrait retourner 404 si lot introuvable', async () => {
      req.params.id = 'lot-1';
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(mockTx);
      });

      await deleteLot(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('reduceLotREGIONAL', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      req.user = { role: 'REGIONAL', id: 'user-1', regionId: 'region-1' };
      req.params = {};
      req.body = {};
    });

    it('devrait retourner 403 si utilisateur n\'est pas SUPERADMIN, NATIONAL ou REGIONAL', async () => {
      req.user.role = 'DISTRICT';
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      await reduceLotREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait réduire la quantité d\'un lot régional avec succès (REGIONAL)', async () => {
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      
      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'REGIONAL',
        ownerId: 'region-1',
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      const mockUpdatedLot = {
        ...mockLot,
        remainingQuantity: 90,
      };

      const mockAllLots = [
        { remainingQuantity: 90 },
        { remainingQuantity: 50 },
      ];

      prisma.user.findUnique = jest.fn().mockResolvedValue({ regionId: 'region-1' });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
            findMany: jest.fn().mockResolvedValue(mockAllLots),
            update: jest.fn().mockResolvedValue(mockUpdatedLot),
          },
          stockREGIONAL: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        stockLotService.updateNearestExpiration.mockResolvedValue();
        return callback(mockTx);
      });

      await reduceLotREGIONAL(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.remainingQuantity).toBe(90);
    });

    it('devrait permettre à SUPERADMIN de réduire un lot régional', async () => {
      req.user.role = 'SUPERADMIN';
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      
      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'REGIONAL',
        ownerId: 'region-1',
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      const mockAllLots = [{ remainingQuantity: 90 }];

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
            findMany: jest.fn().mockResolvedValue(mockAllLots),
            update: jest.fn().mockResolvedValue({ ...mockLot, remainingQuantity: 90 }),
          },
          stockREGIONAL: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        stockLotService.updateNearestExpiration.mockResolvedValue();
        return callback(mockTx);
      });

      await reduceLotREGIONAL(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 403 si REGIONAL essaie de réduire un lot d\'une autre région', async () => {
      req.user.role = 'REGIONAL';
      req.user.regionId = 'region-1';
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      
      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'REGIONAL',
        ownerId: 'region-2', // Autre région
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      prisma.user.findUnique = jest.fn().mockResolvedValue({ regionId: 'region-1' });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
          },
        };
        return callback(mockTx);
      });

      await reduceLotREGIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Accès refusé pour cette région',
      });
    });

    it('devrait retourner 403 si le lot n\'appartient pas au stock régional', async () => {
      req.user.role = 'REGIONAL';
      req.params.id = 'lot-1';
      req.body.quantity = 10;

      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'NATIONAL', // Pas REGIONAL
        ownerId: null,
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
          },
        };
        return callback(mockTx);
      });

      await reduceLotREGIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ce lot n'appartient pas à une région",
      });
    });
  });

  describe('reduceLotDISTRICT', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      req.user = { role: 'DISTRICT', id: 'user-1', districtId: 'district-1' };
      req.params = {};
      req.body = {};
    });

    it('devrait retourner 403 si utilisateur n\'est pas SUPERADMIN, REGIONAL ou DISTRICT', async () => {
      req.user.role = 'NATIONAL';
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      await reduceLotDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait réduire la quantité d\'un lot district avec succès (DISTRICT)', async () => {
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      
      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'DISTRICT',
        ownerId: 'district-1',
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      const mockAllLots = [{ remainingQuantity: 90 }];

      prisma.user.findUnique = jest.fn().mockResolvedValue({ districtId: 'district-1' });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
            findMany: jest.fn().mockResolvedValue(mockAllLots),
            update: jest.fn().mockResolvedValue({ ...mockLot, remainingQuantity: 90 }),
          },
          stockDISTRICT: {
            update: jest.fn().mockResolvedValue({}),
          },
          district: {
            findUnique: jest.fn().mockResolvedValue({ commune: { regionId: 'region-1' } }),
          },
        };
        stockLotService.updateNearestExpiration.mockResolvedValue();
        return callback(mockTx);
      });

      await reduceLotDISTRICT(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait permettre à SUPERADMIN de réduire un lot district', async () => {
      req.user.role = 'SUPERADMIN';
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      
      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'DISTRICT',
        ownerId: 'district-1',
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      const mockAllLots = [{ remainingQuantity: 90 }];

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
            findMany: jest.fn().mockResolvedValue(mockAllLots),
            update: jest.fn().mockResolvedValue({ ...mockLot, remainingQuantity: 90 }),
          },
          stockDISTRICT: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        stockLotService.updateNearestExpiration.mockResolvedValue();
        return callback(mockTx);
      });

      await reduceLotDISTRICT(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 403 si le lot n\'appartient pas au stock district', async () => {
      req.user.role = 'DISTRICT';
      req.params.id = 'lot-1';
      req.body.quantity = 10;

      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'REGIONAL', // Pas DISTRICT
        ownerId: 'region-1',
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
          },
        };
        return callback(mockTx);
      });

      await reduceLotDISTRICT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ce lot n'appartient pas à un district",
      });
    });
  });

  describe('reduceLotHEALTHCENTER', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      req.user = { role: 'AGENT', id: 'user-1', agentLevel: 'ADMIN', healthCenterId: 'healthcenter-1' };
      req.params = {};
      req.body = {};
    });

    it('devrait retourner 403 si utilisateur n\'est pas SUPERADMIN, DISTRICT ou AGENT', async () => {
      req.user.role = 'REGIONAL';
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      await reduceLotHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner 403 si AGENT n\'est pas ADMIN', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'STAFF';
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      await reduceLotHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait réduire la quantité d\'un lot health center avec succès (AGENT ADMIN)', async () => {
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      
      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'HEALTHCENTER',
        ownerId: 'healthcenter-1',
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      const mockAllLots = [{ remainingQuantity: 90 }];

      prisma.user.findUnique = jest.fn().mockResolvedValue({ healthCenterId: 'healthcenter-1' });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
            findMany: jest.fn().mockResolvedValue(mockAllLots),
            update: jest.fn().mockResolvedValue({ ...mockLot, remainingQuantity: 90 }),
          },
          stockHEALTHCENTER: {
            update: jest.fn().mockResolvedValue({}),
          },
          healthCenter: {
            findUnique: jest.fn().mockResolvedValue({ districtId: 'district-1' }),
          },
        };
        stockLotService.updateNearestExpiration.mockResolvedValue();
        return callback(mockTx);
      });

      await reduceLotHEALTHCENTER(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait permettre à SUPERADMIN de réduire un lot health center', async () => {
      req.user.role = 'SUPERADMIN';
      req.params.id = 'lot-1';
      req.body.quantity = 10;
      
      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'HEALTHCENTER',
        ownerId: 'healthcenter-1',
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      const mockAllLots = [{ remainingQuantity: 90 }];

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
            findMany: jest.fn().mockResolvedValue(mockAllLots),
            update: jest.fn().mockResolvedValue({ ...mockLot, remainingQuantity: 90 }),
          },
          stockHEALTHCENTER: {
            update: jest.fn().mockResolvedValue({}),
          },
          stockReservation: {
            findMany: jest.fn().mockResolvedValue([]), // Pas de réservations pour ce test
          },
          childVaccineScheduled: {
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        stockLotService.updateNearestExpiration.mockResolvedValue();
        return callback(mockTx);
      });

      await reduceLotHEALTHCENTER(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 403 si le lot n\'appartient pas au stock health center', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.params.id = 'lot-1';
      req.body.quantity = 10;

      const mockLot = {
        id: 'lot-1',
        vaccineId: 'vaccine-1',
        ownerType: 'DISTRICT', // Pas HEALTHCENTER
        ownerId: 'district-1',
        remainingQuantity: 100,
        vaccine: { name: 'BCG' },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: jest.fn().mockResolvedValue(mockLot),
          },
        };
        return callback(mockTx);
      });

      await reduceLotHEALTHCENTER(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ce lot n'appartient pas à un centre de santé",
      });
    });
  });

  describe('getPendingTransfers', () => {
    it('devrait retourner 403 si utilisateur n\'est pas REGIONAL, DISTRICT ou AGENT', async () => {
      req.user.role = 'NATIONAL';
      await getPendingTransfers(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner les transferts en attente pour REGIONAL', async () => {
      req.user.role = 'REGIONAL';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      prisma.pendingStockTransfer.findMany.mockResolvedValue([
        { id: 'transfer-1', status: 'PENDING' },
      ]);

      await getPendingTransfers(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.transfers).toBeDefined();
    });
  });

  describe('confirmPendingTransfer', () => {
    it('devrait retourner 403 si utilisateur n\'est pas REGIONAL, DISTRICT ou AGENT', async () => {
      req.user.role = 'NATIONAL';
      await confirmPendingTransfer(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait confirmer un transfert avec succès (REGIONAL)', async () => {
      req.user.role = 'REGIONAL';
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const mockTransfer = {
        id: 'transfer-1',
        vaccineId: 'vaccine-1',
        toType: 'REGIONAL',
        toId: 'region-1',
        status: 'PENDING',
        quantity: 100,
        lots: [
          { lotId: 'lot-1', quantity: 100, lot: { id: 'lot-1', expiration: new Date('2025-12-31'), status: 'VALID' } },
        ],
        vaccine: { name: 'BCG' },
      };
      const mockPendingLot = {
        id: 'pending-lot-1',
        pendingTransferId: 'transfer-1',
        status: 'PENDING',
        ownerType: 'REGIONAL',
        ownerId: 'region-1',
        expiration: new Date('2025-12-31'),
      };
      const mockUpdatedStock = {
        id: 'stock-1',
        quantity: 100,
        vaccine: { name: 'BCG' },
        region: { name: 'Dakar' },
      };
      const mockConfirmedTransfer = {
        ...mockTransfer,
        confirmedBy: {
          id: req.user.id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
        },
      };
      stockLotService.recordTransfer.mockResolvedValue();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockTransfer) // Premier appel pour vérifier
              .mockResolvedValueOnce(mockConfirmedTransfer), // Deuxième appel pour confirmedTransfer
            delete: jest.fn().mockResolvedValue({}),
          },
          stockREGIONAL: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ id: 'stock-1', quantity: 0 })
              .mockResolvedValueOnce(mockUpdatedStock),
            update: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 100 }),
            create: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 0 }),
          },
          stockLot: {
            findFirst: jest.fn().mockResolvedValue(mockPendingLot),
            update: jest.fn().mockResolvedValue({ ...mockPendingLot, status: 'VALID', quantity: 100 }),
          },
          stockTransferHistory: {
            create: jest.fn().mockResolvedValue({ id: 'history-1' }),
          },
          region: {
            findUnique: jest.fn().mockResolvedValue({ name: 'Dakar' }),
          },
        };
        return callback(mockTx);
      });

      await confirmPendingTransfer(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 404 si transfert introuvable', async () => {
      req.user.role = 'REGIONAL';
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(mockTx);
      });

      await confirmPendingTransfer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('devrait retourner 403 si transfert n\'appartient pas à l\'utilisateur', async () => {
      req.user.role = 'REGIONAL';
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const mockTransfer = {
        id: 'transfer-1',
        toType: 'REGIONAL',
        toId: 'region-2', // Différent de region-1
        status: 'PENDING',
      };
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn().mockResolvedValue(mockTransfer),
          },
        };
        return callback(mockTx);
      });

      await confirmPendingTransfer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner 400 si REGIONAL n\'a pas de regionId', async () => {
      req.user.role = 'REGIONAL';
      req.user.id = 'user-1';
      delete req.user.regionId; // Supprimer regionId pour forcer l'appel à la DB
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue(null); // Utilisateur non trouvé ou regionId null

      await confirmPendingTransfer(req, res, next);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { regionId: true },
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Votre compte n'est pas rattaché à une région" });
    });

    it('devrait retourner 400 si DISTRICT n\'a pas de districtId', async () => {
      req.user.role = 'DISTRICT';
      req.user.id = 'user-1';
      delete req.user.districtId; // Supprimer districtId pour forcer l'appel à la DB
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue(null); // Utilisateur non trouvé ou districtId null

      await confirmPendingTransfer(req, res, next);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { districtId: true },
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Votre compte n'est pas rattaché à un district" });
    });

    it('devrait retourner 403 si AGENT n\'est pas ADMIN', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'STAFF';
      req.params.transferId = 'transfer-1';

      await confirmPendingTransfer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner 400 si AGENT n\'a pas de healthCenterId', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.user.healthCenterId = null;
      req.params.transferId = 'transfer-1';

      await confirmPendingTransfer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Votre compte n'est pas rattaché à un centre de santé" });
    });

    it('devrait retourner 400 si transfert déjà confirmé', async () => {
      req.user.role = 'REGIONAL';
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const mockTransfer = {
        id: 'transfer-1',
        toType: 'REGIONAL',
        toId: 'region-1',
        status: 'CONFIRMED',
      };
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn().mockResolvedValue(mockTransfer),
          },
        };
        try {
          return await callback(mockTx);
        } catch (error) {
          throw error;
        }
      });

      await confirmPendingTransfer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si transfert déjà annulé', async () => {
      req.user.role = 'REGIONAL';
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const mockTransfer = {
        id: 'transfer-1',
        toType: 'REGIONAL',
        toId: 'region-1',
        status: 'CANCELLED',
      };
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn().mockResolvedValue(mockTransfer),
          },
        };
        try {
          return await callback(mockTx);
        } catch (error) {
          throw error;
        }
      });

      await confirmPendingTransfer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait créer le stock REGIONAL s\'il n\'existe pas', async () => {
      req.user.role = 'REGIONAL';
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const mockTransfer = {
        id: 'transfer-1',
        vaccineId: 'vaccine-1',
        toType: 'REGIONAL',
        toId: 'region-1',
        status: 'PENDING',
        quantity: 100,
        createdAt: new Date(),
        lots: [
          { lotId: 'lot-1', quantity: 100, lot: { id: 'lot-1', expiration: new Date('2025-12-31'), status: 'VALID' } },
        ],
        vaccine: { name: 'BCG' },
      };
      const mockPendingLot = {
        id: 'pending-lot-1',
        pendingTransferId: 'transfer-1',
        status: 'PENDING',
        ownerType: 'REGIONAL',
        ownerId: 'region-1',
        expiration: new Date('2025-12-31'),
      };
      const mockUpdatedStock = {
        id: 'stock-1',
        quantity: 100,
        vaccine: { name: 'BCG' },
        region: { name: 'Dakar' },
      };
      stockLotService.recordTransfer.mockResolvedValue();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockTransfer)
              .mockResolvedValueOnce({ ...mockTransfer, confirmedBy: null }),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockREGIONAL: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(null) // Stock n'existe pas
              .mockResolvedValueOnce(mockUpdatedStock),
            create: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 0 }),
            update: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 100 }),
          },
          stockLot: {
            findFirst: jest.fn().mockResolvedValue(mockPendingLot),
            update: jest.fn().mockResolvedValue({ ...mockPendingLot, status: 'VALID', quantity: 100 }),
          },
          stockTransferHistory: {
            create: jest.fn().mockResolvedValue({ id: 'history-1' }),
          },
          region: {
            findUnique: jest.fn().mockResolvedValue({ name: 'Dakar' }),
          },
        };
        return callback(mockTx);
      });

      await confirmPendingTransfer(req, res, next);

      expect(prisma.$transaction.mock.calls[0][0]).toBeDefined();
      const mockTx = prisma.$transaction.mock.results[0].value;
      await mockTx;
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait confirmer un transfert pour DISTRICT', async () => {
      req.user.role = 'DISTRICT';
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue({ districtId: 'district-1' });
      const mockTransfer = {
        id: 'transfer-1',
        vaccineId: 'vaccine-1',
        toType: 'DISTRICT',
        toId: 'district-1',
        status: 'PENDING',
        quantity: 100,
        createdAt: new Date(),
        lots: [
          { lotId: 'lot-1', quantity: 100, lot: { id: 'lot-1', expiration: new Date('2025-12-31'), status: 'VALID' } },
        ],
        vaccine: { name: 'BCG' },
      };
      const mockPendingLot = {
        id: 'pending-lot-1',
        pendingTransferId: 'transfer-1',
        status: 'PENDING',
        ownerType: 'DISTRICT',
        ownerId: 'district-1',
        expiration: new Date('2025-12-31'),
      };
      const mockUpdatedStock = {
        id: 'stock-1',
        quantity: 100,
        vaccine: { name: 'BCG' },
        district: { name: 'District Test', commune: {} },
      };
      stockLotService.recordTransfer.mockResolvedValue();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockTransfer)
              .mockResolvedValueOnce({ ...mockTransfer, confirmedBy: null }),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockDISTRICT: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ id: 'stock-1', quantity: 0 })
              .mockResolvedValueOnce(mockUpdatedStock),
            update: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 100 }),
            create: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 0 }),
          },
          stockLot: {
            findFirst: jest.fn().mockResolvedValue(mockPendingLot),
            update: jest.fn().mockResolvedValue({ ...mockPendingLot, status: 'VALID', quantity: 100 }),
          },
          stockTransferHistory: {
            create: jest.fn().mockResolvedValue({ id: 'history-1' }),
          },
          district: {
            findUnique: jest.fn().mockResolvedValue({ name: 'District Test' }),
          },
        };
        return callback(mockTx);
      });

      await confirmPendingTransfer(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait confirmer un transfert pour AGENT ADMIN', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.user.healthCenterId = 'hc-1';
      req.params.transferId = 'transfer-1';
      const mockTransfer = {
        id: 'transfer-1',
        vaccineId: 'vaccine-1',
        toType: 'HEALTHCENTER',
        toId: 'hc-1',
        status: 'PENDING',
        quantity: 100,
        createdAt: new Date(),
        lots: [
          { lotId: 'lot-1', quantity: 100, lot: { id: 'lot-1', expiration: new Date('2025-12-31'), status: 'VALID' } },
        ],
        vaccine: { name: 'BCG' },
      };
      const mockPendingLot = {
        id: 'pending-lot-1',
        pendingTransferId: 'transfer-1',
        status: 'PENDING',
        ownerType: 'HEALTHCENTER',
        ownerId: 'hc-1',
        expiration: new Date('2025-12-31'),
      };
      const mockUpdatedStock = {
        id: 'stock-1',
        quantity: 100,
        vaccine: { name: 'BCG' },
        healthCenter: { name: 'Centre Test' },
      };
      stockLotService.recordTransfer.mockResolvedValue();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockTransfer)
              .mockResolvedValueOnce({ ...mockTransfer, confirmedBy: null }),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockHEALTHCENTER: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ id: 'stock-1', quantity: 0 })
              .mockResolvedValueOnce(mockUpdatedStock),
            update: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 100 }),
            create: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 0 }),
          },
          stockLot: {
            findFirst: jest.fn().mockResolvedValue(mockPendingLot),
            update: jest.fn().mockResolvedValue({ ...mockPendingLot, status: 'VALID', quantity: 100 }),
          },
          stockTransferHistory: {
            create: jest.fn().mockResolvedValue({ id: 'history-1' }),
          },
          healthCenter: {
            findUnique: jest.fn().mockResolvedValue({ name: 'Centre Test' }),
          },
        };
        return callback(mockTx);
      });

      await confirmPendingTransfer(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait confirmer un transfert pour SUPERADMIN', async () => {
      req.user.role = 'SUPERADMIN';
      req.params.transferId = 'transfer-1';
      const mockTransfer = {
        id: 'transfer-1',
        vaccineId: 'vaccine-1',
        toType: 'REGIONAL',
        toId: 'region-1',
        status: 'PENDING',
        quantity: 100,
        createdAt: new Date(),
        lots: [
          { lotId: 'lot-1', quantity: 100, lot: { id: 'lot-1', expiration: new Date('2025-12-31'), status: 'VALID' } },
        ],
        vaccine: { name: 'BCG' },
      };
      const mockPendingLot = {
        id: 'pending-lot-1',
        pendingTransferId: 'transfer-1',
        status: 'PENDING',
        ownerType: 'REGIONAL',
        ownerId: 'region-1',
        expiration: new Date('2025-12-31'),
      };
      const mockUpdatedStock = {
        id: 'stock-1',
        quantity: 100,
        vaccine: { name: 'BCG' },
        region: { name: 'Dakar' },
      };
      stockLotService.recordTransfer.mockResolvedValue();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockTransfer)
              .mockResolvedValueOnce({ ...mockTransfer, confirmedBy: null }),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockREGIONAL: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ id: 'stock-1', quantity: 0 })
              .mockResolvedValueOnce(mockUpdatedStock),
            update: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 100 }),
            create: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 0 }),
          },
          stockLot: {
            findFirst: jest.fn().mockResolvedValue(mockPendingLot),
            update: jest.fn().mockResolvedValue({ ...mockPendingLot, status: 'VALID', quantity: 100 }),
          },
          stockTransferHistory: {
            create: jest.fn().mockResolvedValue({ id: 'history-1' }),
          },
          region: {
            findUnique: jest.fn().mockResolvedValue({ name: 'Dakar' }),
          },
        };
        return callback(mockTx);
      });

      await confirmPendingTransfer(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 404 si lot PENDING introuvable', async () => {
      req.user.role = 'REGIONAL';
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const mockTransfer = {
        id: 'transfer-1',
        vaccineId: 'vaccine-1',
        toType: 'REGIONAL',
        toId: 'region-1',
        status: 'PENDING',
        quantity: 100,
        lots: [],
        vaccine: { name: 'BCG' },
      };
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn().mockResolvedValue(mockTransfer),
          },
          stockREGIONAL: {
            findUnique: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 0 }),
            create: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 0 }),
          },
          stockLot: {
            findFirst: jest.fn().mockResolvedValue(null), // Lot PENDING introuvable
          },
        };
        try {
          return await callback(mockTx);
        } catch (error) {
          throw error;
        }
      });

      await confirmPendingTransfer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('devrait gérer le cas où firstValidLot n\'existe pas', async () => {
      req.user.role = 'REGIONAL';
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const mockTransfer = {
        id: 'transfer-1',
        vaccineId: 'vaccine-1',
        toType: 'REGIONAL',
        toId: 'region-1',
        status: 'PENDING',
        quantity: 100,
        createdAt: new Date(),
        lots: [
          { lotId: 'lot-1', quantity: 100, lot: null }, // Lot supprimé
        ],
        vaccine: { name: 'BCG' },
      };
      const mockPendingLot = {
        id: 'pending-lot-1',
        pendingTransferId: 'transfer-1',
        status: 'PENDING',
        ownerType: 'REGIONAL',
        ownerId: 'region-1',
        expiration: new Date('2025-12-31'),
      };
      const mockUpdatedStock = {
        id: 'stock-1',
        quantity: 100,
        vaccine: { name: 'BCG' },
        region: { name: 'Dakar' },
      };
      stockLotService.recordTransfer.mockResolvedValue();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockTransfer)
              .mockResolvedValueOnce({ ...mockTransfer, confirmedBy: null }),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockREGIONAL: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ id: 'stock-1', quantity: 0 })
              .mockResolvedValueOnce(mockUpdatedStock),
            update: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 100 }),
            create: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 0 }),
          },
          stockLot: {
            findFirst: jest.fn().mockResolvedValue(mockPendingLot),
            update: jest.fn().mockResolvedValue({ ...mockPendingLot, status: 'VALID', quantity: 100 }),
          },
          stockTransferHistory: {
            create: jest.fn().mockResolvedValue({ id: 'history-1' }),
          },
          region: {
            findUnique: jest.fn().mockResolvedValue({ name: 'Dakar' }),
          },
        };
        return callback(mockTx);
      });

      await confirmPendingTransfer(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait gérer le cas où le lot est expiré', async () => {
      req.user.role = 'REGIONAL';
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const expiredDate = new Date('2020-01-01'); // Date passée
      const mockTransfer = {
        id: 'transfer-1',
        vaccineId: 'vaccine-1',
        toType: 'REGIONAL',
        toId: 'region-1',
        status: 'PENDING',
        quantity: 100,
        createdAt: new Date(),
        lots: [
          { lotId: 'lot-1', quantity: 100, lot: { id: 'lot-1', expiration: expiredDate, status: 'EXPIRED' } },
        ],
        vaccine: { name: 'BCG' },
      };
      const mockPendingLot = {
        id: 'pending-lot-1',
        pendingTransferId: 'transfer-1',
        status: 'PENDING',
        ownerType: 'REGIONAL',
        ownerId: 'region-1',
        expiration: expiredDate,
      };
      const mockUpdatedStock = {
        id: 'stock-1',
        quantity: 100,
        vaccine: { name: 'BCG' },
        region: { name: 'Dakar' },
      };
      stockLotService.recordTransfer.mockResolvedValue();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockTransfer)
              .mockResolvedValueOnce({ ...mockTransfer, confirmedBy: null }),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockREGIONAL: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ id: 'stock-1', quantity: 0 })
              .mockResolvedValueOnce(mockUpdatedStock),
            update: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 100 }),
            create: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 0 }),
          },
          stockLot: {
            findFirst: jest.fn().mockResolvedValue(mockPendingLot),
            update: jest.fn().mockResolvedValue({ ...mockPendingLot, status: 'EXPIRED', quantity: 100 }),
          },
          stockTransferHistory: {
            create: jest.fn().mockResolvedValue({ id: 'history-1' }),
          },
          region: {
            findUnique: jest.fn().mockResolvedValue({ name: 'Dakar' }),
          },
        };
        return callback(mockTx);
      });

      await confirmPendingTransfer(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait gérer le cas où validAllocations.length === 0', async () => {
      req.user.role = 'REGIONAL';
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const mockTransfer = {
        id: 'transfer-1',
        vaccineId: 'vaccine-1',
        toType: 'REGIONAL',
        toId: 'region-1',
        status: 'PENDING',
        quantity: 100,
        createdAt: new Date(),
        lots: [
          { lotId: 'lot-1', quantity: 100, lot: null }, // Tous les lots supprimés
        ],
        vaccine: { name: 'BCG' },
      };
      const mockPendingLot = {
        id: 'pending-lot-1',
        pendingTransferId: 'transfer-1',
        status: 'PENDING',
        ownerType: 'REGIONAL',
        ownerId: 'region-1',
        expiration: new Date('2025-12-31'),
      };
      const mockUpdatedStock = {
        id: 'stock-1',
        quantity: 100,
        vaccine: { name: 'BCG' },
        region: { name: 'Dakar' },
      };
      stockLotService.recordTransfer.mockClear();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockTransfer)
              .mockResolvedValueOnce({ ...mockTransfer, confirmedBy: null }),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockREGIONAL: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ id: 'stock-1', quantity: 0 })
              .mockResolvedValueOnce(mockUpdatedStock),
            update: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 100 }),
            create: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 0 }),
          },
          stockLot: {
            findFirst: jest.fn().mockResolvedValue(mockPendingLot),
            update: jest.fn().mockResolvedValue({ ...mockPendingLot, status: 'VALID', quantity: 100 }),
          },
          stockTransferHistory: {
            create: jest.fn().mockResolvedValue({ id: 'history-1' }),
          },
          region: {
            findUnique: jest.fn().mockResolvedValue({ name: 'Dakar' }),
          },
        };
        return callback(mockTx);
      });

      await confirmPendingTransfer(req, res, next);

      // recordTransfer ne devrait pas être appelé si validAllocations.length === 0
      expect(stockLotService.recordTransfer).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs sans status', async () => {
      req.user.role = 'REGIONAL';
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const error = new Error('Erreur base de données');
      prisma.$transaction.mockRejectedValue(error);

      await confirmPendingTransfer(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createStockDISTRICT', () => {
    it('devrait retourner 403 si utilisateur n\'est pas REGIONAL ou DISTRICT', async () => {
      req.user.role = 'NATIONAL';
      await createStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait créer un stock district avec succès (REGIONAL)', async () => {
      req.user.role = 'REGIONAL';
      req.body.vaccineId = 'vaccine-1';
      req.body.districtId = 'district-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      prisma.district.findUnique.mockResolvedValue({ 
        id: 'district-1',
        communeId: 'commune-1',
        commune: { regionId: 'region-1' }
      });
      prisma.StockDISTRICT.create.mockResolvedValue({ id: 'stock-1', vaccineId: 'vaccine-1', districtId: 'district-1' });

      await createStockDISTRICT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 400 si vaccineId ou districtId manquants', async () => {
      req.user.role = 'REGIONAL';
      req.body.vaccineId = 'vaccine-1';
      await createStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('createStockHEALTHCENTER', () => {
    it('devrait retourner 403 si utilisateur n\'est pas DISTRICT ou AGENT', async () => {
      req.user.role = 'REGIONAL';
      await createStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait créer un stock health center avec succès (AGENT ADMIN)', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.healthCenterId = 'healthcenter-1';
      prisma.user.findUnique.mockResolvedValue({ healthCenterId: 'healthcenter-1' });
      prisma.StockHEALTHCENTER.create.mockResolvedValue({ id: 'stock-1', vaccineId: 'vaccine-1', healthCenterId: 'healthcenter-1' });

      await createStockHEALTHCENTER(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 403 si agent n\'est pas ADMIN', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'STAFF';
      req.body.vaccineId = 'vaccine-1';
      await createStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('addStockDISTRICT', () => {
    it('devrait retourner 403 si utilisateur n\'est pas REGIONAL ou NATIONAL', async () => {
      req.user.role = 'DISTRICT';
      await addStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait ajouter du stock district avec succès (REGIONAL)', async () => {
      req.user.role = 'REGIONAL';
      req.body.vaccineId = 'vaccine-1';
      req.body.districtId = 'district-1';
      req.body.quantity = 100;
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      prisma.user.findMany.mockResolvedValue([]); // Mock pour les utilisateurs du district (email)
      prisma.district.findUnique.mockResolvedValue({ 
        id: 'district-1',
        communeId: 'commune-1',
        commune: { regionId: 'region-1' }
      });
      const mockDistrictStock = {
        id: 'stock-1',
        vaccineId: 'vaccine-1',
        districtId: 'district-1',
        quantity: 0,
        district: { name: 'District Test' },
        vaccine: { name: 'BCG' },
      };
      const mockRegionalStock = {
        id: 'stock-regional-1',
        vaccineId: 'vaccine-1',
        regionId: 'region-1',
        quantity: 200,
      };
      stockLotService.consumeLots.mockResolvedValue([{ lotId: 'lot-1', quantity: 100 }]);
      stockLotService.createLot.mockResolvedValue({ id: 'pending-lot-1' });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockDISTRICT: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockDistrictStock)
              .mockResolvedValueOnce({ ...mockDistrictStock, quantity: 0 }),
            create: jest.fn().mockResolvedValue(mockDistrictStock),
          },
          stockREGIONAL: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockRegionalStock)
              .mockResolvedValueOnce({ ...mockRegionalStock, quantity: 100 }),
            update: jest.fn().mockResolvedValue({ ...mockRegionalStock, quantity: 100 }),
          },
          stockLot: {
            findUnique: jest.fn().mockResolvedValue({ id: 'lot-1', expiration: new Date('2025-12-31') }),
          },
          pendingStockTransfer: {
            create: jest.fn().mockResolvedValue({ 
              id: 'transfer-1', 
              status: 'PENDING',
              vaccine: { name: 'BCG' },
              lots: [{ lot: { id: 'lot-1' } }],
            }),
          },
        };
        return callback(mockTx);
      });

      await addStockDISTRICT(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 400 si quantité insuffisante dans stock régional', async () => {
      req.user.role = 'REGIONAL';
      req.body.vaccineId = 'vaccine-1';
      req.body.districtId = 'district-1';
      req.body.quantity = 100;
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      prisma.district.findUnique.mockResolvedValue({ 
        id: 'district-1',
        communeId: 'commune-1',
        commune: { regionId: 'region-1' }
      });
      const mockDistrictStock = {
        id: 'stock-1',
        vaccineId: 'vaccine-1',
        districtId: 'district-1',
        quantity: 0,
        district: { name: 'District Test' },
        vaccine: { name: 'BCG' },
      };
      const mockRegionalStock = {
        id: 'stock-regional-1',
        vaccineId: 'vaccine-1',
        regionId: 'region-1',
        quantity: 50, // Insuffisant
      };
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockDISTRICT: {
            findUnique: jest.fn().mockResolvedValue(mockDistrictStock),
          },
          stockREGIONAL: {
            findUnique: jest.fn().mockResolvedValue(mockRegionalStock),
          },
        };
        try {
          return await callback(mockTx);
        } catch (error) {
          throw error;
        }
      });

      await addStockDISTRICT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('addStockHEALTHCENTER', () => {
    it('devrait retourner 403 si utilisateur n\'est pas DISTRICT ou AGENT', async () => {
      req.user.role = 'REGIONAL';
      await addStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait ajouter du stock health center avec succès (DISTRICT)', async () => {
      req.user.role = 'DISTRICT';
      req.body.vaccineId = 'vaccine-1';
      req.body.healthCenterId = 'healthcenter-1';
      req.body.quantity = 100;
      prisma.user.findUnique.mockResolvedValue({ districtId: 'district-1' });
      prisma.healthCenter.findUnique.mockResolvedValue({ districtId: 'district-1' });
      prisma.user.findMany.mockResolvedValue([]); // Mock pour les agents admin
      const mockHealthCenterStock = {
        id: 'stock-1',
        vaccineId: 'vaccine-1',
        healthCenterId: 'healthcenter-1',
        quantity: 0,
        healthCenter: { name: 'Centre Test' },
        vaccine: { name: 'BCG' },
      };
      const mockDistrictStock = {
        id: 'stock-district-1',
        vaccineId: 'vaccine-1',
        districtId: 'district-1',
        quantity: 200,
      };
      stockLotService.consumeLots.mockResolvedValue([{ lotId: 'lot-1', quantity: 100 }]);
      stockLotService.createLot.mockResolvedValue({ id: 'pending-lot-1' });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockHEALTHCENTER: {
            findUnique: jest.fn().mockResolvedValue(mockHealthCenterStock),
            create: jest.fn().mockResolvedValue(mockHealthCenterStock),
          },
          stockDISTRICT: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockDistrictStock)
              .mockResolvedValueOnce({ ...mockDistrictStock, quantity: 100 }),
            update: jest.fn().mockResolvedValue({ ...mockDistrictStock, quantity: 100 }),
          },
          stockLot: {
            findUnique: jest.fn().mockResolvedValue({ id: 'lot-1', expiration: new Date('2025-12-31') }),
          },
          pendingStockTransfer: {
            create: jest.fn().mockResolvedValue({ 
              id: 'transfer-1', 
              status: 'PENDING',
              vaccine: { name: 'BCG' },
              lots: [{ lot: { id: 'lot-1' } }],
            }),
          },
        };
        return callback(mockTx);
      });

      await addStockHEALTHCENTER(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('reduceStockNATIONAL', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await reduceStockNATIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait réduire le stock national avec succès', async () => {
      req.user.role = 'NATIONAL';
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 50;
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', quantity: 200 };
      prisma.stockNATIONAL.findUnique.mockResolvedValue(mockStock);
      prisma.stockNATIONAL.update.mockResolvedValue({ ...mockStock, quantity: 150 });

      await reduceStockNATIONAL(req, res, next);

      expect(prisma.stockNATIONAL.update).toHaveBeenCalledWith({
        where: { vaccineId: 'vaccine-1' },
        data: { quantity: 150 },
      });
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 400 si quantité insuffisante', async () => {
      req.user.role = 'NATIONAL';
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 300;
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', quantity: 200 };
      prisma.stockNATIONAL.findUnique.mockResolvedValue(mockStock);

      await reduceStockNATIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Quantité insuffisante' });
    });
  });

  describe('reduceStockREGIONAL', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL ou REGIONAL', async () => {
      req.user.role = 'DISTRICT';
      await reduceStockREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait réduire le stock régional avec succès (REGIONAL)', async () => {
      req.user.role = 'REGIONAL';
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 50;
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', regionId: 'region-1', quantity: 200 };
      prisma.stockREGIONAL.findUnique.mockResolvedValue(mockStock);
      prisma.stockREGIONAL.update.mockResolvedValue({ ...mockStock, quantity: 150 });

      await reduceStockREGIONAL(req, res, next);

      expect(prisma.stockREGIONAL.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 400 si quantité insuffisante', async () => {
      req.user.role = 'REGIONAL';
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 300;
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', regionId: 'region-1', quantity: 200 };
      prisma.stockREGIONAL.findUnique.mockResolvedValue(mockStock);

      await reduceStockREGIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('reduceStockDISTRICT', () => {
    it('devrait retourner 403 si utilisateur n\'est pas REGIONAL ou DISTRICT', async () => {
      req.user.role = 'NATIONAL';
      await reduceStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait réduire le stock district avec succès (DISTRICT)', async () => {
      req.user.role = 'DISTRICT';
      req.body.vaccineId = 'vaccine-1';
      req.body.districtId = 'district-1';
      req.body.quantity = 50;
      prisma.user.findUnique.mockResolvedValue({ districtId: 'district-1' });
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', districtId: 'district-1', quantity: 200 };
      prisma.stockDISTRICT.findUnique.mockResolvedValue(mockStock);
      prisma.stockDISTRICT.update.mockResolvedValue({ ...mockStock, quantity: 150 });

      await reduceStockDISTRICT(req, res, next);

      expect(prisma.stockDISTRICT.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('reduceStockHEALTHCENTER', () => {
    it('devrait retourner 403 si utilisateur n\'est pas DISTRICT ou AGENT', async () => {
      req.user.role = 'REGIONAL';
      await reduceStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait réduire le stock health center avec succès (AGENT ADMIN)', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.healthCenterId = 'healthcenter-1';
      req.body.quantity = 50;
      prisma.user.findUnique.mockResolvedValue({ healthCenterId: 'healthcenter-1' });
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', healthCenterId: 'healthcenter-1', quantity: 200 };
      prisma.stockHEALTHCENTER.findUnique.mockResolvedValue(mockStock);
      prisma.stockHEALTHCENTER.update.mockResolvedValue({ ...mockStock, quantity: 150 });

      await reduceStockHEALTHCENTER(req, res, next);

      expect(prisma.stockHEALTHCENTER.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('updateStockREGIONAL', () => {
    it('devrait retourner 403 si utilisateur n\'est pas SUPERADMIN', async () => {
      req.user.role = 'NATIONAL';
      await updateStockREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    });

    it('devrait retourner 403 si utilisateur est REGIONAL', async () => {
      req.user.role = 'REGIONAL';
      await updateStockREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    });

    it('devrait mettre à jour le stock régional avec succès (SUPERADMIN)', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.regionId = 'region-1';
      req.body.quantity = 300;
      req.body.expiration = '2025-12-31';
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', regionId: 'region-1', quantity: 200 };
      stockLotService.createLot.mockResolvedValue({ id: 'lot-1' });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockREGIONAL: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockStock)
              .mockResolvedValueOnce({ ...mockStock, quantity: 300, vaccine: { name: 'BCG' }, region: { name: 'Région Test' } }),
            update: jest.fn().mockResolvedValue({ ...mockStock, quantity: 300 }),
          },
        };
        return callback(mockTx);
      });

      await updateStockREGIONAL(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 400 si regionId manquant', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 300;
      await updateStockREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si vaccineId manquant', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.regionId = 'region-1';
      req.body.quantity = 300;
      await updateStockREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si quantity est négative', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.regionId = 'region-1';
      req.body.quantity = -10;
      await updateStockREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si quantity n\'est pas un nombre', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.regionId = 'region-1';
      req.body.quantity = 'not-a-number';
      await updateStockREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si expiration manquante quand delta > 0', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.regionId = 'region-1';
      req.body.quantity = 300; // Plus que le stock actuel (200)
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', regionId: 'region-1', quantity: 200 };
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockREGIONAL: {
            findUnique: jest.fn().mockResolvedValue(mockStock),
            update: jest.fn().mockResolvedValue({ ...mockStock, quantity: 300 }),
          },
        };
        try {
          return await callback(mockTx);
        } catch (error) {
          throw error;
        }
      });

      await updateStockREGIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "La date d'expiration est requise pour l'ajout de nouveaux lots",
      });
    });

    it('devrait mettre à jour sans créer de lot si delta <= 0', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.regionId = 'region-1';
      req.body.quantity = 100; // Moins que le stock actuel (200)
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', regionId: 'region-1', quantity: 200 };
      stockLotService.createLot.mockClear();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockREGIONAL: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockStock)
              .mockResolvedValueOnce({ ...mockStock, quantity: 100, vaccine: { name: 'BCG' }, region: { name: 'Région Test' } }),
            update: jest.fn().mockResolvedValue({ ...mockStock, quantity: 100 }),
          },
        };
        return callback(mockTx);
      });

      await updateStockREGIONAL(req, res, next);

      expect(stockLotService.createLot).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 404 si stock régional introuvable', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.regionId = 'region-1';
      req.body.quantity = 300;
      req.body.expiration = '2025-12-31';
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockREGIONAL: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(mockTx);
      });

      await updateStockREGIONAL(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('devrait gérer les erreurs sans status', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.regionId = 'region-1';
      req.body.quantity = 300;
      req.body.expiration = '2025-12-31';
      const error = new Error('Erreur base de données');
      prisma.$transaction.mockRejectedValue(error);

      await updateStockREGIONAL(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateStockDISTRICT', () => {
    it('devrait retourner 403 si utilisateur n\'est pas SUPERADMIN', async () => {
      req.user.role = 'REGIONAL';
      await updateStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    });

    it('devrait retourner 403 si utilisateur est DISTRICT', async () => {
      req.user.role = 'DISTRICT';
      await updateStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    });

    it('devrait mettre à jour le stock district avec succès (SUPERADMIN)', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.districtId = 'district-1';
      req.body.quantity = 300;
      req.body.expiration = '2025-12-31';
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', districtId: 'district-1', quantity: 200 };
      stockLotService.createLot.mockResolvedValue({ id: 'lot-1' });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockDISTRICT: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockStock)
              .mockResolvedValueOnce({ ...mockStock, quantity: 300, vaccine: { name: 'BCG' }, district: { name: 'District Test', commune: {} } }),
            update: jest.fn().mockResolvedValue({ ...mockStock, quantity: 300 }),
          },
        };
        return callback(mockTx);
      });

      await updateStockDISTRICT(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 400 si vaccineId manquant', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.districtId = 'district-1';
      req.body.quantity = 300;
      await updateStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si districtId manquant', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 300;
      await updateStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si quantity est négative', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.districtId = 'district-1';
      req.body.quantity = -10;
      await updateStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si quantity n\'est pas un nombre', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.districtId = 'district-1';
      req.body.quantity = 'not-a-number';
      await updateStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si expiration manquante quand delta > 0', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.districtId = 'district-1';
      req.body.quantity = 300; // Plus que le stock actuel (200)
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', districtId: 'district-1', quantity: 200 };
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockDISTRICT: {
            findUnique: jest.fn().mockResolvedValue(mockStock),
            update: jest.fn().mockResolvedValue({ ...mockStock, quantity: 300 }),
          },
        };
        try {
          return await callback(mockTx);
        } catch (error) {
          throw error;
        }
      });

      await updateStockDISTRICT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "La date d'expiration est requise pour l'ajout de nouveaux lots",
      });
    });

    it('devrait mettre à jour sans créer de lot si delta <= 0', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.districtId = 'district-1';
      req.body.quantity = 100; // Moins que le stock actuel (200)
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', districtId: 'district-1', quantity: 200 };
      stockLotService.createLot.mockClear();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockDISTRICT: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockStock)
              .mockResolvedValueOnce({ ...mockStock, quantity: 100, vaccine: { name: 'BCG' }, district: { name: 'District Test', commune: {} } }),
            update: jest.fn().mockResolvedValue({ ...mockStock, quantity: 100 }),
          },
        };
        return callback(mockTx);
      });

      await updateStockDISTRICT(req, res, next);

      expect(stockLotService.createLot).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 404 si stock district introuvable', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.districtId = 'district-1';
      req.body.quantity = 300;
      req.body.expiration = '2025-12-31';
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockDISTRICT: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(mockTx);
      });

      await updateStockDISTRICT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('devrait gérer les erreurs sans status', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.districtId = 'district-1';
      req.body.quantity = 300;
      req.body.expiration = '2025-12-31';
      const error = new Error('Erreur base de données');
      prisma.$transaction.mockRejectedValue(error);

      await updateStockDISTRICT(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateStockHEALTHCENTER', () => {
    it('devrait retourner 403 si utilisateur n\'est pas SUPERADMIN', async () => {
      req.user.role = 'DISTRICT';
      await updateStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    });

    it('devrait retourner 403 si utilisateur est AGENT ADMIN', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      await updateStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    });

    it('devrait mettre à jour le stock health center avec succès (SUPERADMIN)', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.healthCenterId = 'healthcenter-1';
      req.body.quantity = 300;
      req.body.expiration = '2025-12-31';
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', healthCenterId: 'healthcenter-1', quantity: 200 };
      stockLotService.createLot.mockResolvedValue({ id: 'lot-1' });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockHEALTHCENTER: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockStock)
              .mockResolvedValueOnce({ ...mockStock, quantity: 300, vaccine: { name: 'BCG' }, healthCenter: { name: 'Centre Test' } }),
            update: jest.fn().mockResolvedValue({ ...mockStock, quantity: 300 }),
          },
        };
        return callback(mockTx);
      });

      await updateStockHEALTHCENTER(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 400 si vaccineId manquant', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.healthCenterId = 'healthcenter-1';
      req.body.quantity = 300;
      await updateStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si healthCenterId manquant', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.quantity = 300;
      await updateStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si quantity est négative', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.healthCenterId = 'healthcenter-1';
      req.body.quantity = -10;
      await updateStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si quantity n\'est pas un nombre', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.healthCenterId = 'healthcenter-1';
      req.body.quantity = 'not-a-number';
      await updateStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait retourner 400 si expiration manquante quand delta > 0', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.healthCenterId = 'healthcenter-1';
      req.body.quantity = 300; // Plus que le stock actuel (200)
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', healthCenterId: 'healthcenter-1', quantity: 200 };
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockHEALTHCENTER: {
            findUnique: jest.fn().mockResolvedValue(mockStock),
            update: jest.fn().mockResolvedValue({ ...mockStock, quantity: 300 }),
          },
        };
        try {
          return await callback(mockTx);
        } catch (error) {
          throw error;
        }
      });

      await updateStockHEALTHCENTER(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "La date d'expiration est requise pour l'ajout de nouveaux lots",
      });
    });

    it('devrait mettre à jour sans créer de lot si delta <= 0', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.healthCenterId = 'healthcenter-1';
      req.body.quantity = 100; // Moins que le stock actuel (200)
      const mockStock = { id: 'stock-1', vaccineId: 'vaccine-1', healthCenterId: 'healthcenter-1', quantity: 200 };
      stockLotService.createLot.mockClear();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockHEALTHCENTER: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(mockStock)
              .mockResolvedValueOnce({ ...mockStock, quantity: 100, vaccine: { name: 'BCG' }, healthCenter: { name: 'Centre Test' } }),
            update: jest.fn().mockResolvedValue({ ...mockStock, quantity: 100 }),
          },
        };
        return callback(mockTx);
      });

      await updateStockHEALTHCENTER(req, res, next);

      expect(stockLotService.createLot).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 404 si stock health center introuvable', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.healthCenterId = 'healthcenter-1';
      req.body.quantity = 300;
      req.body.expiration = '2025-12-31';
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockHEALTHCENTER: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(mockTx);
      });

      await updateStockHEALTHCENTER(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('devrait gérer les erreurs sans status', async () => {
      req.user.role = 'SUPERADMIN';
      req.body.vaccineId = 'vaccine-1';
      req.body.healthCenterId = 'healthcenter-1';
      req.body.quantity = 300;
      req.body.expiration = '2025-12-31';
      const error = new Error('Erreur base de données');
      prisma.$transaction.mockRejectedValue(error);

      await updateStockHEALTHCENTER(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('listRegionalLots', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL ou REGIONAL', async () => {
      req.user.role = 'DISTRICT';
      req.params.vaccineId = 'vaccine-1';
      await listRegionalLots(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner la liste des lots régionaux avec succès', async () => {
      req.user.role = 'REGIONAL';
      req.params.vaccineId = 'vaccine-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      prisma.stockLot.findMany.mockResolvedValue([
        { id: 'lot-1', remainingQuantity: 100, expiration: new Date(), vaccine: { name: 'BCG' } },
      ]);

      await listRegionalLots(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 400 si vaccineId manquant', async () => {
      req.user.role = 'REGIONAL';
      req.params.vaccineId = '';
      await listRegionalLots(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('listDistrictLots', () => {
    it('devrait retourner 403 si utilisateur n\'a pas les permissions', async () => {
      req.user.role = 'AGENT';
      req.params.vaccineId = 'vaccine-1';
      await listDistrictLots(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner la liste des lots de district avec succès', async () => {
      req.user.role = 'DISTRICT';
      req.params.vaccineId = 'vaccine-1';
      req.query.districtId = 'district-1';
      prisma.user.findUnique.mockResolvedValue({ districtId: 'district-1' });
      prisma.stockLot.findMany.mockResolvedValue([
        { id: 'lot-1', remainingQuantity: 100, expiration: new Date(), vaccine: { name: 'BCG' } },
      ]);

      await listDistrictLots(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('listHealthCenterLots', () => {
    it('devrait retourner 403 si utilisateur n\'a pas les permissions', async () => {
      req.user.role = 'INVALID_ROLE';
      req.params.vaccineId = 'vaccine-1';
      await listHealthCenterLots(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner la liste des lots de centre de santé avec succès (AGENT ADMIN)', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.params.vaccineId = 'vaccine-1';
      prisma.user.findUnique.mockResolvedValue({ healthCenterId: 'healthcenter-1' });
      prisma.stockLot.findMany.mockResolvedValue([
        { id: 'lot-1', remainingQuantity: 100, expiration: new Date(), vaccine: { name: 'BCG' } },
      ]);
      prisma.stockReservation.findMany.mockResolvedValue([]);

      await listHealthCenterLots(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getStockREGIONAL', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL ou REGIONAL', async () => {
      req.user.role = 'DISTRICT';
      await getStockREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner la liste des stocks régionaux avec succès (REGIONAL)', async () => {
      req.user.role = 'REGIONAL';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      const mockStocks = [
        {
          id: 'stock-1',
          vaccineId: 'vaccine-1',
          regionId: 'region-1',
          quantity: 100,
          vaccine: { name: 'BCG' },
          region: { name: 'Région Test' },
        },
      ];
      prisma.stockREGIONAL.findMany.mockResolvedValue(mockStocks);
      // Mock pour fetchExpiredLotsSet
      prisma.stockLot.findMany.mockResolvedValueOnce([]);
      // Mock pour calculateNearestExpirations
      prisma.stockLot.findMany.mockResolvedValueOnce([]);

      await getStockREGIONAL(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          regional: expect.any(Array),
        }),
      );
    });
  });

  describe('getStockDISTRICT', () => {
    it('devrait retourner 403 si utilisateur n\'a pas les permissions', async () => {
      req.user.role = 'AGENT';
      await getStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner la liste des stocks de district avec succès (DISTRICT)', async () => {
      req.user.role = 'DISTRICT';
      prisma.user.findUnique.mockResolvedValue({ districtId: 'district-1' });
      const mockStocks = [
        {
          id: 'stock-1',
          vaccineId: 'vaccine-1',
          districtId: 'district-1',
          quantity: 100,
          vaccine: { name: 'BCG' },
          district: { name: 'District Test' },
        },
      ];
      prisma.stockDISTRICT.findMany.mockResolvedValue(mockStocks);
      prisma.district.findMany.mockResolvedValue([{ id: 'district-1' }]);
      // Mock pour fetchExpiredLotsSet
      prisma.stockLot.findMany.mockResolvedValueOnce([]);
      // Mock pour calculateNearestExpirations
      prisma.stockLot.findMany.mockResolvedValueOnce([]);

      await getStockDISTRICT(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          district: expect.any(Array),
        }),
      );
    });
  });

  describe('getStockHEALTHCENTER', () => {
    it('devrait retourner 403 si utilisateur n\'a pas les permissions', async () => {
      req.user.role = 'INVALID_ROLE';
      await getStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner la liste des stocks de centre de santé avec succès (AGENT)', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      prisma.user.findUnique.mockResolvedValue({ healthCenterId: 'healthcenter-1' });
      const mockStocks = [
        {
          id: 'stock-1',
          vaccineId: 'vaccine-1',
          healthCenterId: 'healthcenter-1',
          quantity: 100,
          vaccine: { name: 'BCG' },
          healthCenter: { name: 'Centre Test' },
        },
      ];
      prisma.stockHEALTHCENTER.findMany.mockResolvedValue(mockStocks);
      // Mock pour fetchExpiredLotsSet
      prisma.stockLot.findMany.mockResolvedValueOnce([]);
      // Mock pour calculateNearestExpirations
      prisma.stockLot.findMany.mockResolvedValueOnce([]);

      await getStockHEALTHCENTER(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          healthCenter: expect.any(Array),
        }),
      );
    });
  });

  describe('deleteStockREGIONAL', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL ou REGIONAL', async () => {
      req.user.role = 'DISTRICT';
      req.body.vaccineId = 'vaccine-1';
      await deleteStockREGIONAL(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait supprimer le stock régional avec succès (REGIONAL)', async () => {
      req.user.role = 'REGIONAL';
      req.body.vaccineId = 'vaccine-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      prisma.stockLot.findFirst.mockResolvedValue({ id: 'lot-1', status: 'EXPIRED' }); // Lot expiré requis
      prisma.stockLot.findMany.mockResolvedValue([{ id: 'lot-1' }]);
      stockLotService.deleteLotDirect.mockResolvedValue('lot-1');
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockREGIONAL: {
            findUnique: jest.fn().mockResolvedValue({ id: 'stock-1', vaccineId: 'vaccine-1', regionId: 'region-1' }),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockLot: {
            findFirst: prisma.stockLot.findFirst,
            findMany: jest.fn().mockResolvedValue([{ id: 'lot-1' }]),
          },
        };
        return callback(mockTx);
      });

      await deleteStockREGIONAL(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('deleteStockDISTRICT', () => {
    it('devrait retourner 403 si utilisateur n\'est pas REGIONAL ou DISTRICT', async () => {
      req.user.role = 'AGENT';
      req.body.vaccineId = 'vaccine-1';
      await deleteStockDISTRICT(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait supprimer le stock district avec succès (DISTRICT)', async () => {
      req.user.role = 'DISTRICT';
      req.body.vaccineId = 'vaccine-1';
      prisma.user.findUnique.mockResolvedValue({ districtId: 'district-1' });
      prisma.stockLot.findFirst.mockResolvedValue({ id: 'lot-1', status: 'EXPIRED' }); // Lot expiré requis
      prisma.stockLot.findMany.mockResolvedValue([{ id: 'lot-1' }]);
      stockLotService.deleteLotDirect.mockResolvedValue('lot-1');
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockDISTRICT: {
            findUnique: jest.fn().mockResolvedValue({ id: 'stock-1', vaccineId: 'vaccine-1', districtId: 'district-1' }),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockLot: {
            findFirst: prisma.stockLot.findFirst,
            findMany: jest.fn().mockResolvedValue([{ id: 'lot-1' }]),
          },
        };
        return callback(mockTx);
      });

      await deleteStockDISTRICT(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('deleteStockHEALTHCENTER', () => {
    it('devrait retourner 403 si utilisateur n\'a pas les permissions', async () => {
      req.user.role = 'INVALID_ROLE';
      req.body.vaccineId = 'vaccine-1';
      await deleteStockHEALTHCENTER(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait supprimer le stock health center avec succès (AGENT ADMIN)', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.body.vaccineId = 'vaccine-1';
      prisma.user.findUnique.mockResolvedValue({ healthCenterId: 'healthcenter-1' });
      prisma.stockLot.findFirst.mockResolvedValue({ id: 'lot-1', status: 'EXPIRED' }); // Lot expiré requis
      prisma.stockLot.findMany.mockResolvedValue([{ id: 'lot-1' }]);
      stockLotService.deleteLotDirect.mockResolvedValue('lot-1');
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockHEALTHCENTER: {
            findUnique: jest.fn().mockResolvedValue({ id: 'stock-1', vaccineId: 'vaccine-1', healthCenterId: 'healthcenter-1' }),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockLot: {
            findFirst: prisma.stockLot.findFirst,
            findMany: jest.fn().mockResolvedValue([{ id: 'lot-1' }]),
          },
        };
        return callback(mockTx);
      });

      await deleteStockHEALTHCENTER(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('getRegionalStockStats', () => {
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL ou REGIONAL', async () => {
      req.user.role = 'DISTRICT';
      await getRegionalStockStats(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner les statistiques du stock régional avec succès (REGIONAL)', async () => {
      req.user.role = 'REGIONAL';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      prisma.stockREGIONAL.aggregate.mockResolvedValue({
        _sum: { quantity: 1000 },
        _count: { _all: 5 },
      });
      prisma.stockREGIONAL.count.mockResolvedValue(2);
      prisma.stockLot.count.mockResolvedValue(1);

      await getRegionalStockStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalLots: 5,
          totalQuantity: 1000,
          lowStockCount: 2,
          expiredLots: 1,
          threshold: expect.any(Number),
        }),
      );
    });
  });

  describe('getDistrictStockStats', () => {
    it('devrait retourner 403 si utilisateur n\'a pas les permissions', async () => {
      req.user.role = 'AGENT';
      await getDistrictStockStats(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner les statistiques du stock district avec succès (DISTRICT)', async () => {
      req.user.role = 'DISTRICT';
      prisma.user.findUnique.mockResolvedValue({ districtId: 'district-1' });
      prisma.stockDISTRICT.aggregate.mockResolvedValue({
        _sum: { quantity: 500 },
        _count: { _all: 3 },
      });
      prisma.stockDISTRICT.count.mockResolvedValue(1);
      prisma.stockLot.count.mockResolvedValue(0);

      await getDistrictStockStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalLots: 3,
          totalQuantity: 500,
          lowStockCount: 1,
          expiredLots: 0,
          threshold: expect.any(Number),
        }),
      );
    });
  });

  describe('getHealthCenterStockStats', () => {
    it('devrait retourner 403 si utilisateur n\'a pas les permissions', async () => {
      req.user.role = 'INVALID_ROLE';
      await getHealthCenterStockStats(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner un tableau vide si healthCenterId non trouvé pour AGENT', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.user.id = 'user-1';
      delete req.user.healthCenterId; // Pas de healthCenterId dans user
      // resolveHealthCenterIdForUser va chercher dans la DB (appelé 2 fois dans getHealthCenterStockStats)
      prisma.user.findUnique.mockResolvedValue({ healthCenterId: null }); // healthCenterId non trouvé dans DB

      await getHealthCenterStockStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        totalLots: 0,
        totalQuantity: 0,
        lowStockCount: 0,
        threshold: 50,
      });
    });

    it('devrait retourner les statistiques du stock centre de santé avec succès (AGENT ADMIN)', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.query.healthCenterId = 'healthcenter-1';
      prisma.user.findUnique.mockResolvedValue({ healthCenterId: 'healthcenter-1' });
      prisma.stockHEALTHCENTER.aggregate.mockResolvedValue({
        _sum: { quantity: 200 },
        _count: { _all: 2 },
      });
      prisma.stockHEALTHCENTER.count.mockResolvedValue(1);
      prisma.stockLot.count.mockResolvedValue(0);

      await getHealthCenterStockStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalLots: 2,
          totalQuantity: 200,
          lowStockCount: 1,
          expiredLots: 0,
          threshold: expect.any(Number),
        }),
      );
    });

    it('devrait gérer les erreurs', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      prisma.user.findUnique.mockResolvedValue({ healthCenterId: 'healthcenter-1' });
      const error = new Error('Erreur base de données');
      prisma.stockHEALTHCENTER.aggregate.mockRejectedValue(error);

      await getHealthCenterStockStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getHealthCenterReservations', () => {
    it('devrait retourner un tableau vide si healthCenterId non trouvé pour AGENT', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.user.id = 'user-1';
      delete req.user.healthCenterId; // Pas de healthCenterId dans user
      // resolveHealthCenterIdForUser va chercher dans la DB
      prisma.user.findUnique.mockResolvedValue({ healthCenterId: null }); // healthCenterId non trouvé dans DB

      await getHealthCenterReservations(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ reservations: [] });
    });
    it('devrait retourner 403 si utilisateur n\'a pas les permissions', async () => {
      req.user.role = 'INVALID_ROLE';
      await getHealthCenterReservations(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner les réservations du centre de santé avec succès (AGENT ADMIN)', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      prisma.user.findUnique.mockResolvedValue({ healthCenterId: 'healthcenter-1' });
      const mockReservations = [
        {
          id: 'reservation-1',
          scheduleId: 'schedule-1',
          quantity: 1,
          stockLot: { 
            id: 'lot-1', 
            expiration: new Date(),
            vaccine: { id: 'vaccine-1', name: 'BCG' }
          },
          schedule: {
            id: 'schedule-1',
            scheduledFor: new Date(),
            child: { id: 'child-1', firstName: 'John', lastName: 'Doe' },
            vaccine: { id: 'vaccine-1', name: 'BCG' },
          },
        },
      ];
      prisma.stockReservation.findMany.mockResolvedValue(mockReservations);

      await getHealthCenterReservations(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          reservations: expect.any(Array),
        }),
      );
    });

    it('devrait retourner 403 si agent n\'est pas ADMIN ou STAFF', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = null;
      await getHealthCenterReservations(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner 400 si healthCenterId manquant pour DISTRICT', async () => {
      req.user.role = 'DISTRICT';
      req.query = {};
      prisma.user.findUnique.mockResolvedValue({ districtId: 'district-1' });

      await getHealthCenterReservations(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'healthCenterId est requis' });
    });

    it('devrait retourner 400 si districtId non trouvé pour DISTRICT', async () => {
      req.user.role = 'DISTRICT';
      req.user.id = 'user-1';
      delete req.user.districtId; // Pas de districtId dans user
      req.query.healthCenterId = 'healthcenter-1';
      // resolveDistrictIdForUser va chercher dans la DB
      prisma.user.findUnique.mockResolvedValue({ districtId: null }); // districtId non trouvé dans DB

      await getHealthCenterReservations(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Votre compte n\'est pas associé à un district' });
    });

    it('devrait retourner 403 si healthCenter hors district pour DISTRICT', async () => {
      req.user.role = 'DISTRICT';
      req.query.healthCenterId = 'healthcenter-1';
      prisma.user.findUnique.mockResolvedValue({ districtId: 'district-1' });
      prisma.healthCenter.findUnique.mockResolvedValue({ districtId: 'district-2' });

      await getHealthCenterReservations(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Centre de santé hors de votre district' });
    });

    it('devrait retourner 400 si healthCenterId manquant pour REGIONAL', async () => {
      req.user.role = 'REGIONAL';
      req.query = {};
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });

      await getHealthCenterReservations(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'healthCenterId est requis' });
    });

    it('devrait retourner 400 si regionId non trouvé pour REGIONAL', async () => {
      req.user.role = 'REGIONAL';
      req.user.id = 'user-1';
      delete req.user.regionId; // Pas de regionId dans user
      req.query.healthCenterId = 'healthcenter-1';
      // resolveRegionIdForUser va chercher dans la DB
      prisma.user.findUnique.mockResolvedValue({ regionId: null }); // regionId non trouvé dans DB

      await getHealthCenterReservations(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Votre compte n\'est pas associé à une région' });
    });

    it('devrait retourner 403 si healthCenter hors région pour REGIONAL', async () => {
      req.user.role = 'REGIONAL';
      req.query.healthCenterId = 'healthcenter-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      prisma.healthCenter.findUnique.mockResolvedValue({
        district: {
          commune: {
            regionId: 'region-2',
          },
        },
      });

      await getHealthCenterReservations(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Centre de santé hors de votre région' });
    });

    it('devrait retourner 400 si healthCenterId manquant pour NATIONAL', async () => {
      req.user.role = 'NATIONAL';
      req.query = {};

      await getHealthCenterReservations(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'healthCenterId est requis' });
    });

    it('devrait gérer les erreurs', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      prisma.user.findUnique.mockResolvedValue({ healthCenterId: 'healthcenter-1' });
      const error = new Error('Erreur base de données');
      prisma.stockReservation.findMany.mockRejectedValue(error);

      await getHealthCenterReservations(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('rejectPendingTransfer', () => {
    it('devrait retourner 403 si utilisateur n\'est pas autorisé', async () => {
      req.user.role = 'NATIONAL';
      req.params.transferId = 'transfer-1';
      await rejectPendingTransfer(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait rejeter un transfert avec succès (REGIONAL)', async () => {
      req.user.role = 'REGIONAL';
      req.user.regionId = 'region-1';
      req.params.transferId = 'transfer-1';
      
      const mockTransfer = {
        id: 'transfer-1',
        status: 'PENDING',
        vaccineId: 'vaccine-1',
        fromType: 'NATIONAL',
        fromId: null,
        toType: 'REGIONAL',
        toId: 'region-1',
        quantity: 100,
        vaccine: { name: 'Test Vaccine' },
        lots: [],
      };

      prisma.pendingStockTransfer.findUnique.mockResolvedValue(mockTransfer);
      prisma.stockLot.findFirst.mockResolvedValue(null);
      stockLotService.restoreOrRecreateLotForRejectedTransfer.mockResolvedValue({ restored: true });
      prisma.pendingStockTransfer.update.mockResolvedValue({ ...mockTransfer, status: 'REJECTED' });
      prisma.pendingStockTransferLot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.pendingStockTransfer.deleteMany.mockResolvedValue({ count: 1 });

      await rejectPendingTransfer(req, res, next);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 404 si transfert introuvable', async () => {
      req.user.role = 'REGIONAL';
      req.user.regionId = 'region-1';
      req.params.transferId = 'transfer-1';
      
      // Mock la transaction pour lancer l'erreur
      const mockPrisma = require('../../src/config/prismaClient');
      prisma.$transaction.mockImplementationOnce(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: mockPrisma.pendingStockTransfer.update,
            deleteMany: mockPrisma.pendingStockTransfer.deleteMany,
            delete: mockPrisma.pendingStockTransfer.delete,
          },
          stockLot: {
            ...mockPrisma.stockLot,
            findFirst: jest.fn().mockResolvedValue(null),
            findUnique: jest.fn().mockResolvedValue(null),
          },
          pendingStockTransferLot: {
            ...mockPrisma.pendingStockTransferLot,
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          stockTransferHistory: {
            create: jest.fn().mockResolvedValue({}),
          },
          region: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          district: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          healthCenter: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        // L'erreur sera lancée dans le callback et doit être propagée
        return await callback(mockTx);
      });

      await rejectPendingTransfer(req, res, next);

      // Le catch vérifie error.status et retourne res.status au lieu de next
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Transfert introuvable' });
    });

    it('devrait retourner 400 si REGIONAL n\'a pas de regionId', async () => {
      req.user.role = 'REGIONAL';
      req.user.id = 'user-1';
      delete req.user.regionId; // Supprimer regionId pour forcer l'appel à la DB
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue(null); // Utilisateur non trouvé ou regionId null

      await rejectPendingTransfer(req, res, next);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { regionId: true },
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Votre compte n'est pas rattaché à une région" });
    });

    it('devrait retourner 400 si DISTRICT n\'a pas de districtId', async () => {
      req.user.role = 'DISTRICT';
      req.user.id = 'user-1';
      delete req.user.districtId; // Supprimer districtId pour forcer l'appel à la DB
      req.params.transferId = 'transfer-1';
      prisma.user.findUnique.mockResolvedValue(null); // Utilisateur non trouvé ou districtId null

      await rejectPendingTransfer(req, res, next);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { districtId: true },
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Votre compte n'est pas rattaché à un district" });
    });

    it('devrait retourner 403 si AGENT n\'est pas ADMIN', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'STAFF';
      req.params.transferId = 'transfer-1';

      await rejectPendingTransfer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner 400 si AGENT n\'a pas de healthCenterId', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.user.healthCenterId = null;
      req.params.transferId = 'transfer-1';

      await rejectPendingTransfer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Votre compte n'est pas rattaché à un centre de santé" });
    });

    it('devrait rejeter un transfert pour SUPERADMIN', async () => {
      req.user.role = 'SUPERADMIN';
      req.params.transferId = 'transfer-1';
      
      const mockTransfer = {
        id: 'transfer-1',
        status: 'PENDING',
        vaccineId: 'vaccine-1',
        fromType: 'NATIONAL',
        fromId: null,
        toType: 'REGIONAL',
        toId: 'region-1',
        quantity: 100,
        createdAt: new Date(),
        vaccine: { name: 'Test Vaccine' },
        lots: [
          { lotId: 'lot-1', quantity: 100, lot: { id: 'lot-1', expiration: new Date('2025-12-31'), status: 'VALID' } },
        ],
      };

      stockLotService.restoreOrRecreateLotForRejectedTransfer.mockResolvedValue({ restored: true });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn().mockResolvedValue(mockTransfer),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockLot: {
            findFirst: jest.fn().mockResolvedValue(null),
            findUnique: jest.fn().mockResolvedValue({ id: 'lot-1', expiration: new Date('2025-12-31'), status: 'VALID' }),
          },
          stockTransferHistory: {
            create: jest.fn().mockResolvedValue({ id: 'history-1' }),
          },
          region: {
            findUnique: jest.fn().mockResolvedValue({ name: 'Dakar' }),
          },
        };
        return callback(mockTx);
      });

      await rejectPendingTransfer(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });

    it('devrait gérer le cas où le lot existe encore', async () => {
      req.user.role = 'REGIONAL';
      req.user.regionId = 'region-1';
      req.params.transferId = 'transfer-1';
      
      const mockTransfer = {
        id: 'transfer-1',
        status: 'PENDING',
        vaccineId: 'vaccine-1',
        fromType: 'NATIONAL',
        fromId: null,
        toType: 'REGIONAL',
        toId: 'region-1',
        quantity: 100,
        createdAt: new Date(),
        vaccine: { name: 'Test Vaccine' },
        lots: [
          { lotId: 'lot-1', quantity: 100, lot: { id: 'lot-1', expiration: new Date('2025-12-31'), status: 'VALID' } },
        ],
      };

      stockLotService.restoreOrRecreateLotForRejectedTransfer.mockResolvedValue({ restored: true });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn().mockResolvedValue(mockTransfer),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockLot: {
            findFirst: jest.fn().mockResolvedValue(null),
            findUnique: jest.fn().mockResolvedValue({ id: 'lot-1', expiration: new Date('2025-12-31'), status: 'VALID' }),
          },
          stockTransferHistory: {
            create: jest.fn().mockResolvedValue({ id: 'history-1' }),
          },
          region: {
            findUnique: jest.fn().mockResolvedValue({ name: 'Dakar' }),
          },
        };
        return callback(mockTx);
      });

      await rejectPendingTransfer(req, res, next);

      expect(stockLotService.restoreOrRecreateLotForRejectedTransfer).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait gérer le cas où le lot a été supprimé', async () => {
      req.user.role = 'REGIONAL';
      req.user.regionId = 'region-1';
      req.params.transferId = 'transfer-1';
      
      const mockTransfer = {
        id: 'transfer-1',
        status: 'PENDING',
        vaccineId: 'vaccine-1',
        fromType: 'NATIONAL',
        fromId: null,
        toType: 'REGIONAL',
        toId: 'region-1',
        quantity: 100,
        createdAt: new Date(),
        vaccine: { name: 'Test Vaccine' },
        lots: [
          { 
            lotId: 'lot-1', 
            quantity: 100, 
            lot: null, // Lot supprimé
            lotExpiration: new Date('2025-12-31'),
            lotStatus: 'VALID',
            lotOwnerType: 'NATIONAL',
            lotVaccineId: 'vaccine-1',
          },
        ],
      };

      stockLotService.restoreOrRecreateLotForRejectedTransfer.mockResolvedValue({ restored: true });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn().mockResolvedValue(mockTransfer),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockLot: {
            findFirst: jest.fn().mockResolvedValue(null),
            findUnique: jest.fn().mockResolvedValue(null), // Lot supprimé
          },
          stockTransferHistory: {
            create: jest.fn().mockResolvedValue({ id: 'history-1' }),
          },
          region: {
            findUnique: jest.fn().mockResolvedValue({ name: 'Dakar' }),
          },
        };
        return callback(mockTx);
      });

      await rejectPendingTransfer(req, res, next);

      expect(stockLotService.restoreOrRecreateLotForRejectedTransfer).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait gérer le cas où pendingLot existe', async () => {
      req.user.role = 'REGIONAL';
      req.user.regionId = 'region-1';
      req.params.transferId = 'transfer-1';
      
      const mockTransfer = {
        id: 'transfer-1',
        status: 'PENDING',
        vaccineId: 'vaccine-1',
        fromType: 'NATIONAL',
        fromId: null,
        toType: 'REGIONAL',
        toId: 'region-1',
        quantity: 100,
        createdAt: new Date(),
        vaccine: { name: 'Test Vaccine' },
        lots: [],
      };

      const mockPendingLot = {
        id: 'pending-lot-1',
        pendingTransferId: 'transfer-1',
        status: 'PENDING',
        ownerType: 'REGIONAL',
        ownerId: 'region-1',
        expiration: new Date('2025-12-31'),
      };

      stockLotService.deleteLotDirect.mockResolvedValue({ deleted: true });
      stockLotService.restoreOrRecreateLotForRejectedTransfer.mockResolvedValue({ restored: true });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn().mockResolvedValue(mockTransfer),
            delete: jest.fn().mockResolvedValue({}),
          },
          stockLot: {
            findFirst: jest.fn().mockResolvedValue(mockPendingLot),
            findUnique: jest.fn().mockResolvedValue(null),
          },
          stockTransferHistory: {
            create: jest.fn().mockResolvedValue({ id: 'history-1' }),
          },
          region: {
            findUnique: jest.fn().mockResolvedValue({ name: 'Dakar' }),
          },
        };
        return callback(mockTx);
      });

      await rejectPendingTransfer(req, res, next);

      expect(stockLotService.deleteLotDirect).toHaveBeenCalledWith(
        expect.anything(),
        'pending-lot-1'
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('devrait retourner 400 si transfert déjà confirmé', async () => {
      req.user.role = 'REGIONAL';
      req.user.regionId = 'region-1';
      req.params.transferId = 'transfer-1';
      
      const mockTransfer = {
        id: 'transfer-1',
        status: 'CONFIRMED',
        toType: 'REGIONAL',
        toId: 'region-1',
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn().mockResolvedValue(mockTransfer),
          },
        };
        try {
          return await callback(mockTx);
        } catch (error) {
          throw error;
        }
      });

      await rejectPendingTransfer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait gérer les erreurs sans status', async () => {
      req.user.role = 'REGIONAL';
      req.user.regionId = 'region-1';
      req.params.transferId = 'transfer-1';
      const error = new Error('Erreur base de données');
      prisma.$transaction.mockRejectedValue(error);

      await rejectPendingTransfer(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('cancelPendingTransfer', () => {
    it('devrait retourner 403 si utilisateur n\'est pas autorisé', async () => {
      req.user.role = 'AGENT';
      req.params.transferId = 'transfer-1';
      await cancelPendingTransfer(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait annuler un transfert avec succès (NATIONAL)', async () => {
      req.user.role = 'NATIONAL';
      req.params.transferId = 'transfer-1';
      
      const mockTransfer = {
        id: 'transfer-1',
        status: 'PENDING',
        vaccineId: 'vaccine-1',
        fromType: 'NATIONAL',
        fromId: null,
        toType: 'REGIONAL',
        toId: 'region-1',
        quantity: 100,
        vaccine: { name: 'Test Vaccine' },
        lots: [],
      };

      prisma.pendingStockTransfer.findUnique.mockResolvedValue(mockTransfer);
      prisma.stockLot.findFirst.mockResolvedValue(null);
      stockLotService.restoreOrRecreateLotForRejectedTransfer.mockResolvedValue({ restored: true });
      prisma.pendingStockTransfer.update.mockResolvedValue({ ...mockTransfer, status: 'CANCELLED' });
      prisma.pendingStockTransferLot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.pendingStockTransfer.deleteMany.mockResolvedValue({ count: 1 });

      await cancelPendingTransfer(req, res, next);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getTransferHistory', () => {
    beforeEach(() => {
      prisma.user.findUnique = jest.fn();
      prisma.region.findUnique = jest.fn();
      prisma.district.findUnique = jest.fn();
      prisma.healthCenter.findUnique = jest.fn();
    });

    it('devrait retourner 403 si utilisateur n\'est pas autorisé', async () => {
      req.user.role = 'PARENT';
      await getTransferHistory(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner 403 si AGENT n\'est pas ADMIN ou STAFF', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'USER';
      await getTransferHistory(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner l\'historique des transferts (NATIONAL)', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: '20' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalled();
      expect(prisma.stockTransferHistory.count).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          history: expect.any(Array),
          total: expect.any(Number),
          page: expect.any(Number),
          limit: expect.any(Number),
        })
      );
    });

    it('devrait retourner l\'historique pour SUPERADMIN sans filtre d\'entité', async () => {
      req.user.role = 'SUPERADMIN';
      req.query = { page: '1', limit: '20' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          history: [],
          total: 0,
        })
      );
    });

    it('devrait filtrer par REGIONAL avec regionId', async () => {
      req.user.role = 'REGIONAL';
      req.user.id = 'user-1';
      req.user.regionId = 'region-1';
      req.query = { page: '1', limit: '20' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ fromType: 'REGIONAL', fromId: 'region-1' }),
                  expect.objectContaining({ toType: 'REGIONAL', toId: 'region-1' }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('devrait retourner tableau vide si REGIONAL sans regionId', async () => {
      req.user.role = 'REGIONAL';
      req.user.id = 'user-1';
      req.user.regionId = null;
      prisma.user.findUnique.mockResolvedValue(null);
      req.query = { page: '1', limit: '20' };

      await getTransferHistory(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        history: [],
        total: 0,
        page: 1,
        limit: 20,
      });
    });

    it('devrait filtrer par DISTRICT avec districtId', async () => {
      req.user.role = 'DISTRICT';
      req.user.id = 'user-1';
      req.user.districtId = 'district-1';
      req.query = { page: '1', limit: '20' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ fromType: 'DISTRICT', fromId: 'district-1' }),
                  expect.objectContaining({ toType: 'DISTRICT', toId: 'district-1' }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('devrait retourner tableau vide si DISTRICT sans districtId', async () => {
      req.user.role = 'DISTRICT';
      req.user.id = 'user-1';
      req.user.districtId = null;
      prisma.user.findUnique.mockResolvedValue(null);
      req.query = { page: '1', limit: '20' };

      await getTransferHistory(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        history: [],
        total: 0,
        page: 1,
        limit: 20,
      });
    });

    it('devrait filtrer par AGENT avec healthCenterId', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.user.id = 'user-1';
      req.user.healthCenterId = 'hc-1';
      req.query = { page: '1', limit: '20' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ fromType: 'HEALTHCENTER', fromId: 'hc-1' }),
                  expect.objectContaining({ toType: 'HEALTHCENTER', toId: 'hc-1' }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('devrait retourner tableau vide si AGENT sans healthCenterId', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.user.id = 'user-1';
      req.user.healthCenterId = null;
      prisma.user.findUnique.mockResolvedValue(null);
      req.query = { page: '1', limit: '20' };

      await getTransferHistory(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        history: [],
        total: 0,
        page: 1,
        limit: 20,
      });
    });

    it('devrait filtrer par SUPERADMIN avec overrideRegionId', async () => {
      req.user.role = 'SUPERADMIN';
      req.query = { page: '1', limit: '20', regionId: 'region-1' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ fromType: 'REGIONAL', fromId: 'region-1' }),
                  expect.objectContaining({ toType: 'REGIONAL', toId: 'region-1' }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('devrait filtrer par SUPERADMIN avec overrideDistrictId', async () => {
      req.user.role = 'SUPERADMIN';
      req.query = { page: '1', limit: '20', districtId: 'district-1' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ fromType: 'DISTRICT', fromId: 'district-1' }),
                  expect.objectContaining({ toType: 'DISTRICT', toId: 'district-1' }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('devrait filtrer par SUPERADMIN avec overrideHealthCenterId', async () => {
      req.user.role = 'SUPERADMIN';
      req.query = { page: '1', limit: '20', healthCenterId: 'hc-1' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ fromType: 'HEALTHCENTER', fromId: 'hc-1' }),
                  expect.objectContaining({ toType: 'HEALTHCENTER', toId: 'hc-1' }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('devrait appliquer fromType et toType pour REGIONAL', async () => {
      req.user.role = 'REGIONAL';
      req.user.id = 'user-1';
      req.user.regionId = 'region-1';
      req.query = { page: '1', limit: '20', fromType: 'REGIONAL', toType: 'DISTRICT' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      const callArgs = prisma.stockTransferHistory.findMany.mock.calls[0][0];
      const roleFilter = callArgs.where.AND.find(cond => cond.OR);
      expect(roleFilter.OR[0].fromType).toBe('REGIONAL');
      expect(roleFilter.OR[1].toType).toBe('DISTRICT');
    });

    it('devrait filtrer par vaccineId pour NATIONAL', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: '20', vaccineId: 'vaccine-1' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vaccineId: 'vaccine-1',
          }),
        }),
      );
    });

    it('devrait filtrer par fromType, toType, fromId, toId pour NATIONAL', async () => {
      req.user.role = 'NATIONAL';
      req.query = {
        page: '1',
        limit: '20',
        fromType: 'REGIONAL',
        toType: 'DISTRICT',
        fromId: 'region-1',
        toId: 'district-1',
      };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      const callArgs = prisma.stockTransferHistory.findMany.mock.calls[0][0];
      expect(callArgs.where.fromType).toBe('REGIONAL');
      expect(callArgs.where.toType).toBe('DISTRICT');
      expect(callArgs.where.fromId).toBe('region-1');
      expect(callArgs.where.toId).toBe('district-1');
    });

    it('devrait filtrer par vaccineId et fromId/toId pour REGIONAL (pas fromType/toType)', async () => {
      req.user.role = 'REGIONAL';
      req.user.id = 'user-1';
      req.user.regionId = 'region-1';
      req.query = {
        page: '1',
        limit: '20',
        vaccineId: 'vaccine-1',
        fromId: 'region-1',
        toId: 'district-1',
      };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      const callArgs = prisma.stockTransferHistory.findMany.mock.calls[0][0];
      expect(callArgs.where.vaccineId).toBe('vaccine-1');
      expect(callArgs.where.fromId).toBe('region-1');
      expect(callArgs.where.toId).toBe('district-1');
      expect(callArgs.where.fromType).toBeUndefined();
      expect(callArgs.where.toType).toBeUndefined();
    });

    it('devrait appliquer fromType et toType pour DISTRICT', async () => {
      req.user.role = 'DISTRICT';
      req.user.id = 'user-1';
      req.user.districtId = 'district-1';
      req.query = { page: '1', limit: '20', fromType: 'DISTRICT', toType: 'HEALTHCENTER' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      const callArgs = prisma.stockTransferHistory.findMany.mock.calls[0][0];
      const roleFilter = callArgs.where.AND.find(cond => cond.OR);
      expect(roleFilter.OR[0].fromType).toBe('DISTRICT');
      expect(roleFilter.OR[1].toType).toBe('HEALTHCENTER');
    });

    it('devrait appliquer fromType et toType pour AGENT', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.user.id = 'user-1';
      req.user.healthCenterId = 'hc-1';
      req.query = { page: '1', limit: '20', fromType: 'HEALTHCENTER', toType: 'DISTRICT' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      const callArgs = prisma.stockTransferHistory.findMany.mock.calls[0][0];
      const roleFilter = callArgs.where.AND.find(cond => cond.OR);
      expect(roleFilter.OR[0].fromType).toBe('HEALTHCENTER');
      expect(roleFilter.OR[1].toType).toBe('DISTRICT');
    });

    it('devrait appliquer fromType et toType pour SUPERADMIN avec overrideDistrictId', async () => {
      req.user.role = 'SUPERADMIN';
      req.query = { page: '1', limit: '20', districtId: 'district-1', fromType: 'DISTRICT', toType: 'HEALTHCENTER' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      const callArgs = prisma.stockTransferHistory.findMany.mock.calls[0][0];
      const roleFilter = callArgs.where.AND.find(cond => cond.OR);
      expect(roleFilter.OR[0].fromType).toBe('DISTRICT');
      expect(roleFilter.OR[1].toType).toBe('HEALTHCENTER');
    });

    it('devrait appliquer fromType et toType pour SUPERADMIN avec overrideHealthCenterId', async () => {
      req.user.role = 'SUPERADMIN';
      req.query = { page: '1', limit: '20', healthCenterId: 'hc-1', fromType: 'HEALTHCENTER', toType: 'DISTRICT' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      const callArgs = prisma.stockTransferHistory.findMany.mock.calls[0][0];
      const roleFilter = callArgs.where.AND.find(cond => cond.OR);
      expect(roleFilter.OR[0].fromType).toBe('HEALTHCENTER');
      expect(roleFilter.OR[1].toType).toBe('DISTRICT');
    });

    it('devrait appliquer fromType et toType pour DISTRICT', async () => {
      req.user.role = 'DISTRICT';
      req.user.id = 'user-1';
      req.user.districtId = 'district-1';
      req.query = { page: '1', limit: '20', fromType: 'DISTRICT', toType: 'HEALTHCENTER' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      const callArgs = prisma.stockTransferHistory.findMany.mock.calls[0][0];
      const roleFilter = callArgs.where.AND.find(cond => cond.OR);
      expect(roleFilter.OR[0].fromType).toBe('DISTRICT');
      expect(roleFilter.OR[1].toType).toBe('HEALTHCENTER');
    });

    it('devrait appliquer fromType et toType pour AGENT', async () => {
      req.user.role = 'AGENT';
      req.user.agentLevel = 'ADMIN';
      req.user.id = 'user-1';
      req.user.healthCenterId = 'hc-1';
      req.query = { page: '1', limit: '20', fromType: 'HEALTHCENTER', toType: 'DISTRICT' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      const callArgs = prisma.stockTransferHistory.findMany.mock.calls[0][0];
      const roleFilter = callArgs.where.AND.find(cond => cond.OR);
      expect(roleFilter.OR[0].fromType).toBe('HEALTHCENTER');
      expect(roleFilter.OR[1].toType).toBe('DISTRICT');
    });

    it('devrait appliquer fromType et toType pour SUPERADMIN avec overrideDistrictId', async () => {
      req.user.role = 'SUPERADMIN';
      req.query = { page: '1', limit: '20', districtId: 'district-1', fromType: 'DISTRICT', toType: 'HEALTHCENTER' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      const callArgs = prisma.stockTransferHistory.findMany.mock.calls[0][0];
      const roleFilter = callArgs.where.AND.find(cond => cond.OR);
      expect(roleFilter.OR[0].fromType).toBe('DISTRICT');
      expect(roleFilter.OR[1].toType).toBe('HEALTHCENTER');
    });

    it('devrait appliquer fromType et toType pour SUPERADMIN avec overrideHealthCenterId', async () => {
      req.user.role = 'SUPERADMIN';
      req.query = { page: '1', limit: '20', healthCenterId: 'hc-1', fromType: 'HEALTHCENTER', toType: 'DISTRICT' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      const callArgs = prisma.stockTransferHistory.findMany.mock.calls[0][0];
      const roleFilter = callArgs.where.AND.find(cond => cond.OR);
      expect(roleFilter.OR[0].fromType).toBe('HEALTHCENTER');
      expect(roleFilter.OR[1].toType).toBe('DISTRICT');
    });

    it('devrait filtrer par search (vaccineName, fromName, toName)', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: '20', search: 'BCG' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      const callArgs = prisma.stockTransferHistory.findMany.mock.calls[0][0];
      const searchCondition = callArgs.where.AND.find(cond => cond.OR);
      expect(searchCondition.OR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ vaccineName: expect.objectContaining({ contains: 'BCG' }) }),
          expect.objectContaining({ fromName: expect.objectContaining({ contains: 'BCG' }) }),
          expect.objectContaining({ toName: expect.objectContaining({ contains: 'BCG' }) }),
        ])
      );
    });

    it('devrait filtrer par sentStartDate uniquement', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: '20', sentStartDate: '2024-01-01' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sentAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('devrait filtrer par sentEndDate uniquement', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: '20', sentEndDate: '2024-12-31' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sentAt: expect.objectContaining({
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('devrait filtrer par sentStartDate et sentEndDate', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: '20', sentStartDate: '2024-01-01', sentEndDate: '2024-12-31' };
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sentAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('devrait filtrer par confirmedStartDate uniquement', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: '20', confirmedStartDate: '2024-01-01' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            confirmedAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('devrait filtrer par confirmedEndDate uniquement', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: '20', confirmedEndDate: '2024-12-31' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            confirmedAt: expect.objectContaining({
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('devrait filtrer par confirmedStartDate et confirmedEndDate', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: '20', confirmedStartDate: '2024-01-01', confirmedEndDate: '2024-12-31' };
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            confirmedAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('devrait utiliser AND conditions quand plusieurs filtres sont présents', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: '20', search: 'BCG', vaccineId: 'vaccine-1' };
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.any(Array),
          }),
        }),
      );
    });

    it('devrait utiliser undefined pour where si aucune condition', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: '20' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      const callArgs = prisma.stockTransferHistory.findMany.mock.calls[0][0];
      expect(callArgs.where).toBeUndefined();
    });

    it('devrait gérer la pagination avec page et limit', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '2', limit: '10' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(50);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
          totalPages: 5,
        }),
      );
    });

    it('devrait limiter limit à 100 maximum', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: '200' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it('devrait utiliser page 1 par défaut si page invalide', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: 'invalid', limit: '20' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        }),
      );
    });

    it('devrait utiliser limit 20 par défaut si limit invalide', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: 'invalid' };
      
      prisma.stockTransferHistory.findMany.mockResolvedValue([]);
      prisma.stockTransferHistory.count.mockResolvedValue(0);

      await getTransferHistory(req, res, next);

      expect(prisma.stockTransferHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
        }),
      );
    });

    it('devrait gérer les erreurs', async () => {
      req.user.role = 'NATIONAL';
      req.query = { page: '1', limit: '20' };
      const error = new Error('Erreur base de données');
      prisma.stockTransferHistory.findMany.mockRejectedValue(error);

      await getTransferHistory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getPendingTransfersForSender', () => {
    it('devrait retourner 403 si utilisateur n\'est pas autorisé', async () => {
      req.user.role = 'AGENT';
      await getPendingTransfersForSender(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner les transferts en attente pour NATIONAL', async () => {
      req.user.role = 'NATIONAL';
      
      prisma.pendingStockTransfer.findMany.mockResolvedValue([]);

      await getPendingTransfersForSender(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ transfers: [] });
    });

    it('devrait retourner les transferts en attente pour REGIONAL', async () => {
      req.user.role = 'REGIONAL';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      prisma.pendingStockTransfer.findMany.mockResolvedValue([]);

      await getPendingTransfersForSender(req, res, next);

      expect(prisma.pendingStockTransfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fromType: 'REGIONAL',
            fromId: 'region-1',
          }),
        }),
      );
    });

    it('devrait retourner les transferts en attente pour DISTRICT', async () => {
      req.user.role = 'DISTRICT';
      prisma.user.findUnique.mockResolvedValue({ districtId: 'district-1' });
      prisma.pendingStockTransfer.findMany.mockResolvedValue([]);

      await getPendingTransfersForSender(req, res, next);

      expect(prisma.pendingStockTransfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fromType: 'DISTRICT',
            fromId: 'district-1',
          }),
        }),
      );
    });

    it('devrait retourner les transferts en attente pour SUPERADMIN avec regionId', async () => {
      req.user.role = 'SUPERADMIN';
      req.query.regionId = 'region-1';
      prisma.user.findUnique.mockResolvedValue({ regionId: 'region-1' });
      prisma.pendingStockTransfer.findMany.mockResolvedValue([]);

      await getPendingTransfersForSender(req, res, next);

      expect(prisma.pendingStockTransfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fromType: 'REGIONAL',
            fromId: 'region-1',
          }),
        }),
      );
    });

    it('devrait retourner les transferts en attente pour SUPERADMIN avec districtId', async () => {
      req.user.role = 'SUPERADMIN';
      req.query.districtId = 'district-1';
      prisma.user.findUnique.mockResolvedValue({ districtId: 'district-1' });
      prisma.pendingStockTransfer.findMany.mockResolvedValue([]);

      await getPendingTransfersForSender(req, res, next);

      expect(prisma.pendingStockTransfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fromType: 'DISTRICT',
            fromId: 'district-1',
          }),
        }),
      );
    });

    it('devrait retourner un tableau vide si regionId non trouvé pour REGIONAL', async () => {
      req.user.role = 'REGIONAL';
      req.user.id = 'user-1';
      delete req.user.regionId;
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.pendingStockTransfer.findMany.mockResolvedValue([]);

      await getPendingTransfersForSender(req, res, next);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { regionId: true },
      });
      expect(res.json).toHaveBeenCalledWith({ transfers: [] });
    });

    it('devrait retourner un tableau vide si districtId non trouvé pour DISTRICT', async () => {
      req.user.role = 'DISTRICT';
      req.user.id = 'user-1';
      delete req.user.districtId;
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.pendingStockTransfer.findMany.mockResolvedValue([]);

      await getPendingTransfersForSender(req, res, next);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { districtId: true },
      });
      expect(res.json).toHaveBeenCalledWith({ transfers: [] });
    });

    it('devrait ajouter toName avec getOwnerName', async () => {
      req.user.role = 'NATIONAL';
      const mockTransfers = [
        {
          id: 'transfer-1',
          toType: 'REGIONAL',
          toId: 'region-1',
          vaccine: { name: 'BCG' },
          lots: [],
        },
      ];
      prisma.pendingStockTransfer.findMany.mockResolvedValue(mockTransfers);
      prisma.region.findUnique.mockResolvedValue({ name: 'Dakar' });

      await getPendingTransfersForSender(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          transfers: expect.arrayContaining([
            expect.objectContaining({
              toName: 'Dakar',
            }),
          ]),
        }),
      );
    });

    it('devrait utiliser le fallback si getOwnerName retourne null', async () => {
      req.user.role = 'NATIONAL';
      const mockTransfers = [
        {
          id: 'transfer-1',
          toType: 'REGIONAL',
          toId: 'region-1',
          vaccine: { name: 'BCG' },
          lots: [],
        },
      ];
      prisma.pendingStockTransfer.findMany.mockResolvedValue(mockTransfers);
      prisma.region.findUnique.mockResolvedValue(null);

      await getPendingTransfersForSender(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          transfers: expect.arrayContaining([
            expect.objectContaining({
              toName: 'Région',
            }),
          ]),
        }),
      );
    });

    it('devrait gérer les erreurs', async () => {
      req.user.role = 'NATIONAL';
      const error = new Error('Erreur base de données');
      prisma.pendingStockTransfer.findMany.mockRejectedValue(error);

      await getPendingTransfersForSender(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getStockHealthCenterDeleteImpact', () => {
    it('devrait retourner 403 si utilisateur n\'est pas SUPERADMIN', async () => {
      req.user.role = 'NATIONAL';
      req.query = { vaccineId: 'vaccine-1', healthCenterId: 'hc-1' };
      await getStockHealthCenterDeleteImpact(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner l\'impact de suppression', async () => {
      req.user.role = 'SUPERADMIN';
      req.query = { vaccineId: 'vaccine-1', healthCenterId: 'hc-1' };
      
      prisma.stockLot.findMany.mockResolvedValue([{ id: 'lot-1' }]);
      prisma.stockReservation.findMany.mockResolvedValue([
        { scheduleId: 'schedule-1' },
        { scheduleId: 'schedule-2' },
      ]);

      await getStockHealthCenterDeleteImpact(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        vaccineId: 'vaccine-1',
        healthCenterId: 'hc-1',
        affectedAppointments: 2,
        willCancelAppointments: true,
      });
    });
  });

  describe('getLotDeleteImpact', () => {
    it('devrait retourner 403 si utilisateur n\'est pas SUPERADMIN', async () => {
      req.user.role = 'NATIONAL';
      req.params.id = 'lot-1';
      await getLotDeleteImpact(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner l\'impact de suppression d\'un lot', async () => {
      req.user.role = 'SUPERADMIN';
      req.params.id = 'lot-1';
      
      prisma.stockLot.findUnique.mockResolvedValue({
        id: 'lot-1',
        ownerType: 'HEALTHCENTER',
        ownerId: 'hc-1',
      });
      prisma.stockReservation.count.mockResolvedValue(5);

      await getLotDeleteImpact(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        lotId: 'lot-1',
        affectedAppointments: 5,
        willCancelAppointments: true,
      });
    });
  });

  describe('getLotReduceImpact', () => {
    it('devrait retourner 403 si utilisateur n\'est pas SUPERADMIN', async () => {
      req.user.role = 'NATIONAL';
      req.params.id = 'lot-1';
      req.query.quantity = '10';
      await getLotReduceImpact(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait retourner l\'impact de réduction d\'un lot', async () => {
      req.user.role = 'SUPERADMIN';
      req.params.id = 'lot-1';
      req.query.quantity = '10';
      
      prisma.stockLot.findUnique.mockResolvedValue({
        id: 'lot-1',
        ownerType: 'HEALTHCENTER',
        ownerId: 'hc-1',
        remainingQuantity: 100,
      });
      prisma.stockReservation.findMany.mockResolvedValue([
        { scheduleId: 'schedule-1', schedule: { scheduledFor: new Date() } },
      ]);

      await getLotReduceImpact(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });
  });
});

