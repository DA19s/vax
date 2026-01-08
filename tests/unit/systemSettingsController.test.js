// tests/unit/systemSettingsController.test.js

const { getSystemSettings } = require('../../src/controllers/systemSettingsController');
const prisma = require('../../src/config/prismaClient');

jest.mock('../../src/config/prismaClient', () => ({
  appSettings: {
    findFirst: jest.fn(),
  },
}));

describe('systemSettingsController', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('getSystemSettings', () => {
    it('devrait retourner les paramètres système par défaut', async () => {
      prisma.appSettings.findFirst.mockResolvedValue(null);

      await getSystemSettings(req, res);

      expect(res.json).toHaveBeenCalledWith({
        appName: 'Imunia',
        appSubtitle: 'Plateforme de gestion de vaccination',
        logoUrl: '/logo.png',
      });
    });

    it('devrait toujours retourner les mêmes valeurs', async () => {
      prisma.appSettings.findFirst.mockResolvedValue(null);

      await getSystemSettings(req, res);
      const firstCall = res.json.mock.calls[0][0];

      res.json.mockClear();
      await getSystemSettings(req, res);
      const secondCall = res.json.mock.calls[0][0];

      expect(firstCall).toEqual(secondCall);
      expect(firstCall.appName).toBe('Imunia');
      expect(firstCall.appSubtitle).toBe('Plateforme de gestion de vaccination');
      expect(firstCall.logoUrl).toBe('/logo.png');
    });

    it('devrait utiliser "Imunia" si appName est null', async () => {
      prisma.appSettings.findFirst.mockResolvedValue({
        appName: null,
        logoPath: '/custom-logo.png',
      });

      await getSystemSettings(req, res);

      expect(res.json).toHaveBeenCalledWith({
        appName: 'Imunia',
        appSubtitle: 'Plateforme de gestion de vaccination',
        logoUrl: '/custom-logo.png',
      });
    });

    it('devrait utiliser "Imunia" si appName est une chaîne vide', async () => {
      prisma.appSettings.findFirst.mockResolvedValue({
        appName: '',
        logoPath: '/custom-logo.png',
      });

      await getSystemSettings(req, res);

      expect(res.json).toHaveBeenCalledWith({
        appName: 'Imunia',
        appSubtitle: 'Plateforme de gestion de vaccination',
        logoUrl: '/custom-logo.png',
      });
    });

    it('devrait utiliser "Imunia" si appName contient uniquement des espaces', async () => {
      prisma.appSettings.findFirst.mockResolvedValue({
        appName: '   ',
        logoPath: '/custom-logo.png',
      });

      await getSystemSettings(req, res);

      expect(res.json).toHaveBeenCalledWith({
        appName: 'Imunia',
        appSubtitle: 'Plateforme de gestion de vaccination',
        logoUrl: '/custom-logo.png',
      });
    });

    it('devrait utiliser appName trimé si valide', async () => {
      prisma.appSettings.findFirst.mockResolvedValue({
        appName: '  Mon Application  ',
        logoPath: '/custom-logo.png',
      });

      await getSystemSettings(req, res);

      expect(res.json).toHaveBeenCalledWith({
        appName: 'Mon Application',
        appSubtitle: 'Plateforme de gestion de vaccination',
        logoUrl: '/custom-logo.png',
      });
    });

    it('devrait utiliser "/logo.png" si logoPath est null', async () => {
      prisma.appSettings.findFirst.mockResolvedValue({
        appName: 'Mon App',
        logoPath: null,
      });

      await getSystemSettings(req, res);

      expect(res.json).toHaveBeenCalledWith({
        appName: 'Mon App',
        appSubtitle: 'Plateforme de gestion de vaccination',
        logoUrl: '/logo.png',
      });
    });

    it('devrait utiliser "/logo.png" si logoPath est absent', async () => {
      prisma.appSettings.findFirst.mockResolvedValue({
        appName: 'Mon App',
      });

      await getSystemSettings(req, res);

      expect(res.json).toHaveBeenCalledWith({
        appName: 'Mon App',
        appSubtitle: 'Plateforme de gestion de vaccination',
        logoUrl: '/logo.png',
      });
    });

    it('devrait retourner les valeurs par défaut en cas d\'erreur de base de données', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      prisma.appSettings.findFirst.mockRejectedValue(new Error('Erreur DB'));

      await getSystemSettings(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erreur récupération paramètres:',
        expect.any(Error)
      );
      expect(res.json).toHaveBeenCalledWith({
        appName: 'Imunia',
        appSubtitle: 'Plateforme de gestion de vaccination',
        logoUrl: '/logo.png',
      });
      
      consoleErrorSpy.mockRestore();
    });
  });
});


