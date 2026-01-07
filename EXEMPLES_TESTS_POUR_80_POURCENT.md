# Exemples de Tests pour Atteindre 80% de Couverture

Ce document contient des exemples concrets de tests à créer pour les zones critiques non couvertes.

---

## 1. Tests pour scheduler.js

**Fichier**: `tests/unit/scheduler.test.js` (NOUVEAU)

```javascript
const cron = require("node-cron");
const { checkStockExpirations, checkAppointmentNotifications } = require("../../src/jobs/scheduler");

// Mock des jobs
jest.mock("../../src/jobs/stockExpirationJob", () => ({
  checkStockExpirations: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("../../src/jobs/appointmentNotificationJob", () => ({
  checkAppointmentNotifications: jest.fn().mockResolvedValue({ success: true }),
}));

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
  });
});
```

---

## 2. Tests unitaires pour stockExpirationService.js

**Fichier**: `tests/unit/stockExpirationService.test.js` (NOUVEAU)

```javascript
const prisma = require("../../src/config/prismaClient");
const {
  findAllValidLots,
  calculateDaysUntilExpiration,
  findNextThreshold,
  getConcernedAgents,
  hasNotificationBeenSent,
  recordNotificationSent,
} = require("../../src/services/stockExpirationService");

describe("stockExpirationService", () => {
  let regionId;
  let vaccineId;
  let lotId;

  beforeAll(async () => {
    // Setup de données de test
    const region = await prisma.region.create({
      data: { name: "Test Region Service" },
    });
    regionId = region.id;

    const vaccine = await prisma.vaccine.create({
      data: {
        name: "Test Vaccine Service",
        doses: 1,
        minAge: 0,
        maxAge: 12,
      },
    });
    vaccineId = vaccine.id;
  });

  afterAll(async () => {
    // Nettoyage
    await prisma.stockExpirationNotification.deleteMany({});
    await prisma.stockLot.deleteMany({});
    await prisma.stock.deleteMany({});
    await prisma.vaccine.delete({ where: { id: vaccineId } });
    await prisma.region.delete({ where: { id: regionId } });
  });

  describe("findAllValidLots", () => {
    it("devrait retourner uniquement les lots valides", async () => {
      // Créer un stock et un lot valide
      const stock = await prisma.stock.create({
        data: {
          vaccineId,
          ownerType: "REGIONAL",
          ownerId: regionId,
          quantity: 100,
        },
      });

      const lot = await prisma.stockLot.create({
        data: {
          stockId: stock.id,
          quantity: 50,
          remainingQuantity: 50,
          expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
          status: "VALID",
          ownerType: "REGIONAL",
          ownerId: regionId,
        },
      });

      const lots = await findAllValidLots();
      expect(lots).toContainEqual(
        expect.objectContaining({ id: lot.id })
      );

      // Nettoyer
      await prisma.stockLot.delete({ where: { id: lot.id } });
      await prisma.stock.delete({ where: { id: stock.id } });
    });

    it("ne devrait pas retourner les lots expirés", async () => {
      const stock = await prisma.stock.create({
        data: {
          vaccineId,
          ownerType: "REGIONAL",
          ownerId: regionId,
          quantity: 100,
        },
      });

      const expiredLot = await prisma.stockLot.create({
        data: {
          stockId: stock.id,
          quantity: 50,
          remainingQuantity: 50,
          expiration: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // -1 jour (expiré)
          status: "EXPIRED",
          ownerType: "REGIONAL",
          ownerId: regionId,
        },
      });

      const lots = await findAllValidLots();
      expect(lots).not.toContainEqual(
        expect.objectContaining({ id: expiredLot.id })
      );

      // Nettoyer
      await prisma.stockLot.delete({ where: { id: expiredLot.id } });
      await prisma.stock.delete({ where: { id: stock.id } });
    });
  });

  describe("calculateDaysUntilExpiration", () => {
    it("devrait calculer correctement les jours restants", () => {
      const expiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 jours
      const days = calculateDaysUntilExpiration(expiration);
      expect(days).toBeCloseTo(7, 0);
    });

    it("devrait retourner 0 pour les dates passées", () => {
      const expiration = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // -1 jour
      const days = calculateDaysUntilExpiration(expiration);
      expect(days).toBe(0);
    });
  });

  describe("findNextThreshold", () => {
    it("devrait trouver le seuil 7 jours pour un lot expirant dans 5 jours", () => {
      const daysUntilExpiration = 5;
      const threshold = findNextThreshold(daysUntilExpiration);
      expect(threshold).toBe(7);
    });

    it("devrait trouver le seuil 14 jours pour un lot expirant dans 10 jours", () => {
      const daysUntilExpiration = 10;
      const threshold = findNextThreshold(daysUntilExpiration);
      expect(threshold).toBe(14);
    });

    it("devrait trouver le seuil 30 jours pour un lot expirant dans 20 jours", () => {
      const daysUntilExpiration = 20;
      const threshold = findNextThreshold(daysUntilExpiration);
      expect(threshold).toBe(30);
    });

    it("devrait retourner null si le lot expire dans plus de 30 jours", () => {
      const daysUntilExpiration = 35;
      const threshold = findNextThreshold(daysUntilExpiration);
      expect(threshold).toBeNull();
    });
  });

  describe("hasNotificationBeenSent", () => {
    it("devrait retourner false si aucune notification n'a été envoyée", async () => {
      const lotId = "test-lot-id";
      const threshold = 7;
      const sent = await hasNotificationBeenSent(lotId, threshold);
      expect(sent).toBe(false);
    });

    it("devrait retourner true si une notification a été envoyée", async () => {
      const stock = await prisma.stock.create({
        data: {
          vaccineId,
          ownerType: "REGIONAL",
          ownerId: regionId,
          quantity: 100,
        },
      });

      const lot = await prisma.stockLot.create({
        data: {
          stockId: stock.id,
          quantity: 50,
          remainingQuantity: 50,
          expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "VALID",
          ownerType: "REGIONAL",
          ownerId: regionId,
        },
      });

      // Enregistrer une notification
      await recordNotificationSent(lot.id, 7);

      const sent = await hasNotificationBeenSent(lot.id, 7);
      expect(sent).toBe(true);

      // Nettoyer
      await prisma.stockExpirationNotification.deleteMany({
        where: { lotId: lot.id },
      });
      await prisma.stockLot.delete({ where: { id: lot.id } });
      await prisma.stock.delete({ where: { id: stock.id } });
    });
  });

  describe("getConcernedAgents", () => {
    it("devrait retourner les agents concernés pour un lot régional", async () => {
      // Créer un agent régional
      const agent = await prisma.user.create({
        data: {
          email: "test-agent-regional@test.com",
          password: "hashed",
          firstName: "Test",
          lastName: "Agent",
          role: "REGIONAL",
          agentLevel: "REGIONAL",
          regionId,
          isActive: true,
        },
      });

      const stock = await prisma.stock.create({
        data: {
          vaccineId,
          ownerType: "REGIONAL",
          ownerId: regionId,
          quantity: 100,
        },
      });

      const lot = await prisma.stockLot.create({
        data: {
          stockId: stock.id,
          quantity: 50,
          remainingQuantity: 50,
          expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "VALID",
          ownerType: "REGIONAL",
          ownerId: regionId,
        },
      });

      const agents = await getConcernedAgents(lot);
      expect(agents).toContainEqual(
        expect.objectContaining({ id: agent.id })
      );

      // Nettoyer
      await prisma.stockLot.delete({ where: { id: lot.id } });
      await prisma.stock.delete({ where: { id: stock.id } });
      await prisma.user.delete({ where: { id: agent.id } });
    });
  });
});
```

