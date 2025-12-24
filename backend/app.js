const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const passport = require('passport'); 
require("dotenv").config();

require('./config/passport'); 

const hostrouter = require("./routes/hostrouter");
const authrouter = require("./routes/authrouter");
const userrouter = require("./routes/userrouter");
const favouriterouter = require("./routes/favouriterouter");

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const MONGO_URL = process.env.MONGO_URL;

// 1. CORS Middleware - CRITICAL for Axios
app.use(cors({
  origin: FRONTEND_URL, 
  credentials: true, // Allows Axios to send cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Required for Vercel to trust the HTTPS connection headers
app.set("trust proxy", 1);

// 2. Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "fallback_secret", 
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URL,
  }),
  cookie: {
    httpOnly: true,
    // On Vercel (Production), secure MUST be true
    secure: process.env.NODE_ENV === "production", 
    // On Vercel, sameSite MUST be "none" for cross-domain cookies
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000, 
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// 3. Routes
app.use(authrouter);
app.use(hostrouter);
app.use(userrouter);
app.use(favouriterouter);

// Helper for OAuth Redirects
const handleOAuthCallback = (req, res) => {
  req.session.isauth = true;
  req.session.userid = req.user.id;
  req.session.user = {
    id: req.user.id,
    email: req.user.email,
    usertype: req.user.usertype 
  };

  req.session.save((err) => {
    if (err) return res.redirect(`${FRONTEND_URL}/login`);
    res.redirect(FRONTEND_URL); 
  });
};

// OAuth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login` }), handleOAuthCallback);

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/login` }), handleOAuthCallback);

// 4. Database Connection
const port = process.env.PORT || 3004;

mongoose.connect(MONGO_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    if (process.env.NODE_ENV !== 'production') {
        app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));
    }
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

module.exports = app;