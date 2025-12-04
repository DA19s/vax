const { Router } = require("express");
const vaccinationProofController = require("../controllers/vaccinationProofController");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// Récupérer un fichier de preuve
router.get(
  "/:proofId/file",
  requireAuth,
  vaccinationProofController.getProofFile,
);

// Supprimer une preuve
router.delete(
  "/:proofId",
  requireAuth,
  vaccinationProofController.deleteProof,
);

module.exports = router;

