const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();

// تأكد من trust proxy قبل أي middleware آخر
app.set("trust proxy", 1); // استخدم 1 بدل true لتكون أكثر تحديداً

app.use(cors());
app.use(express.json());

// Rate limiter للتسجيل
const registerLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 دقيقة
  max: 5, // 5 محاولات كحد أقصى
  standardHeaders: true, // إرجاع معلومات Rate limit في ال headers
  legacyHeaders: false, // عدم استخدام headers القديمة
  skipFailedRequests: true, // تجاهل الطلبات الفاشلة من العد
  message: {
    status: "error",
    message: "Too many registration attempts, please try again later."
  }
  // تم إزالة keyGenerator ليعمل تلقائياً مع trust proxy
});

// Rate limiter لتسجيل الدخول
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 دقيقة
  max: 10, // 10 محاولات كحد أقصى
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true, // تجاهل الطلبات الفاشلة من العد
  message: {
    status: "error",
    message: "Too many login attempts, slow down."
  }
  // تم إزالة keyGenerator ليعمل تلقائياً مع trust proxy
});

// تطبيق rate limiters على المسارات المحددة
app.use("/api/auth/register", registerLimiter);
app.use("/api/auth/login", loginLimiter);

// مسارات المصادقة
app.use("/api/auth", authRoutes);

// مسار للتحقق من حالة السيرفر
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// معالجة المسارات غير الموجودة
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found"
  });
});

// معالجة الأخطاء العامة
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// الاتصال بقاعدة البيانات وتشغيل السيرفر
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // إغلاق التطبيق في حالة فشل الاتصال بقاعدة البيانات
  });

module.exports = app; // لسهولة الاختبار