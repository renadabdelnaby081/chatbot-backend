const express = require("express");
const router = express.Router();
const User = require("../models/User"); // ← هنا التعديل الصحيح
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// إرسال إيميل
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// إرسال ايميل
function sendEmail(to, subject, text) {
  return transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
  });
}

//////////////////////////////////////////////////////
// REGISTER
//////////////////////////////////////////////////////

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const hashedCode = await bcrypt.hash(verificationCode, 10);

    user.verificationCode = hashedCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق

    await user.save();

    await sendEmail(
      user.email,
      "Your Verification Code",
      `Your verification code is: ${verificationCode}`
    );

    res.json({ message: "User registered. Check your email for verification." });
  } catch (err) {
    res.status(500).json({ message: "Error in register", error: err.message });
  }
});

//////////////////////////////////////////////////////
// VERIFY EMAIL
//////////////////////////////////////////////////////

router.post("/verify", async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    if (Date.now() > user.verificationCodeExpires) {
      return res
        .status(400)
        .json({ message: "Verification code expired. Request a new one." });
    }

    const isMatch = await bcrypt.compare(code, user.verificationCode);

    if (!isMatch)
      return res.status(400).json({ message: "Incorrect verification code" });

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Verification error", error: err.message });
  }
});

//////////////////////////////////////////////////////
// LOGIN
//////////////////////////////////////////////////////

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    if (!user.isVerified)
      return res.status(400).json({ message: "Email not verified" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
});

module.exports = router;
