const { Router } = require("express");
const mobileController = require("../controllers/mobileController");
const { requireMobileAuth } = require("../middleware/auth");

const router = Router();

// Demande de code de vérification
router.post("/request-verification-code", mobileController.requestVerificationCode);

// Inscription parent/enfant (après vérification du code)
router.post("/parent-register", mobileController.parentRegister);

// Vérification du code d'accès
router.post("/verify-access-code", mobileController.verifyAccessCode);

// Connexion avec numéro + PIN
router.post("/parent-login", mobileController.parentLogin);

// Gestion du PIN
router.post("/parent-pin/save", mobileController.saveParentPin);
router.post("/parent-pin/verify", mobileController.verifyParentPin);

// Marquer les vaccins comme effectués
router.post("/children/:childId/mark-vaccines-done", mobileController.markVaccinesDone);

// Obtenir la liste des régions (pour les parents)
router.get("/regions", mobileController.getRegions);

// Obtenir la liste des centres de santé (pour les parents)
router.get("/health-centers", mobileController.getHealthCenters);

// Obtenir le calendrier vaccinal (pour les parents)
router.get("/vaccine-calendar", mobileController.getVaccineCalendar);

// Obtenir le dashboard d'un enfant (nécessite authentification)
router.get("/children/:childId/dashboard", requireMobileAuth, mobileController.getChildDashboard);

// Obtenir les conseils (optionnel: filtrer par âge de l'enfant)
router.get("/advice", mobileController.getAdvice);

// Obtenir les campagnes de vaccination
router.get("/campaigns", mobileController.getCampaigns);

// Obtenir les rendez-vous d'un enfant (nécessite authentification)
router.get("/children/:childId/appointments", requireMobileAuth, mobileController.getAppointments);

// Obtenir le calendrier vaccinal d'un enfant (nécessite authentification)
router.get("/children/:childId/calendar", requireMobileAuth, mobileController.getCalendar);

// Obtenir les notifications d'un enfant (nécessite authentification)
router.get("/children/:childId/notifications", requireMobileAuth, mobileController.getNotifications);

// Marquer toutes les notifications comme lues (nécessite authentification)
router.put("/children/:childId/notifications/mark-all-read", requireMobileAuth, mobileController.markAllNotificationsAsRead);

// Créer une demande de vaccin (nécessite authentification)
router.post("/children/:childId/vaccine-requests", requireMobileAuth, require("../controllers/vaccineRequestController").createVaccineRequest);

module.exports = router;