---

## 3. Tests unitaires pour appointmentNotificationService.js

**Fichier**: `tests/unit/appointmentNotificationService.test.js` (NOUVEAU)

```javascript
const prisma = require("../../src/config/prismaClient");
const {
  findAllValidAppointments,
  findAppointmentsToNotify,
  sendAppointmentNotification,
} = require("../../src/services/appointmentNotificationService");

describe("appointmentNotificationService", () => {
  let regionId;
  let districtId;
  let healthCenterId;
  let vaccineId;
  let childId;
  let parentId;

  beforeAll(async () => {
    // Setup de données de test
    const region = await prisma.region.create({
      data: { name: "Test Region Appointment Service" },
    });
    regionId = region.id;

    const district = await prisma.district.create({
      data: {
        name: "Test District Appointment Service",
        regionId,
      },
    });
    districtId = district.id;

    const healthCenter = await prisma.healthCenter.create({
      data: {
        name: "Test Health Center Appointment Service",
        districtId,
      },
    });
    healthCenterId = healthCenter.id;

    const vaccine = await prisma.vaccine.create({
      data: {
        name: "Test Vaccine Appointment Service",
        doses: 1,
        minAge: 0,
        maxAge: 12,
      },
    });
    vaccineId = vaccine.id;

    const parent = await prisma.user.create({
      data: {
        email: "test-parent-appointment@test.com",
        password: "hashed",
        firstName: "Test",
        lastName: "Parent",
        role: "PARENT",
        phone: "+221701234567",
        isActive: true,
      },
    });
    parentId = parent.id;

    const child = await prisma.children.create({
      data: {
        firstName: "Test",
        lastName: "Child Appointment",
        dateOfBirth: new Date("2020-01-01"),
        parentId,
        healthCenterId,
      },
    });
    childId = child.id;
  });

  afterAll(async () => {
    // Nettoyage
    await prisma.appointmentNotification.deleteMany({});
    await prisma.childVaccineScheduled.deleteMany({});
    await prisma.children.delete({ where: { id: childId } });
    await prisma.user.delete({ where: { id: parentId } });
    await prisma.vaccine.delete({ where: { id: vaccineId } });
    await prisma.healthCenter.delete({ where: { id: healthCenterId } });
    await prisma.district.delete({ where: { id: districtId } });
    await prisma.region.delete({ where: { id: regionId } });
  });

  describe("findAllValidAppointments", () => {
    it("devrait retourner uniquement les rendez-vous valides", async () => {
      const appointment = await prisma.childVaccineScheduled.create({
        data: {
          childId,
          vaccineId,
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 jour
          doseNumber: 1,
          status: "SCHEDULED",
        },
      });

      const appointments = await findAllValidAppointments();
      expect(appointments).toContainEqual(
        expect.objectContaining({ id: appointment.id })
      );

      // Nettoyer
      await prisma.childVaccineScheduled.delete({ where: { id: appointment.id } });
    });

    it("ne devrait pas retourner les rendez-vous annulés", async () => {
      const appointment = await prisma.childVaccineScheduled.create({
        data: {
          childId,
          vaccineId,
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          doseNumber: 1,
          status: "CANCELLED",
        },
      });

      const appointments = await findAllValidAppointments();
      expect(appointments).not.toContainEqual(
        expect.objectContaining({ id: appointment.id })
      );

      // Nettoyer
      await prisma.childVaccineScheduled.delete({ where: { id: appointment.id } });
    });
  });

  describe("findAppointmentsToNotify", () => {
    it("devrait trouver les rendez-vous à notifier dans 24h", async () => {
      const appointment = await prisma.childVaccineScheduled.create({
        data: {
          childId,
          vaccineId,
          scheduledDate: new Date(Date.now() + 23 * 60 * 60 * 1000), // +23 heures
          doseNumber: 1,
          status: "SCHEDULED",
        },
      });

      const appointments = await findAppointmentsToNotify();
      expect(appointments).toContainEqual(
        expect.objectContaining({ id: appointment.id })
      );

      // Nettoyer
      await prisma.childVaccineScheduled.delete({ where: { id: appointment.id } });
    });

    it("ne devrait pas retourner les rendez-vous déjà notifiés", async () => {
      const appointment = await prisma.childVaccineScheduled.create({
        data: {
          childId,
          vaccineId,
          scheduledDate: new Date(Date.now() + 23 * 60 * 60 * 1000),
          doseNumber: 1,
          status: "SCHEDULED",
        },
      });

      // Enregistrer une notification
      await prisma.appointmentNotification.create({
        data: {
          appointmentId: appointment.id,
          notificationType: "EMAIL",
          sentAt: new Date(),
        },
      });

      const appointments = await findAppointmentsToNotify();
      expect(appointments).not.toContainEqual(
        expect.objectContaining({ id: appointment.id })
      );

      // Nettoyer
      await prisma.appointmentNotification.deleteMany({
        where: { appointmentId: appointment.id },
      });
      await prisma.childVaccineScheduled.delete({ where: { id: appointment.id } });
    });
  });
});
```

