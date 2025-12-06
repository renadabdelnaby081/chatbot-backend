const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../model/User");
const nodemailer = require("nodemailer");

const router = express.Router();

// Password validation
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|:;"'<>,.?/]).{8,}$/;

// Email sender
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ---------------------- SIGNUP ----------------------
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, dateOfBirth } = req.body;

    if (!fullName || !email || !password || !dateOfBirth)
      return res.status(400).json({ message: "All fields are required" });

    if (!passwordRegex.test(password))
      return res.status(400).json({
        message:
          "Password must include 1 uppercase, 1 lowercase, 1 number, 1 symbol, 8+ characters",
      });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      dateOfBirth,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------- LOGIN ----------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Incorrect email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Incorrect email or password" });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------- FORGOT PASSWORD ----------------------
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "No account with this email" });

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetCode = resetCode;
  user.resetCodeExpiration = Date.now() + 10 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Password Reset Code",
    text: `Your reset code is: ${resetCode}`,
  });

  res.json({ message: "Reset code sent" });
});

// ---------------------- VERIFY CODE ----------------------
router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  if (user.resetCode !== code)
    return res.status(400).json({ message: "Wrong code" });

  if (user.resetCodeExpiration < Date.now())
    return res.status(400).json({ message: "Code expired" });

  res.json({ message: "Code verified" });
});

// ---------------------- RESET PASSWORD ----------------------
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  const hashed = await bcrypt.hash(newPassword, 10);

  await User.updateOne(
    { email },
    {
      password: hashed,
      resetCode: null,
      resetCodeExpiration: null,
    }
  );

  res.json({ message: "Password reset successful" });
});

module.exports = router;
