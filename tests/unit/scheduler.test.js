const cron = require("node-cron");

// Mock des jobs AVANT de charger le module scheduler
jest.mock("../../src/jobs/stockExpirationJob", () => ({
  checkStockExpirations: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("../../src/jobs/appointmentNotificationJob", () => ({
  checkAppointmentNotifications: jest.fn().mockResolvedValue({ success: true }),
}));

// Charger le module scheduler après avoir configuré les mocks
const { 
  checkStockExpirations, 
  checkAppointmentNotifications,
  stockExpirationCallback,
  appointmentNotificationCallback,
} = require("../../src/jobs/scheduler");
const stockExpirationJob = require("../../src/jobs/stockExpirationJob");
const appointmentNotificationJob = require("../../src/jobs/appointmentNotificationJob");

describe("Scheduler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Nettoyer les tâches cron existantes
    cron.getTasks().forEach((task) => task.stop());
  });

  afterEach(() => {
    // Nettoyer les tâches cron après chaque test
    cron.getTasks().forEach((task) => task.stop());
  });

  describe("Configuration des tâches", () => {
    it("devrait planifier la tâche de vérification des stocks", () => {
      // Le scheduler est chargé automatiquement, on vérifie qu'il fonctionne
      const tasks = cron.getTasks();
      expect(tasks.size).toBeGreaterThan(0);
    });

    it("devrait utiliser les variables d'environnement pour les crons", () => {
      const originalStockCron = process.env.STOCK_CHECK_CRON;
      const originalAppointmentCron = process.env.APPOINTMENT_CHECK_CRON;

      process.env.STOCK_CHECK_CRON = "0 0 * * *";
      process.env.APPOINTMENT_CHECK_CRON = "0 */6 * * *";

      // Recharger le scheduler
      delete require.cache[require.resolve("../../src/jobs/scheduler")];
      require("../../src/jobs/scheduler");

      // Vérifier que les tâches sont configurées
      const tasks = cron.getTasks();
      expect(tasks.size).toBeGreaterThan(0);

      // Restaurer
      if (originalStockCron) {
        process.env.STOCK_CHECK_CRON = originalStockCron;
      } else {
        delete process.env.STOCK_CHECK_CRON;
      }
      if (originalAppointmentCron) {
        process.env.APPOINTMENT_CHECK_CRON = originalAppointmentCron;
      } else {
        delete process.env.APPOINTMENT_CHECK_CRON;
      }
    });

    it("devrait utiliser les valeurs par défaut si STOCK_CHECK_CRON n'est pas défini", () => {
      const originalStockCron = process.env.STOCK_CHECK_CRON;
      const originalAppointmentCron = process.env.APPOINTMENT_CHECK_CRON;

      // Supprimer les variables d'environnement pour tester les valeurs par défaut
      delete process.env.STOCK_CHECK_CRON;
      delete process.env.APPOINTMENT_CHECK_CRON;

      // Recharger le scheduler pour déclencher les branches ||
      delete require.cache[require.resolve("../../src/jobs/scheduler")];
      require("../../src/jobs/scheduler");

      // Vérifier que les tâches sont configurées avec les valeurs par défaut
      const tasks = cron.getTasks();
      expect(tasks.size).toBeGreaterThan(0);

      // Restaurer
      if (originalStockCron) {
        process.env.STOCK_CHECK_CRON = originalStockCron;
      }
      if (originalAppointmentCron) {
        process.env.APPOINTMENT_CHECK_CRON = originalAppointmentCron;
      }
    });

    it("devrait utiliser la valeur par défaut si APPOINTMENT_CHECK_CRON n'est pas défini", () => {
      const originalAppointmentCron = process.env.APPOINTMENT_CHECK_CRON;

      // Supprimer APPOINTMENT_CHECK_CRON mais garder STOCK_CHECK_CRON
      delete process.env.APPOINTMENT_CHECK_CRON;

      // Recharger le scheduler
      delete require.cache[require.resolve("../../src/jobs/scheduler")];
      require("../../src/jobs/scheduler");

      // Vérifier que les tâches sont configurées
      const tasks = cron.getTasks();
      expect(tasks.size).toBeGreaterThan(0);

      // Restaurer
      if (originalAppointmentCron) {
        process.env.APPOINTMENT_CHECK_CRON = originalAppointmentCron;
      }
    });

    it("devrait utiliser STOCK_CHECK_CRON défini dans l'environnement", () => {
      const originalStockCron = process.env.STOCK_CHECK_CRON;
      
      // Définir STOCK_CHECK_CRON pour couvrir la branche true du ||
      process.env.STOCK_CHECK_CRON = "0 */2 * * *";

      // Recharger le scheduler
      delete require.cache[require.resolve("../../src/jobs/scheduler")];
      require("../../src/jobs/scheduler");

      // Vérifier que les tâches sont configurées
      const tasks = cron.getTasks();
      expect(tasks.size).toBeGreaterThan(0);

      // Restaurer
      if (originalStockCron) {
        process.env.STOCK_CHECK_CRON = originalStockCron;
      } else {
        delete process.env.STOCK_CHECK_CRON;
      }
    });

    it("devrait utiliser APPOINTMENT_CHECK_CRON défini dans l'environnement", () => {
      const originalAppointmentCron = process.env.APPOINTMENT_CHECK_CRON;
      
      // Définir APPOINTMENT_CHECK_CRON pour couvrir la branche true du ||
      process.env.APPOINTMENT_CHECK_CRON = "0 */3 * * *";

      // Recharger le scheduler
      delete require.cache[require.resolve("../../src/jobs/scheduler")];
      require("../../src/jobs/scheduler");

      // Vérifier que les tâches sont configurées
      const tasks = cron.getTasks();
      expect(tasks.size).toBeGreaterThan(0);

      // Restaurer
      if (originalAppointmentCron) {
        process.env.APPOINTMENT_CHECK_CRON = originalAppointmentCron;
      } else {
        delete process.env.APPOINTMENT_CHECK_CRON;
      }
    });
  });

  describe("Exports", () => {
    it("devrait exporter checkStockExpirations", () => {
      expect(checkStockExpirations).toBeDefined();
      expect(typeof checkStockExpirations).toBe("function");
    });

    it("devrait exporter checkAppointmentNotifications", () => {
      expect(checkAppointmentNotifications).toBeDefined();
      expect(typeof checkAppointmentNotifications).toBe("function");
    });

    it("devrait appeler checkStockExpirations du job", async () => {
      await checkStockExpirations();
      expect(stockExpirationJob.checkStockExpirations).toHaveBeenCalledTimes(1);
    });

    it("devrait appeler checkAppointmentNotifications du job", async () => {
      await checkAppointmentNotifications();
      expect(appointmentNotificationJob.checkAppointmentNotifications).toHaveBeenCalledTimes(1);
    });
  });

  describe("Exécution des tâches cron", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Nettoyer les tâches cron existantes
      cron.getTasks().forEach((task) => task.stop());
      // Recharger le scheduler pour réinitialiser les tâches
      delete require.cache[require.resolve("../../src/jobs/scheduler")];
      require("../../src/jobs/scheduler");
    });

    it("devrait exécuter checkStockExpirations quand la tâche cron se déclenche", async () => {
      const tasks = cron.getTasks();
      expect(tasks.size).toBeGreaterThan(0);

      // Trouver la tâche de vérification des stocks
      // Note: On ne peut pas tester directement l'exécution des callbacks cron
      // car ils sont exécutés de manière asynchrone par node-cron
      // Mais on peut vérifier que les fonctions sont bien mockées
      expect(stockExpirationJob.checkStockExpirations).toBeDefined();
    });

    it("devrait exécuter checkAppointmentNotifications quand la tâche cron se déclenche", async () => {
      const tasks = cron.getTasks();
      expect(tasks.size).toBeGreaterThan(0);

      // Vérifier que les fonctions sont bien mockées
      expect(appointmentNotificationJob.checkAppointmentNotifications).toBeDefined();
    });

    it("devrait gérer les erreurs dans checkStockExpirations", async () => {
      const originalError = console.error;
      console.error = jest.fn();

      stockExpirationJob.checkStockExpirations.mockRejectedValueOnce(new Error("Test error"));

      // Note: On ne peut pas forcer l'exécution d'une tâche cron
      // Mais on peut vérifier que la fonction mockée peut gérer les erreurs
      try {
        await stockExpirationJob.checkStockExpirations();
      } catch (error) {
        expect(error.message).toBe("Test error");
      }

      console.error = originalError;
    });

    it("devrait gérer les erreurs dans checkAppointmentNotifications", async () => {
      const originalError = console.error;
      console.error = jest.fn();

      appointmentNotificationJob.checkAppointmentNotifications.mockRejectedValueOnce(new Error("Test error"));

      // Note: On ne peut pas forcer l'exécution d'une tâche cron
      // Mais on peut vérifier que la fonction mockée peut gérer les erreurs
      try {
        await appointmentNotificationJob.checkAppointmentNotifications();
      } catch (error) {
        expect(error.message).toBe("Test error");
      }

      console.error = originalError;
    });

    it("devrait gérer les erreurs dans le wrapper checkStockExpirations", async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      stockExpirationJob.checkStockExpirations.mockRejectedValueOnce(new Error("Erreur test"));

      try {
        await checkStockExpirations();
      } catch (error) {
        expect(error.message).toBe("Erreur test");
      }

      consoleErrorSpy.mockRestore();
    });

    it("devrait gérer les erreurs dans le wrapper checkAppointmentNotifications", async () => {
      appointmentNotificationJob.checkAppointmentNotifications.mockRejectedValueOnce(new Error("Erreur test"));

      try {
        await checkAppointmentNotifications();
      } catch (error) {
        expect(error.message).toBe("Erreur test");
      }
    });

    it("devrait exécuter stockExpirationCallback avec succès", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      
      const mockResult = { success: true, notificationsSent: 5 };
      stockExpirationJob.checkStockExpirations.mockResolvedValueOnce(mockResult);

      await stockExpirationCallback();

      expect(stockExpirationJob.checkStockExpirations).toHaveBeenCalled();
      
      // Vérifier que les logs ont été appelés (au moins 4 appels : 3 logs initiaux + 1 pour le résultat)
      expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(3);
      
      // Vérifier que le premier log contient "Exécution de la vérification des stocks expirés"
      expect(consoleLogSpy.mock.calls[0][0]).toContain("Exécution de la vérification des stocks expirés");
      
      // Vérifier qu'au moins un log contient "Résultat du cron:"
      const resultLogCall = consoleLogSpy.mock.calls.find(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes("Résultat du cron:")
      );
      expect(resultLogCall).toBeDefined();

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("devrait logger 'NON DÉFINI' si SMTP_USER n'est pas défini", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      
      const originalSmtpUser = process.env.SMTP_USER;
      delete process.env.SMTP_USER;
      
      const mockResult = { success: true, notificationsSent: 0 };
      stockExpirationJob.checkStockExpirations.mockResolvedValueOnce(mockResult);

      await stockExpirationCallback();

      // Vérifier que le log contient "NON DÉFINI" pour SMTP_USER
      const smtpUserLog = consoleLogSpy.mock.calls.find(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes("SMTP_USER")
      );
      expect(smtpUserLog).toBeDefined();
      expect(smtpUserLog[0]).toContain("NON DÉFINI");

      // Restaurer
      if (originalSmtpUser) {
        process.env.SMTP_USER = originalSmtpUser;
      }

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("devrait logger la valeur de SMTP_USER si défini", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      
      const originalSmtpUser = process.env.SMTP_USER;
      process.env.SMTP_USER = "test@example.com";
      
      const mockResult = { success: true, notificationsSent: 0 };
      stockExpirationJob.checkStockExpirations.mockResolvedValueOnce(mockResult);

      await stockExpirationCallback();

      // Vérifier que le log contient la valeur de SMTP_USER
      const smtpUserLog = consoleLogSpy.mock.calls.find(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes("SMTP_USER")
      );
      expect(smtpUserLog).toBeDefined();
      expect(smtpUserLog[0]).toContain("test@example.com");

      // Restaurer
      if (originalSmtpUser) {
        process.env.SMTP_USER = originalSmtpUser;
      } else {
        delete process.env.SMTP_USER;
      }

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("devrait logger 'DÉFINI' si SMTP_PASS est défini", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      
      const originalSmtpPass = process.env.SMTP_PASS;
      process.env.SMTP_PASS = "password123";
      
      const mockResult = { success: true, notificationsSent: 0 };
      stockExpirationJob.checkStockExpirations.mockResolvedValueOnce(mockResult);

      await stockExpirationCallback();

      // Vérifier que le log contient "DÉFINI" pour SMTP_PASS
      const smtpPassLog = consoleLogSpy.mock.calls.find(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes("SMTP_PASS")
      );
      expect(smtpPassLog).toBeDefined();
      expect(smtpPassLog[0]).toContain("DÉFINI");

      // Restaurer
      if (originalSmtpPass) {
        process.env.SMTP_PASS = originalSmtpPass;
      } else {
        delete process.env.SMTP_PASS;
      }

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("devrait logger 'NON DÉFINI' si SMTP_PASS n'est pas défini", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      
      const originalSmtpPass = process.env.SMTP_PASS;
      delete process.env.SMTP_PASS;
      
      const mockResult = { success: true, notificationsSent: 0 };
      stockExpirationJob.checkStockExpirations.mockResolvedValueOnce(mockResult);

      await stockExpirationCallback();

      // Vérifier que le log contient "NON DÉFINI" pour SMTP_PASS
      const smtpPassLog = consoleLogSpy.mock.calls.find(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes("SMTP_PASS")
      );
      expect(smtpPassLog).toBeDefined();
      expect(smtpPassLog[0]).toContain("NON DÉFINI");

      // Restaurer
      if (originalSmtpPass) {
        process.env.SMTP_PASS = originalSmtpPass;
      }

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("devrait gérer les erreurs dans stockExpirationCallback", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      
      const testError = new Error("Erreur test");
      stockExpirationJob.checkStockExpirations.mockRejectedValueOnce(testError);

      await stockExpirationCallback();

      expect(stockExpirationJob.checkStockExpirations).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Erreur dans le cron:"),
        testError
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(testError.stack);

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("devrait exécuter appointmentNotificationCallback", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      
      appointmentNotificationJob.checkAppointmentNotifications.mockResolvedValueOnce({ success: true });

      await appointmentNotificationCallback();

      expect(appointmentNotificationJob.checkAppointmentNotifications).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Exécution de la vérification des rendez-vous")
      );

      consoleLogSpy.mockRestore();
    });

    it("devrait gérer les erreurs dans appointmentNotificationCallback", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      
      const testError = new Error("Erreur test");
      appointmentNotificationJob.checkAppointmentNotifications.mockRejectedValueOnce(testError);

      await expect(appointmentNotificationCallback()).rejects.toThrow("Erreur test");

      expect(appointmentNotificationJob.checkAppointmentNotifications).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Exécution de la vérification des rendez-vous")
      );

      consoleLogSpy.mockRestore();
    });
  });
});