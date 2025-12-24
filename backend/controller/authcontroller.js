// controller/authcontroller.js
const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// --- SIGNUP ---
exports.getsignup = (req, res, next) => {
  res.json({
    errors: [],
    oldinput: { firstname: "", middlename: "", lastname: "", email: "", usertype: "", terms: false },
  });
};

exports.postsignup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((err) => err.msg),
      oldinput: req.body,
    });
  }

  try {
    const { firstname, middlename, lastname, email, password, usertype, terms } = req.body;
    
    // Create User (Pre-save hook in model will hash password)
    const user = new User({ firstname, middlename, lastname, email, password, usertype, terms });
    await user.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return res.status(400).json({ errors: ["Email already in use"] });
    }
    console.error("Signup Error:", err);
    res.status(500).json({ errors: ["Internal Server Error"] });
  }
};

// --- LOGIN ---
exports.getlogin = (req, res, next) => {
  res.json({ errormessage: null });
};

exports.postlogin = async (req, res, next) => {
  try {
    const { username: email, password } = req.body;
    const userdata = await User.findOne({ email });

    if (!userdata) {
      return res.status(400).json({ errormessage: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, userdata.password);
    if (!valid) {
      return res.status(400).json({ errormessage: "Invalid email or password" });
    }

    req.session.isauth = true;
    req.session.user = { id: userdata._id, email: userdata.email, usertype: userdata.usertype };
    
    res.status(200).json({
      message: "Login successful",
      user: req.session.user,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
};

// --- LOGOUT ---
exports.getlogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) console.error("Session destroy error:", err);
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
};

// --- AUTH GUARDS ---
exports.isauth = (req, res, next) => {
  if (req.session && req.session.isauth) return next();
  res.status(401).json({ errormessage: "Not authenticated" });
};

exports.ishost = (req, res, next) => {
  if (req.session && req.session.isauth && req.session.user.usertype === "host") return next();
  res.status(403).json("Access denied: Only hosts allowed");
};

exports.isguest = (req, res, next) => {
  if (req.session && req.session.isauth && req.session.user.usertype === "guest") return next();
  res.status(403).json("Access denied: Only guests allowed");
};

exports.getCurrentUser = (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({ user: req.session.user });
  }
  res.status(200).json({ user: null });
};

// --- PASSWORD RESET (Logged In) ---
exports.postResetPassword = async (req, res, next) => {
  try {
    const { email, oldPassword, newPassword, confirmPassword } = req.body;

    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Account not found' });

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) return res.status(400).json({ error: 'Old password incorrect' });

    user.password = newPassword; 
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// --- FORGOT PASSWORD (OTP) - STEP 1 ---
// controller/authcontroller.js (Partial Update)

exports.postForgotPasswordSendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // 1. Find User
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Account not found with this email' });

    // 2. Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    user.emailOtp = otp;
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    // 3. Configure Nodemailer (More Robust Settings)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Keep this, but sometimes 'host' is safer
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'debendrabarik083@gmail.com', 
        pass: 'mlcz xwki ljdr eikl' // Ensure this App Password is active
      },
      tls: {
        rejectUnauthorized: false // Fixes some localhost SSL issues
      }
    });

    // 4. Send Mail
    await transporter.sendMail({
      from: '"Airbnb Support" <debendrabarik083@gmail.com>',
      to: email,
      subject: 'Airbnb Password Reset OTP',
      text: `Your OTP is ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>Your One-Time Password (OTP) is:</p>
          <h1 style="color: #FF385C; letter-spacing: 5px;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
        </div>
      `
    });
    console.log("--------------------------------");
    console.log(`Bypassing Email. The OTP for ${email} is: ${otp}`);
    console.log("--------------------------------");

    res.json({ message: 'OTP generated (Check server console)' });
    console.log(`✅ OTP sent to ${email}`);
    res.json({ message: 'OTP sent successfully!' });

  } catch (err) {
    console.error("❌ Mail Send Error:", err); // CHECK THIS IN YOUR TERMINAL
    res.status(500).json({ error: 'Failed to send email. Check backend console for details.' });
  }
};

// --- FORGOT PASSWORD (OTP) - STEP 2 ---
exports.postForgotPasswordVerifyOTP = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Find user with matching Email, OTP, and check if OTP is not expired
    const user = await User.findOne({ 
      email: email, 
      emailOtp: otp,
      otpExpiresAt: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new one.' });
    }

    // Update Password
    user.password = newPassword; // Pre-save hook will hash this
    user.emailOtp = undefined;   // Clear OTP
    user.otpExpiresAt = undefined;
    
    await user.save();

    res.json({ message: 'Password reset successfully. Please login with new password.' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Server error during verification' });
  }
};