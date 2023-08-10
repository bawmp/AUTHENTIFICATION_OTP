const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  OTP: { type: String },
  OTPCreatedTime: { type: Date },
  OTPAttempts: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  blockUntil: { type: Date },
  isOTPVerified: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String
  }
});

module.exports = mongoose.model("User", userSchema);