---

## 4. Tests pour le middleware auth.js (chemins manquants)

**Fichier**: `tests/integration/authMiddleware.test.js` (AMÉLIORER)

Ajouter ces tests manquants :

```javascript
describe("requireAuth - Chemins d'erreur", () => {
  it("devrait retourner 401 si le token est manquant", async () => {
    const response = await request(app)
      .get("/api/dashboard/stats")
      .expect(401);

    expect(response.body.message).toBe("Missing token");
  });

  it("devrait retourner 401 si le token est invalide", async () => {
    const response = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(response.body.message).toBe("Token invalide");
  });

  it("devrait retourner 401 si le token est expiré", async () => {
    // Créer un token expiré
    const expiredToken = jwt.sign(
      { sub: "user-id", role: "AGENT" },
      process.env.JWT_SECRET,
      { expiresIn: "-1h" }
    );

    const response = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body.message).toBe("Token invalide");
  });

  it("devrait retourner 401 si l'utilisateur est inactif", async () => {
    // Créer un utilisateur inactif
    const inactiveUser = await prisma.user.create({
      data: {
        email: "inactive@test.com",
        password: "hashed",
        firstName: "Inactive",
        lastName: "User",
        role: "AGENT",
        isActive: false,
      },
    });

    const token = tokenService.generateAccessToken({
      sub: inactiveUser.id,
      role: inactiveUser.role,
    });

    const response = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);

    expect(response.body.message).toBe("Invalid token");

    // Nettoyer
    await prisma.user.delete({ where: { id: inactiveUser.id } });
  });

  it("devrait retourner 401 si l'utilisateur n'existe plus", async () => {
    // Créer un token pour un utilisateur supprimé
    const deletedUserId = "deleted-user-id";
    const token = tokenService.generateAccessToken({
      sub: deletedUserId,
      role: "AGENT",
    });

    const response = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);

    expect(response.body.message).toBe("Invalid token");
  });
});

describe("requireMobileAuth", () => {
  it("devrait accepter un token mobile valide", async () => {
    const parent = await prisma.user.create({
      data: {
        email: "parent-mobile@test.com",
        password: "hashed",
        firstName: "Parent",
        lastName: "Mobile",
        role: "PARENT",
        phone: "+221701234567",
        isActive: true,
      },
    });

    const token = tokenService.generateMobileToken({
      sub: parent.id,
      role: parent.role,
    });

    const response = await request(app)
      .get("/api/mobile/calendar")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    // Nettoyer
    await prisma.user.delete({ where: { id: parent.id } });
  });

  it("devrait rejeter un token non-mobile", async () => {
    const agent = await prisma.user.create({
      data: {
        email: "agent-mobile@test.com",
        password: "hashed",
        firstName: "Agent",
        lastName: "Mobile",
        role: "AGENT",
        isActive: true,
      },
    });

    const token = tokenService.generateAccessToken({
      sub: agent.id,
      role: agent.role,
    });

    const response = await request(app)
      .get("/api/mobile/calendar")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);

    // Nettoyer
    await prisma.user.delete({ where: { id: agent.id } });
  });
});
```

