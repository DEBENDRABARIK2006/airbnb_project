const express=require("express");
const authrouter=express.Router();
const authcontroller=require("../controller/authcontroller")
const {check} =require("express-validator");

authrouter.get("/login",authcontroller.getlogin)
authrouter.post("/login",authcontroller.postlogin)
authrouter.get("/signup",authcontroller.getsignup);
authrouter.post("/signup",
  [
    check("firstname").trim().notEmpty().withMessage("first name is required"),
    check("lastname").trim().notEmpty().withMessage("last name is required"),
    check("email").isEmail().withMessage("enter a valid email").normalizeEmail(),
    check("password").isLength({min:6}).withMessage("password must be 6 character"),
    check("confirmpassword").custom((value, { req }) => value === req.body.password).withMessage("Passwords do not match"),
    check("usertype").isIn(["guest", "host"]).withMessage("Select guest or host"),
    check("terms")
      .custom((value) => value === true)
      .withMessage("You must accept terms and conditions"),
  ],
authcontroller.postsignup
);
authrouter.get("/logout",authcontroller.getlogout);

authrouter.get("/current-user", authcontroller.getCurrentUser);

// Reset Password (email-based, no auth required)
authrouter.post('/reset-password', 
  [
    check('email').isEmail().withMessage('Valid email required'),
    check('oldPassword').notEmpty().withMessage('Old password required'),
    check('newPassword').isLength({ min: 6 }).withMessage('New password must be 6+ chars'),
    check('confirmPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('Passwords must match')
  ],
  authcontroller.postResetPassword
);

// Forgot Password - Send OTP
authrouter.post('/forgot-password/send-otp', authcontroller.postForgotPasswordSendOTP);

// Forgot Password - Verify OTP & Reset
authrouter.post('/forgot-password/verify-otp', authcontroller.postForgotPasswordVerifyOTP);


module.exports=authrouter