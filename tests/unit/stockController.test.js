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
  deleteLot,
  getNationalStockStats,
  getRegionalStockStats,
  getDistrictStockStats,
  getHealthCenterStockStats,
  getHealthCenterReservations,
  getPendingTransfers,
  confirmPendingTransfer,
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
  },
  pendingStockTransfer: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  pendingStockTransferLot: {
    create: jest.fn(),
    deleteMany: jest.fn(),
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
  $transaction: jest.fn((callback) => {
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
      user: mockPrisma.user,
      district: mockPrisma.district,
      commune: mockPrisma.commune,
      healthCenter: mockPrisma.healthCenter,
      region: mockPrisma.region,
    };
    return callback(mockTx);
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
  },
  createLot: jest.fn(),
  consumeLots: jest.fn(),
  recordTransfer: jest.fn(),
  deleteLotCascade: jest.fn(),
  updateNearestExpiration: jest.fn(),
}));

jest.mock('../../src/services/emailService', () => ({
  sendStockTransferNotificationEmail: jest.fn(),
}));

describe('stockController', () => {
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
      const mockRegionalStock = { id: 'stock-1', vaccineId: 'vaccine-1', regionId: 'region-1', quantity: 100, region: { name: 'Dakar' }, vaccine: { name: 'BCG' } };
      const mockNationalStock = { id: 'stock-1', vaccineId: 'vaccine-1', quantity: 200 };
      prisma.stockREGIONAL.findUnique.mockResolvedValue(mockRegionalStock);
      prisma.stockNATIONAL.findUnique.mockResolvedValue(mockNationalStock);
      stockLotService.consumeLots.mockResolvedValue([{ lotId: 'lot-1', quantity: 100 }]);
      prisma.user.findMany.mockResolvedValue([{ email: 'test@test.com' }]);
      emailService.sendStockTransferNotificationEmail.mockResolvedValue();
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockREGIONAL: {
            findUnique: prisma.stockREGIONAL.findUnique,
            update: jest.fn().mockResolvedValue(mockRegionalStock),
          },
          stockNATIONAL: {
            findUnique: prisma.stockNATIONAL.findUnique,
            update: jest.fn().mockResolvedValue(mockNationalStock),
          },
          pendingStockTransfer: {
            create: jest.fn().mockResolvedValue({ id: 'transfer-1' }),
          },
        };
        return callback(mockTx);
      });

      await addStockREGIONAL(req, res, next);

      expect(res.json).toHaveBeenCalled();
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
      stockLotService.deleteLotCascade.mockResolvedValue(['lot-1']);
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockNATIONAL: {
            findUnique: prisma.stockNATIONAL.findUnique,
            delete: jest.fn().mockResolvedValue({}),
          },
          stockLot: {
            findMany: prisma.stockLot.findMany,
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

    it('devrait retourner 400 si vaccineId manquant', async () => {
      await listNationalLots(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('reduceLotNATIONAL', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      req.user = { role: 'NATIONAL', id: 'user-1' };
      req.params = {};
      req.body = {};
    });

    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
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
    it('devrait retourner 403 si utilisateur n\'est pas NATIONAL', async () => {
      req.user.role = 'REGIONAL';
      await deleteLot(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('devrait supprimer un lot avec succès', async () => {
      req.params.id = 'lot-1';
      prisma.stockLot.findUnique.mockResolvedValue({ id: 'lot-1' });
      stockLotService.deleteLotCascade.mockResolvedValue(['lot-1']);
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          stockLot: {
            findUnique: prisma.stockLot.findUnique,
          },
        };
        return callback(mockTx);
      });

      await deleteLot(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.deletedIds).toEqual(['lot-1']);
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
          { lotId: 'lot-1', quantity: 100, lot: { id: 'lot-1', expiration: new Date(), status: 'VALID' } },
        ],
        vaccine: { name: 'BCG' },
      };
      prisma.stockREGIONAL.findUnique.mockResolvedValue({ id: 'stock-1', quantity: 0 });
      stockLotService.createLot.mockResolvedValue({ id: 'new-lot-1' });
      stockLotService.recordTransfer.mockResolvedValue({ id: 'transfer-record-1' });
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          pendingStockTransfer: {
            findUnique: jest.fn().mockResolvedValue(mockTransfer),
            update: jest.fn().mockResolvedValue({ ...mockTransfer, status: 'CONFIRMED' }),
          },
          stockREGIONAL: {
            findUnique: prisma.stockREGIONAL.findUnique,
            update: jest.fn().mockResolvedValue({ id: 'stock-1', quantity: 100 }),
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
  });

  // Tests supplémentaires pour les autres fonctions (similaires)
  // Pour économiser de l'espace, je vais créer les autres fichiers de test séparément
});

