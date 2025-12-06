const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },

  resetCode: { type: String },
  resetCodeExpiration: { type: Date }
});

module.exports = mongoose.model("User", userSchema);
