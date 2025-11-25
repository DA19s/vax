const { Router } = require("express");
const childrenController = require("../controllers/childrenController");
const { requireAuth } = require("../middleware/auth");

const router = Router();

router.post("/", childrenController.createChildren);
router.get("/parents", requireAuth, childrenController.getParentsOverview);
router.get("/:id/vaccinations", requireAuth, childrenController.getChildVaccinations);
router.put("/:id", requireAuth, childrenController.updateChildren);
router.get("/", requireAuth, childrenController.getChildren);



module.exports = router;