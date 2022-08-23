const User = require('../models/users.models');
const localStrategy = require("passport-local").Strategy

const strategy = new localStrategy({ usernameField: "email" }, (username, password, done) => {
  User.findOne({ email: username }, (err, user) => {
    if (err) { return done(err); }
    if (!user) {
      return done(null, false, {
        message: "Incorrect Email."
      });
    }
    if (!user.validatePassword(password)) {
      return done(null, false, {
        message: "Incorrect Password."
      });
    }
    return done(null, user);
  });
});


module.exports = strategy
