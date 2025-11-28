const { Router } = require("express");
const childrenController = require("../controllers/childrenController");
const { requireAuth } = require("../middleware/auth");

const router = Router();

router.post("/", requireAuth, childrenController.createChildren);
router.get("/parents", requireAuth, childrenController.getParentsOverview);
router.get("/:id/vaccinations", requireAuth, childrenController.getChildVaccinations);
router.put("/:id", requireAuth, childrenController.updateChildren);
router.delete("/:id", requireAuth, childrenController.deleteChild);
router.get("/", requireAuth, childrenController.getChildren);



module.exports = router;