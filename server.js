const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(cors());
app.use(express.json());

// ------------------- Rate Limiting -------------------

// منع سبّام التسجيل
const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    status: "error",
    message: "Too many registration attempts, please try again later."
  }
});

// منع سبّام تسجيل الدخول
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

app.use("/api/auth", authRoutes);

// ------------------- MongoDB Connection -------------------

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, () => {
      console.log("Server running on port", process.env.PORT || 5000);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
