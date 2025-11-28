const { Router } = require("express");
const mobileController = require("../controllers/mobileController");

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

module.exports = router;