---

## 5. Tests pour emailService.js

**Fichier**: `tests/unit/emailService.test.js` (NOUVEAU)

```javascript
const nodemailer = require("nodemailer");
const { sendStockExpirationAlert, sendAppointmentReminder } = require("../../src/services/emailService");

// Mock nodemailer
jest.mock("nodemailer");

describe("emailService", () => {
  let mockTransporter;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({
        messageId: "test-message-id",
      }),
    };

    nodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("sendStockExpirationAlert", () => {
    it("devrait envoyer un email d'alerte d'expiration", async () => {
      const agent = {
        email: "agent@test.com",
        firstName: "Test",
        lastName: "Agent",
      };

      const lots = [
        {
          vaccine: { name: "Test Vaccine" },
          expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          remainingQuantity: 50,
        },
      ];

      const result = await sendStockExpirationAlert(agent, lots);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: agent.email,
          subject: expect.stringContaining("expiration"),
        })
      );
    });

    it("devrait gérer les erreurs d'envoi", async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error("SMTP Error"));

      const agent = {
        email: "agent@test.com",
        firstName: "Test",
        lastName: "Agent",
      };

      const lots = [
        {
          vaccine: { name: "Test Vaccine" },
          expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          remainingQuantity: 50,
        },
      ];

      const result = await sendStockExpirationAlert(agent, lots);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("sendAppointmentReminder", () => {
    it("devrait envoyer un rappel de rendez-vous", async () => {
      const parent = {
        email: "parent@test.com",
        firstName: "Parent",
        lastName: "Test",
      };

      const appointment = {
        child: {
          firstName: "Child",
          lastName: "Test",
        },
        vaccine: {
          name: "Test Vaccine",
        },
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const result = await sendAppointmentReminder(parent, appointment);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: parent.email,
          subject: expect.stringContaining("rendez-vous"),
        })
      );
    });
  });
});
```

