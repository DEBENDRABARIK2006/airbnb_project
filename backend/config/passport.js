const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/user');
const bcrypt = require('bcryptjs');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'dummy',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ 
      oauthId: profile.id, 
      oauthProvider: 'google' 
    });
    
    if (!user) {
      user = new User({
        firstname: profile.name.givenName || 'Google',
        lastname: profile.name.familyName || 'User',
        email: profile.emails[0].value,
        usertype: 'guest',
        oauthProvider: 'google',
        oauthId: profile.id,
        emailVerified: true,
        password: await bcrypt.hash('oauthuser123', 10)
      });
      await user.save();
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID || 'dummy',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy',
  callbackURL: '/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ 
      oauthId: profile.id, 
      oauthProvider: 'github' 
    });
    
    if (!user) {
      user = new User({
        firstname: profile.displayName.split(' ')[0] || 'GitHub',
        lastname: profile.displayName.split(' ').slice(1).join(' ') || 'User',
        email: profile.emails[0]?.value || `${profile.username}@github.com`,
        usertype: 'guest',
        oauthProvider: 'github',
        oauthId: profile.id,
        emailVerified: true,
        password: await bcrypt.hash('oauthuser123', 10)
      });
      await user.save();
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
