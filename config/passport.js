const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const mongoose = require("mongoose");

module.exports = function (passport) {
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

  passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log(profile);
        console.log(JSON.stringify(profile));

        try {
          let existingUser = await User.findOne({googleId: profile.id});

          if (existingUser) {
            done(null, existingUser);
          } else {
            const newUser = await new User({
              googleId: profile.id,
              displayName: profile.displayName,
              email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
            }).save();
            done(null, newUser);
          }

        } catch (err) {
          console.error(err);
          done(err, null);
        }
      }));
}

module.exports = passport;