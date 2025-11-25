const { Router } = require("express");
const districtController = require("../controllers/districtController");
const { requireAuth } = require("../middleware/auth");

const router = Router();

router.get("/", requireAuth, districtController.listDistricts);
router.post("/", requireAuth, districtController.createDistrict);
router.put("/:id", requireAuth, districtController.updateDistrict);
router.delete("/:id", requireAuth, districtController.deleteDistrict);

module.exports = router;