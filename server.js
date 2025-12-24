const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();

// ------------------- Trust Proxy -------------------
// مهم لو السيرفر ورا Proxy زي Railway
app.set('trust proxy', 1);

// ------------------- Middlewares -------------------
app.use(cors());
app.use(express.json());

// ------------------- Rate Limiting -------------------

// منع سبام التسجيل
const registerLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 دقيقة
  max: 5,
  message: {
    status: "error",
    message: "Too many registration attempts, please try again later."
  }
});

// منع سبام تسجيل الدخول
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
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