---

## 6. Tests pour errorHandler.js

**Fichier**: `tests/unit/errorHandler.test.js` (NOUVEAU)

```javascript
const errorHandler = require("../../src/middleware/errorHandler");

describe("errorHandler", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe("Erreurs Prisma", () => {
    it("devrait gérer P2002 (contrainte unique) pour email", () => {
      const error = {
        code: "P2002",
        meta: {
          target: ["email"],
          modelName: "User",
        },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Cet email est déjà utilisé. Veuillez utiliser un autre email.",
        })
      );
    });

    it("devrait gérer P2002 pour phone", () => {
      const error = {
        code: "P2002",
        meta: {
          target: ["phone"],
          modelName: "User",
        },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Ce numéro de téléphone est déjà utilisé. Veuillez utiliser un autre numéro.",
        })
      );
    });

    it("devrait gérer P2002 pour ChildVaccineScheduled", () => {
      const error = {
        code: "P2002",
        meta: {
          modelName: "ChildVaccineScheduled",
        },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("rendez-vous existe déjà"),
        })
      );
    });

    it("devrait gérer P2025 (enregistrement non trouvé)", () => {
      const error = {
        code: "P2025",
        meta: {
          modelName: "User",
        },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("non trouvé"),
        })
      );
    });
  });

  describe("Erreurs JWT", () => {
    it("devrait gérer les erreurs JWT expiré", () => {
      const error = {
        name: "TokenExpiredError",
        message: "jwt expired",
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Token expiré",
        })
      );
    });

    it("devrait gérer les erreurs JWT invalide", () => {
      const error = {
        name: "JsonWebTokenError",
        message: "invalid token",
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Token invalide",
        })
      );
    });
  });

  describe("Erreurs génériques", () => {
    it("devrait utiliser le status de l'erreur si défini", () => {
      const error = {
        status: 400,
        message: "Bad request",
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Bad request",
        })
      );
    });

    it("devrait utiliser 500 par défaut", () => {
      const error = {
        message: "Internal error",
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Internal error",
        })
      );
    });
  });
});
```

