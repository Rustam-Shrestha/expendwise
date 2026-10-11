const express = require("express");
const router = express.Router();   
const {protectRoute} = require("../middleware/protectRoute");

const {addTransaction,getTransaction} = require("../controllers/transaction.controller")

router.get("/gettransaction",protectRoute,getTransaction);
router.post("/addtransaction",protectRoute,addTransaction);

module.exports = router;