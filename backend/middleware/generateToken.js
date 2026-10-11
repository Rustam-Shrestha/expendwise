const jwt = require("jsonwebtoken");

const generateTokenAndSetCookie = (userId, res) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    if (res && res.cookie) {
      res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });
    }

    return token;
  } catch (err) {
    console.error("Error generating token:", err.message);
    return null;
  }
};

module.exports = generateTokenAndSetCookie;