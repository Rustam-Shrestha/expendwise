const express = require("express");
const router = express.Router();
const { clusterUsers, getFinancialAdvice } = require("../controllers/kmeans.controller");
const { protectRoute } = require("../middleware/protectRoute");

router.get("/cluster-users", protectRoute, clusterUsers);
router.get("/financial-advice", protectRoute, getFinancialAdvice);

module.exports = router;
