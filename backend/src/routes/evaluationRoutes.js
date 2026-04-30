const express = require("express");
const { saveEvaluation, getDashboard } = require("../controllers/evaluationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getDashboard);
router.post("/", saveEvaluation);

module.exports = router;
