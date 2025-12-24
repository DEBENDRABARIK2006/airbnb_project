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

// Use environment variables for flexibility
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const MONGO_URL = process.env.MONGO_URL;

// 1. CORS Middleware
app.use(cors({
  origin: FRONTEND_URL, 
  credentials: true,
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Trust proxy is REQUIRED for Vercel/Render deployments to handle cookies correctly
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
    // Automatically set to true if on production (HTTPS)
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000, 
  },
}));

// 3. Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// 4. Standard Routes
app.use(authrouter);
app.use(hostrouter);
app.use(userrouter);
app.use(favouriterouter);

// 5. Google OAuth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => {
    req.session.isauth = true;
    req.session.userid = req.user.id;
    req.session.user = {
      id: req.user.id,
      email: req.user.email,
      usertype: req.user.usertype 
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect(`${FRONTEND_URL}/login`);
      }
      res.redirect(FRONTEND_URL); 
    });
  }
);

// 6. GitHub OAuth Routes
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => {
    req.session.isauth = true;
    req.session.userid = req.user.id;
    req.session.user = {
      id: req.user.id,
      email: req.user.email,
      usertype: req.user.usertype
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect(`${FRONTEND_URL}/login`);
      }
      res.redirect(FRONTEND_URL);
    });
  }
);

// 7. Database Connection
const port = process.env.PORT || 3004;

mongoose.connect(MONGO_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    // Only listen if not in a serverless environment like Vercel (optional check)
    if (process.env.NODE_ENV !== 'production') {
        app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));
    }
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Export for Vercel
module.exports = app;