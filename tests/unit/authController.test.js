// tests/unit/controllers/authController.test.js

const { login, logout } = require('../../../src/controllers/authController');
const prisma = require('../../../src/config/prismaClient');
const tokenService = require('../../../src/services/tokenService');
const bcrypt = require('bcryptjs');

// Mock des dépendances
jest.mock('../../../src/config/prismaClient');
jest.mock('../../../src/services/tokenService');
jest.mock('bcryptjs');

describe('authController', () => {
  let req, res, next;

  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    next = jest.fn();
  });

  describe('login()', () => {
    it('devrait retourner 400 si email manquant', async () => {
      req.body = { password: 'password123' };

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email et mot de passe requis.'
      });
    });

    it('devrait retourner 400 si password manquant', async () => {
      req.body = { email: 'test@example.com' };

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email et mot de passe requis.'
      });
    });

    it('devrait retourner 401 si utilisateur non trouvé', async () => {
      req.body = { email: 'inexistant@example.com', password: 'password123' };
      
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Identifiants invalides.'
      });
    });

    it('devrait retourner 401 si mot de passe incorrect', async () => {
      req.body = { email: 'test@example.com', password: 'mauvaispassword' };
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedpassword',
        isActive: true,
        role: 'AGENT'
      };

      prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Identifiants invalides.'
      });
    });

    it('devrait retourner tokens si identifiants valides', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedpassword',
        isActive: true,
        role: 'AGENT',
        agentLevel: 'ADMIN',
        region: null,
        district: null,
        healthCenter: null
      };

      prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      tokenService.signAccessToken = jest.fn().mockReturnValue('access-token');
      tokenService.signRefreshToken = jest.fn().mockReturnValue('refresh-token');

      await login(req, res, next);

      expect(tokenService.signAccessToken).toHaveBeenCalledWith({
        sub: 'user-123',
        role: 'AGENT',
        agentLevel: 'ADMIN'
      });
      expect(res.json).toHaveBeenCalledWith({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiredLots: []
      });
    });

    it('devrait demander sélection de rôle si plusieurs comptes avec même email', async () => {
      req.body = { email: 'multi@example.com', password: 'password123' };
      
      const mockUsers = [
        { id: 'user-1', role: 'AGENT', agentLevel: 'ADMIN', region: null, district: null, healthCenter: null },
        { id: 'user-2', role: 'DISTRICT', agentLevel: null, region: null, district: { id: 'd-1', name: 'Dakar' }, healthCenter: null }
      ];

      prisma.user.findMany = jest.fn().mockResolvedValue(mockUsers);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await login(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        requiresRoleSelection: true,
        roles: expect.arrayContaining([
          expect.objectContaining({ role: 'AGENT' }),
          expect.objectContaining({ role: 'DISTRICT' })
        ])
      });
    });
  });

  describe('logout()', () => {
    it('devrait retourner 204', async () => {
      await logout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});