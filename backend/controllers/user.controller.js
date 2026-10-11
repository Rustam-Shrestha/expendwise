const User = require("../model/User");
const bcrypt = require("bcryptjs");
const generateTokenAndSetCookie = require("../middleware/generateToken");

const signup = async (req, res) => {
  try {
    const { email, userName, password, fullName } = req.body;
    if (!email || !userName || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const cleanEmail = email.toLowerCase().trim();
    const cleanUserName = userName.trim();

    if (await User.findOne({ $or: [{ email: cleanEmail }, { userName: cleanUserName }] })) {
      return res.status(409).json({ error: "User already exists with this email or username" });
    }

    const user = await User.create({
      email: cleanEmail,
      userName: cleanUserName,
      fullName: (fullName && fullName.trim()) || cleanUserName,
      password: await bcrypt.hash(password, 10),
    });

    const token = generateTokenAndSetCookie(user._id, res);
    return res.status(201).json({
      _id: user._id,
      userName: user.userName,
      email: user.email,
      fullName: user.fullName,
      token,
    });
  } catch (error) {
    console.error("Error in signup controller", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateTokenAndSetCookie(user._id, res);
    return res.status(200).json({
      _id: user._id,
      userName: user.userName,
      email: user.email,
      fullName: user.fullName,
      token,
    });
  } catch (error) {
    console.error("Error in login controller", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { signup, login };
