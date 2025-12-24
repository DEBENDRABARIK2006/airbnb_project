const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/user'); // Adjust path to your User model

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// --- GOOGLE STRATEGY ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3004/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 1. Check if user exists by Email (or OAuth ID)
      let user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // If user exists but no OAuth ID, update it (Link accounts)
        if (!user.oauthId) {
            user.oauthProvider = 'google';
            user.oauthId = profile.id;
            await user.save();
        }
        return done(null, user);
      }

      // 2. If no user, Create New
      user = new User({
        firstname: profile.name.givenName || 'Google',
        lastname: profile.name.familyName || 'User',
        email: profile.emails[0].value,
        usertype: 'guest', // ✅ CRITICAL: Default to guest
        oauthProvider: 'google',
        oauthId: profile.id,
        emailVerified: true
      });

      await user.save();
      done(null, user);
    } catch (err) {
      console.error("Google Auth Error:", err);
      done(err, null);
    }
  }
));

// --- GITHUB STRATEGY ---
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3004/auth/github/callback",
    scope: [ 'user:email' ] // Request email permission
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // GitHub emails can be private/multiple. Find the primary one.
      const email = profile.emails && profile.emails.find(e => e.primary || e.verified)?.value;
      
      if (!email) {
        return done(new Error("No public email found on GitHub account"), null);
      }

      let user = await User.findOne({ email: email });

      if (user) {
        if (!user.oauthId) {
            user.oauthProvider = 'github';
            user.oauthId = profile.id;
            await user.save();
        }
        return done(null, user);
      }

      // Handle Name Splitting (GitHub returns full name string)
      const nameParts = (profile.displayName || profile.username).split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

      user = new User({
        firstname: firstName,
        lastname: lastName,
        email: email,
        usertype: 'guest', // ✅ CRITICAL: Default to guest
        oauthProvider: 'github',
        oauthId: profile.id,
        emailVerified: true
      });

      await user.save();
      done(null, user);
    } catch (err) {
      console.error("GitHub Auth Error:", err);
      done(err, null);
    }
  }
));