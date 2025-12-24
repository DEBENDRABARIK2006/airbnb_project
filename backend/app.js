const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const passport = require('passport'); 
require("dotenv").config();

// Ensure you have created this file as per previous instructions
require('./config/passport'); 

const hostrouter = require("./routes/hostrouter");
const authrouter = require("./routes/authrouter");
const userrouter = require("./routes/userrouter");
const favouriterouter = require("./routes/favouriterouter");

const app = express();

// 1. CORS Middleware (Must be first)
app.use(cors({
  origin: "http://localhost:5173", // Your Frontend URL
  credentials: true,
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 2. Session Middleware
app.use(session({
  secret: "supersecretkey", // In production, use process.env.SESSION_SECRET
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: "mongodb+srv://debendrabarik083_db_user:DEBENDRABARIK%407608@debendramongodb.pdmb6jx.mongodb.net/airbnbproject",
  }),
  cookie: {
    httpOnly: true,
    secure: false, // Set to true if using HTTPS in production
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// 3. Passport Middleware (Must be after session)
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
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
  (req, res) => {
    // Manually set session data for your specific app logic
    req.session.isauth = true;
    req.session.userid = req.user.id;
    req.session.user = {
      id: req.user.id,
      email: req.user.email,
      usertype: req.user.usertype // Defaults to 'guest' via User model
    };

    // FORCE SAVE session before redirecting to ensure cookie is set
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect('http://localhost:5173/login');
      }
      res.redirect('http://localhost:5173'); 
    });
  }
);

// 6. GitHub OAuth Routes
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: 'http://localhost:5173/login' }),
  (req, res) => {
    req.session.isauth = true;
    req.session.userid = req.user.id;
    req.session.user = {
      id: req.user.id,
      email: req.user.email,
      usertype: req.user.usertype
    };

    // FORCE SAVE session before redirecting
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect('http://localhost:5173/login');
      }
      res.redirect('http://localhost:5173');
    });
  }
);

// 7. Database Connection & Server Start
const mongourl = "mongodb+srv://debendrabarik083_db_user:DEBENDRABARIK%407608@debendramongodb.pdmb6jx.mongodb.net/airbnbproject?retryWrites=true&w=majority&appName=debendramongodb";
const port = 3004;

mongoose.connect(mongourl)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));