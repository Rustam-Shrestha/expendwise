const express = require("express");
const router = express.Router();
const {signup,login} = require("../controllers/user.controller")

const logout = (req, res) => {
  res.clearCookie("jwt");
  res.status(200).json({ success: true });
};

router.post('/auth/signup',signup)
router.post('/auth/login',login)
router.post('/auth/logout',logout)

module.exports = router;