---

## 7. Tests pour permissions.js

**Fichier**: `tests/unit/permissions.test.js` (NOUVEAU)

```javascript
const { hasRole, requireRole } = require("../../src/utils/permissions");

describe("permissions", () => {
  describe("hasRole", () => {
    it("devrait retourner true si l'utilisateur a le rôle requis", () => {
      const user = { role: "AGENT" };
      expect(hasRole(user, "AGENT")).toBe(true);
    });

    it("devrait retourner false si l'utilisateur n'a pas le rôle requis", () => {
      const user = { role: "AGENT" };
      expect(hasRole(user, "REGIONAL")).toBe(false);
    });

    it("devrait retourner true si l'utilisateur est SUPERADMIN", () => {
      const user = { role: "SUPERADMIN" };
      expect(hasRole(user, "AGENT")).toBe(true);
      expect(hasRole(user, "REGIONAL")).toBe(true);
      expect(hasRole(user, "NATIONAL")).toBe(true);
    });

    it("devrait accepter un tableau de rôles", () => {
      const user = { role: "AGENT" };
      expect(hasRole(user, ["AGENT", "REGIONAL"])).toBe(true);
      expect(hasRole(user, ["REGIONAL", "DISTRICT"])).toBe(false);
    });

    it("devrait retourner false si l'utilisateur est null", () => {
      expect(hasRole(null, "AGENT")).toBe(false);
    });

    it("devrait retourner false si l'utilisateur n'a pas de rôle", () => {
      const user = {};
      expect(hasRole(user, "AGENT")).toBe(false);
    });
  });

  describe("requireRole", () => {
    it("devrait appeler next() si l'utilisateur a le rôle requis", () => {
      const middleware = requireRole("AGENT");
      const req = { user: { role: "AGENT" } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("devrait retourner 401 si l'utilisateur n'est pas authentifié", () => {
      const middleware = requireRole("AGENT");
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Non authentifié",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("devrait retourner 403 si l'utilisateur n'a pas le rôle requis", () => {
      const middleware = requireRole("REGIONAL");
      const req = { user: { role: "AGENT" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Accès refusé",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
```

---

## 8. Compléter les tests de stockController.js

**Fichier**: `tests/unit/stockController.test.js` (AMÉLIORER)

Ajouter des tests pour les fonctions manquantes :

```javascript
describe("stockController - Fonctions manquantes", () => {
  describe("reduceStockNATIONAL", () => {
    it("devrait réduire le stock national", async () => {
      // Test à implémenter
    });
  });

  describe("reduceStockREGIONAL", () => {
    it("devrait réduire le stock régional", async () => {
      // Test à implémenter
    });
  });

  describe("deleteStockREGIONAL", () => {
    it("devrait supprimer le stock régional", async () => {
      // Test à implémenter
    });
  });

  // ... autres fonctions manquantes
});
```

---

## 📝 Notes Importantes

1. **Mocking**: Utilisez `jest.mock()` pour mocker les dépendances externes (SMTP, Twilio, etc.)
2. **Nettoyage**: Toujours nettoyer les données de test après chaque test
3. **Transactions**: Utilisez des transactions Prisma pour isoler les tests
4. **Coverage**: Vérifiez la couverture après chaque ajout de tests avec `npm run test:coverage`

---

## 🎯 Prochaines Étapes

1. Créer les fichiers de tests manquants
2. Exécuter les tests et vérifier la couverture
3. Ajuster les tests si nécessaire
4. Vérifier que `coverageThreshold` est respecté
