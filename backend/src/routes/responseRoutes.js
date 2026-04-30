const express = require("express");
const { getNextResponse } = require("../controllers/responseController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/next", getNextResponse);

module.exports = router;
