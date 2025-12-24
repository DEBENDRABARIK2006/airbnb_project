const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userschema = mongoose.Schema({
  firstname: { type: String, required: true },
  middlename: { type: String },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, sparse: true, unique: true },
  password: { type: String }, // Not required for OAuth
  
  // ✅ UPDATE: Add default 'guest' so OAuth doesn't fail
  usertype: { type: String, enum: ["host", "guest"], default: "guest", required: true },
  
  favourite: [{ type: mongoose.Schema.Types.ObjectId, ref: "Home" }],
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  emailOtp: { type: String },
  phoneOtp: { type: String },
  otpExpiresAt: { type: Date },
  oauthProvider: { type: String }, 
  oauthId: { type: String },
});

userschema.pre("save", async function (next) {
  // ✅ FIX: Only hash password if it exists (OAuth users have no password)
  if (!this.isModified("password") || !this.password) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("User", userschema);