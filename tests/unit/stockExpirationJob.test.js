// tests/unit/stockExpirationJob.test.js

jest.mock("../../src/services/stockExpirationService");
jest.mock("../../src/services/emailService");

const { checkStockExpirations } = require("../../src/jobs/stockExpirationJob");
const stockExpirationService = require("../../src/services/stockExpirationService");
const emailService = require("../../src/services/emailService");

describe("stockExpirationJob", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log pour éviter les logs dans les tests
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("checkStockExpirations", () => {
    it("devrait retourner un succès avec 0 notifications si aucun lot à notifier", async () => {
      stockExpirationService.findAllValidLots.mockResolvedValue([]);

      const result = await checkStockExpirations();

      expect(result).toEqual({
        success: true,
        notificationsSent: 0,
        errors: 0,
      });
      expect(stockExpirationService.findAllValidLots).toHaveBeenCalled();
    });

    it("devrait ignorer les lots qui ne sont pas dans la fenêtre de 24h", async () => {
      const mockLots = [
        {
          id: "lot-1",
          expiration: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 jours
          vaccine: { name: "BCG" },
        },
      ];

      stockExpirationService.findAllValidLots.mockResolvedValue(mockLots);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(10);
      stockExpirationService.findNextThreshold.mockReturnValue(7); // Seuil à 7 jours
      // isWithin24Hours = false car 10 > 7

      const result = await checkStockExpirations();

      expect(result).toEqual({
        success: true,
        notificationsSent: 0,
        errors: 0,
      });
      expect(emailService.sendStockExpirationAlert).not.toHaveBeenCalled();
    });

    it("devrait ignorer les lots sans seuil suivant", async () => {
      const mockLots = [
        {
          id: "lot-1",
          expiration: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000), // 100 jours
          vaccine: { name: "BCG" },
        },
      ];

      stockExpirationService.findAllValidLots.mockResolvedValue(mockLots);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(100);
      stockExpirationService.findNextThreshold.mockReturnValue(null);

      const result = await checkStockExpirations();

      expect(result).toEqual({
        success: true,
        notificationsSent: 0,
        errors: 0,
      });
    });

    it("devrait envoyer des notifications pour les lots dans la fenêtre de 24h", async () => {
      const mockLot = {
        id: "lot-1",
        expiration: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 jours
        vaccine: { name: "BCG" },
        remainingQuantity: 100,
      };

      const mockAgent = {
        id: "agent-1",
        email: "agent@test.com",
        firstName: "Agent",
        lastName: "Test",
      };

      stockExpirationService.findAllValidLots.mockResolvedValue([mockLot]);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(6);
      stockExpirationService.findNextThreshold.mockReturnValue(7); // Seuil à 7 jours
      stockExpirationService.getConcernedAgents.mockResolvedValue([mockAgent]);
      stockExpirationService.hasNotificationBeenSent.mockResolvedValue(false);
      stockExpirationService.getOwnerInfo.mockResolvedValue({
        type: "REGIONAL",
        name: "Région Test",
      });
      stockExpirationService.recordNotificationSent.mockResolvedValue(undefined);
      emailService.sendStockExpirationAlert.mockResolvedValue({ success: true });

      const result = await checkStockExpirations();

      expect(result).toEqual({
        success: true,
        notificationsSent: 1,
        errors: 0,
      });
      expect(stockExpirationService.getConcernedAgents).toHaveBeenCalledWith(mockLot);
      expect(emailService.sendStockExpirationAlert).toHaveBeenCalled();
      expect(stockExpirationService.recordNotificationSent).toHaveBeenCalled();
    });

    it("devrait ignorer les notifications déjà envoyées", async () => {
      const mockLot = {
        id: "lot-1",
        expiration: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        vaccine: { name: "BCG" },
      };

      const mockAgent = {
        id: "agent-1",
        email: "agent@test.com",
        firstName: "Agent",
        lastName: "Test",
      };

      stockExpirationService.findAllValidLots.mockResolvedValue([mockLot]);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(6);
      stockExpirationService.findNextThreshold.mockReturnValue(7);
      stockExpirationService.getConcernedAgents.mockResolvedValue([mockAgent]);
      stockExpirationService.hasNotificationBeenSent.mockResolvedValue(true); // Déjà envoyée

      const result = await checkStockExpirations();

      expect(result).toEqual({
        success: true,
        notificationsSent: 0,
        errors: 0,
      });
      expect(emailService.sendStockExpirationAlert).not.toHaveBeenCalled();
    });

    it("devrait grouper les lots par agent", async () => {
      const mockLots = [
        {
          id: "lot-1",
          expiration: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
          vaccine: { name: "BCG" },
          remainingQuantity: 100,
        },
        {
          id: "lot-2",
          expiration: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
          vaccine: { name: "DTP" },
          remainingQuantity: 50,
        },
      ];

      const mockAgent = {
        id: "agent-1",
        email: "agent@test.com",
        firstName: "Agent",
        lastName: "Test",
      };

      stockExpirationService.findAllValidLots.mockResolvedValue(mockLots);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(6);
      stockExpirationService.findNextThreshold.mockReturnValue(7);
      stockExpirationService.getConcernedAgents.mockResolvedValue([mockAgent]);
      stockExpirationService.hasNotificationBeenSent.mockResolvedValue(false);
      stockExpirationService.getOwnerInfo.mockResolvedValue({
        type: "REGIONAL",
        name: "Région Test",
      });
      stockExpirationService.recordNotificationSent.mockResolvedValue(undefined);
      emailService.sendStockExpirationAlert.mockResolvedValue({ success: true });

      const result = await checkStockExpirations();

      expect(result).toEqual({
        success: true,
        notificationsSent: 2, // 2 lots pour le même agent
        errors: 0,
      });
      expect(emailService.sendStockExpirationAlert).toHaveBeenCalledTimes(1); // 1 email pour 2 lots
      expect(stockExpirationService.recordNotificationSent).toHaveBeenCalledTimes(2);
    });

    it("devrait gérer les erreurs lors de l'envoi d'email (success: false)", async () => {
      const mockLot = {
        id: "lot-1",
        expiration: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        vaccine: { name: "BCG" },
        remainingQuantity: 100,
      };

      const mockAgent = {
        id: "agent-1",
        email: "agent@test.com",
        firstName: "Agent",
        lastName: "Test",
      };

      stockExpirationService.findAllValidLots.mockResolvedValue([mockLot]);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(6);
      stockExpirationService.findNextThreshold.mockReturnValue(7);
      stockExpirationService.getConcernedAgents.mockResolvedValue([mockAgent]);
      stockExpirationService.hasNotificationBeenSent.mockResolvedValue(false);
      stockExpirationService.getOwnerInfo.mockResolvedValue({
        type: "REGIONAL",
        name: "Région Test",
      });
      emailService.sendStockExpirationAlert.mockResolvedValue({
        success: false,
        error: "Erreur SMTP",
      });

      const result = await checkStockExpirations();

      expect(result).toEqual({
        success: true,
        notificationsSent: 0,
        errors: 1,
      });
      expect(stockExpirationService.recordNotificationSent).not.toHaveBeenCalled();
    });

    it("devrait gérer les exceptions lors de l'envoi d'email", async () => {
      const mockLot = {
        id: "lot-1",
        expiration: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        vaccine: { name: "BCG" },
      };

      const mockAgent = {
        id: "agent-1",
        email: "agent@test.com",
        firstName: "Agent",
        lastName: "Test",
      };

      stockExpirationService.findAllValidLots.mockResolvedValue([mockLot]);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(6);
      stockExpirationService.findNextThreshold.mockReturnValue(7);
      stockExpirationService.getConcernedAgents.mockResolvedValue([mockAgent]);
      stockExpirationService.hasNotificationBeenSent.mockResolvedValue(false);
      stockExpirationService.getOwnerInfo.mockResolvedValue({
        type: "REGIONAL",
        name: "Région Test",
      });
      emailService.sendStockExpirationAlert.mockRejectedValue(new Error("Erreur réseau"));

      const result = await checkStockExpirations();

      expect(result).toEqual({
        success: true,
        notificationsSent: 0,
        errors: 1,
      });
    });

    it("devrait gérer les erreurs lors de la récupération des lots", async () => {
      stockExpirationService.findAllValidLots.mockRejectedValue(
        new Error("Erreur base de données")
      );

      const result = await checkStockExpirations();

      expect(result).toEqual({
        success: false,
        error: "Erreur base de données",
      });
    });

    it("devrait vérifier la fenêtre de 24h correctement (jours restants = seuil)", async () => {
      const mockLot = {
        id: "lot-1",
        expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        vaccine: { name: "BCG" },
        remainingQuantity: 100,
      };

      const mockAgent = {
        id: "agent-1",
        email: "agent@test.com",
        firstName: "Agent",
        lastName: "Test",
      };

      stockExpirationService.findAllValidLots.mockResolvedValue([mockLot]);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(7);
      stockExpirationService.findNextThreshold.mockReturnValue(7);
      stockExpirationService.getConcernedAgents.mockResolvedValue([mockAgent]);
      stockExpirationService.hasNotificationBeenSent.mockResolvedValue(false);
      stockExpirationService.getOwnerInfo.mockResolvedValue({
        type: "REGIONAL",
        name: "Région Test",
      });
      stockExpirationService.recordNotificationSent.mockResolvedValue(undefined);
      emailService.sendStockExpirationAlert.mockResolvedValue({ success: true });

      const result = await checkStockExpirations();

      expect(result).toEqual({
        success: true,
        notificationsSent: 1,
        errors: 0,
      });
    });

    it("devrait vérifier la fenêtre de 24h correctement (jours restants = seuil - 1)", async () => {
      const mockLot = {
        id: "lot-1",
        expiration: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        vaccine: { name: "BCG" },
        remainingQuantity: 100,
      };

      const mockAgent = {
        id: "agent-1",
        email: "agent@test.com",
        firstName: "Agent",
        lastName: "Test",
      };

      stockExpirationService.findAllValidLots.mockResolvedValue([mockLot]);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(6);
      stockExpirationService.findNextThreshold.mockReturnValue(7);
      stockExpirationService.getConcernedAgents.mockResolvedValue([mockAgent]);
      stockExpirationService.hasNotificationBeenSent.mockResolvedValue(false);
      stockExpirationService.getOwnerInfo.mockResolvedValue({
        type: "REGIONAL",
        name: "Région Test",
      });
      stockExpirationService.recordNotificationSent.mockResolvedValue(undefined);
      emailService.sendStockExpirationAlert.mockResolvedValue({ success: true });

      const result = await checkStockExpirations();

      expect(result).toEqual({
        success: true,
        notificationsSent: 1,
        errors: 0,
      });
    });

    it("devrait ignorer le debug pour un lot spécifique", async () => {
      const mockLot = {
        id: "1e3c039e-a40b-44cd-87e1-8366b67a966d",
        expiration: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        vaccine: { name: "BCG" },
        remainingQuantity: 100,
      };

      stockExpirationService.findAllValidLots.mockResolvedValue([mockLot]);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(6);
      stockExpirationService.findNextThreshold.mockReturnValue(null);

      const result = await checkStockExpirations();

      expect(result.success).toBe(true);
      expect(result.notificationsSent).toBe(0);
    });

    it("devrait logger les informations du lot quand isWithin24Hours est true", async () => {
      // Ne pas mock console.log pour cette ligne spécifique afin qu'elle soit comptée comme couverte
      const originalLog = console.log;
      const logCalls = [];
      console.log = (...args) => {
        logCalls.push(args);
        originalLog(...args);
      };
      
      const mockLot = {
        id: "lot-1",
        expiration: new Date(Date.now() + 6.5 * 24 * 60 * 60 * 1000), // 6.5 jours
        vaccine: { name: "BCG" },
        remainingQuantity: 100,
      };

      const mockAgent = {
        id: "agent-1",
        email: "agent@test.com",
        firstName: "Agent",
        lastName: "Test",
      };

      stockExpirationService.findAllValidLots.mockResolvedValue([mockLot]);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(6.5);
      stockExpirationService.findNextThreshold.mockReturnValue(7); // Seuil à 7 jours
      stockExpirationService.getConcernedAgents.mockResolvedValue([mockAgent]);
      stockExpirationService.hasNotificationBeenSent.mockResolvedValue(false);
      stockExpirationService.getOwnerInfo.mockResolvedValue({
        type: "REGIONAL",
        name: "Région Test",
      });
      stockExpirationService.recordNotificationSent.mockResolvedValue(undefined);
      emailService.sendStockExpirationAlert.mockResolvedValue({ success: true });

      await checkStockExpirations();

      // Vérifier que le console.log avec les informations du lot a été appelé
      const lotLogCall = logCalls.find(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes(`Lot ${mockLot.id}`)
      );
      expect(lotLogCall).toBeDefined();
      expect(lotLogCall[0]).toContain(`dans fenêtre 24h: true`);

      console.log = originalLog;
    });

    it("devrait logger les informations du lot même quand isWithin24Hours est false", async () => {
      // Ne pas mock console.log pour cette ligne spécifique afin qu'elle soit comptée comme couverte
      const originalLog = console.log;
      const logCalls = [];
      console.log = (...args) => {
        logCalls.push(args);
        originalLog(...args);
      };
      
      const mockLot = {
        id: "lot-2",
        expiration: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 jours
        vaccine: { name: "DTaP" },
      };

      stockExpirationService.findAllValidLots.mockResolvedValue([mockLot]);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(10);
      stockExpirationService.findNextThreshold.mockReturnValue(7); // Seuil à 7 jours
      // isWithin24Hours = false car 10 > 7

      await checkStockExpirations();

      // Vérifier que le console.log avec les informations du lot a été appelé même si isWithin24Hours est false
      const lotLogCall = logCalls.find(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes(`Lot ${mockLot.id}`)
      );
      expect(lotLogCall).toBeDefined();
      expect(lotLogCall[0]).toContain(`dans fenêtre 24h: false`);

      console.log = originalLog;
    });

    it("devrait logger le message de succès d'envoi d'email", async () => {
      const originalLog = console.log;
      const logCalls = [];
      console.log = (...args) => {
        logCalls.push(args);
        originalLog(...args);
      };

      const mockLot = {
        id: "lot-1",
        expiration: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        vaccine: { name: "BCG" },
        remainingQuantity: 100,
      };

      const mockAgent = {
        id: "agent-1",
        email: "agent@test.com",
        firstName: "Agent",
        lastName: "Test",
      };

      stockExpirationService.findAllValidLots.mockResolvedValue([mockLot]);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(6);
      stockExpirationService.findNextThreshold.mockReturnValue(7);
      stockExpirationService.getConcernedAgents.mockResolvedValue([mockAgent]);
      stockExpirationService.hasNotificationBeenSent.mockResolvedValue(false);
      stockExpirationService.getOwnerInfo.mockResolvedValue({
        type: "REGIONAL",
        name: "Région Test",
      });
      stockExpirationService.recordNotificationSent.mockResolvedValue(undefined);
      emailService.sendStockExpirationAlert.mockResolvedValue({ success: true });

      await checkStockExpirations();

      const successLogCall = logCalls.find(call =>
        call[0] && typeof call[0] === 'string' && call[0].includes("✅ Email envoyé")
      );
      expect(successLogCall).toBeDefined();

      console.log = originalLog;
    });

    it("devrait logger le message d'erreur d'envoi d'email", async () => {
      const originalError = console.error;
      const errorCalls = [];
      console.error = (...args) => {
        errorCalls.push(args);
        originalError(...args);
      };

      const mockLot = {
        id: "lot-1",
        expiration: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        vaccine: { name: "BCG" },
        remainingQuantity: 100,
      };

      const mockAgent = {
        id: "agent-1",
        email: "agent@test.com",
        firstName: "Agent",
        lastName: "Test",
      };

      stockExpirationService.findAllValidLots.mockResolvedValue([mockLot]);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(6);
      stockExpirationService.findNextThreshold.mockReturnValue(7);
      stockExpirationService.getConcernedAgents.mockResolvedValue([mockAgent]);
      stockExpirationService.hasNotificationBeenSent.mockResolvedValue(false);
      stockExpirationService.getOwnerInfo.mockResolvedValue({
        type: "REGIONAL",
        name: "Région Test",
      });
      emailService.sendStockExpirationAlert.mockResolvedValue({
        success: false,
        error: "Erreur SMTP",
      });

      await checkStockExpirations();

      const errorLogCall = errorCalls.find(call =>
        call[0] && typeof call[0] === 'string' && call[0].includes("❌ Erreur envoi email")
      );
      expect(errorLogCall).toBeDefined();

      console.error = originalError;
    });

    it("devrait logger le message d'erreur lors d'une exception", async () => {
      const originalError = console.error;
      const errorCalls = [];
      console.error = (...args) => {
        errorCalls.push(args);
        originalError(...args);
      };

      const mockLot = {
        id: "lot-1",
        expiration: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        vaccine: { name: "BCG" },
        remainingQuantity: 100,
      };

      const mockAgent = {
        id: "agent-1",
        email: "agent@test.com",
        firstName: "Agent",
        lastName: "Test",
      };

      stockExpirationService.findAllValidLots.mockResolvedValue([mockLot]);
      stockExpirationService.calculateDaysUntilExpiration.mockReturnValue(6);
      stockExpirationService.findNextThreshold.mockReturnValue(7);
      stockExpirationService.getConcernedAgents.mockResolvedValue([mockAgent]);
      stockExpirationService.hasNotificationBeenSent.mockResolvedValue(false);
      stockExpirationService.getOwnerInfo.mockResolvedValue({
        type: "REGIONAL",
        name: "Région Test",
      });
      emailService.sendStockExpirationAlert.mockRejectedValue(new Error("Erreur réseau"));

      await checkStockExpirations();

      const errorLogCall = errorCalls.find(call =>
        call[0] && typeof call[0] === 'string' && call[0].includes("❌ Erreur lors de l'envoi")
      );
      expect(errorLogCall).toBeDefined();

      console.error = originalError;
    });

    it("devrait logger le message final de résumé", async () => {
      const originalLog = console.log;
      const logCalls = [];
      console.log = (...args) => {
        logCalls.push(args);
        originalLog(...args);
      };

      stockExpirationService.findAllValidLots.mockResolvedValue([]);

      await checkStockExpirations();

      const finalLogCall = logCalls.find(call =>
        call[0] && typeof call[0] === 'string' && call[0].includes("✅ Vérification terminée")
      );
      expect(finalLogCall).toBeDefined();

      console.log = originalLog;
    });

    it("devrait logger le message d'erreur globale", async () => {
      const originalError = console.error;
      const errorCalls = [];
      console.error = (...args) => {
        errorCalls.push(args);
        originalError(...args);
      };

      stockExpirationService.findAllValidLots.mockRejectedValue(new Error("Erreur DB"));

      await checkStockExpirations();

      const errorLogCall = errorCalls.find(call =>
        call[0] && typeof call[0] === 'string' && call[0].includes("❌ Erreur lors de la vérification des stocks")
      );
      expect(errorLogCall).toBeDefined();

      console.error = originalError;
    });
  });
});
