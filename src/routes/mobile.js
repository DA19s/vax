const { Router } = require("express");
const mobileController = require("../controllers/mobileController");
const vaccinationProofController = require("../controllers/vaccinationProofController");
const { requireMobileAuth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = Router();

// Configuration multer pour les preuves de vaccination (mobile)
const proofUploadDir = path.join(__dirname, "../../uploads/vaccination-proofs");
if (!fs.existsSync(proofUploadDir)) {
  fs.mkdirSync(proofUploadDir, { recursive: true });
}

const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, proofUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const proofUpload = multer({
  storage: proofStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Type de fichier non autorisé. Types autorisés: JPEG, PNG, WebP, PDF`,
        ),
        false,
      );
    }
  },
});

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
router.post("/parent-pin/request-change-code", requireMobileAuth, mobileController.requestChangePinCode);
router.post("/parent-pin/change", requireMobileAuth, mobileController.changeParentPin);

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

// Obtenir le nombre de notifications non lues (nécessite authentification)
router.get(
  "/children/:childId/notifications/unread-count",
  requireMobileAuth,
  mobileController.getUnreadNotificationCount,
);

// Marquer toutes les notifications comme lues (nécessite authentification)
router.put("/children/:childId/notifications/mark-all-read", requireMobileAuth, mobileController.markAllNotificationsAsRead);

// Créer une demande de vaccin (nécessite authentification)
router.post("/children/:childId/vaccine-requests", requireMobileAuth, require("../controllers/vaccineRequestController").createVaccineRequest);

// Upload de preuves de vaccination (nécessite authentification)
router.post(
  "/children/:childId/vaccination-proofs",
  requireMobileAuth,
  proofUpload.array("files", 10), // Maximum 10 fichiers
  vaccinationProofController.uploadVaccinationProofs,
);

module.exports = router;

