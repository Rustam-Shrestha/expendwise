const jwt = require("jsonwebtoken");
const User = require("../model/User");

const protectRoute = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : req.cookies.jwt;
    if (!token) return res.status(401).json({ error: "Unauthorized - No Token Provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(401).json({ error: "Unauthorized - User not found" });
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { protectRoute };
