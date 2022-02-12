const User = require('../models/users.models');
const passport = require('passport')

const registerUser = function({ body }, res) {
  if (!body.first_name || !body.last_name || !body.email || !body.password || !body.password_confirm) {
    return res.send({
      message: "All Fields are required"
    });

  }

  if (body.password !== body.password_confirm) {
    return res.send({
      messsage: "Password don't match"
    })
  }

  const user = new User();



  user.name = body.first_name.trim() + " " + body.last_name.trim();
  user.email = body.email;
  user.setPassword(body.password);

  user.save((err, newUser) => {
    if (err) {
      if (err.errmsg && err.errmsg.includes("duplicate key error") && err.errmsg.includes("email")) {
        return res.json({ message: "The provided email is already registered." });
      }
      return res.json({
        message: "Something went wrong"
      })
    } else {
      const token = newUser.getJwt();

      return res.status(201).json({
        token
      })
    }
  })
}

const loginUser = function(req, res) {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  passport.authenticate("local", (err, user, info) => {
    if (err) { return res.status(404).json(err) }
    if (user) {
      const token = user.getJwt();
      res.status(201).json({ token });
    } else { res.json(info); }
  })(req, res);
}


module.exports = {
  loginUser,
  registerUser
}
