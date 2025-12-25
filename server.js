const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();

// ------------------- Middlewares -------------------
app.use(cors());
app.use(express.json());

// ------------------- Rate Limiting -------------------

const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  validate: { xForwardedForHeader: false }, // 👈 الحل القاطع
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many registration attempts, please try again later."
  }
});

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  validate: { xForwardedForHeader: false }, // 👈 الحل القاطع
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many login attempts, slow down."
  }
});

app.use("/api/auth/register", registerLimiter);
app.use("/api/auth/login", loginLimiter);

// ------------------- Routes -------------------
app.use("/api/auth", authRoutes);

// ------------------- MongoDB Connection -------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
