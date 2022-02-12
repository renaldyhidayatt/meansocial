const mongoose = require('mongoose')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const messageSchema = require('./message.models.js')
const { postSchema } = require('./posts.models.js')



const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  salt: String,
  friends: [String],
  friend_requests: [String],
  besties: [String],
  enemies: [String],
  posts: {
    type: [postSchema],
    default: []
  },
  messages: {
    type: [messageSchema],
    default: []
  },
  notifications: [String],
  profile_image: { type: String, default: "default-avatar" },
  new_message_notifications: { type: [String], default: [] },
  new_notifications: { type: Number, default: 0 },
})

userSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(64).toString("hex")
  this.password = crypto.pbkdf2Sync(password, this.salt, 1000, 64, "sha512").toString("hex");
}

userSchema.methods.validatePassword = function(password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, "sha512").toString("hex");
  return hash === this.password
}

userSchema.methods.getJwt = function() {
  return jwt.sign({
    _id: this._id,
    email: this.email,
    name: this.name
  }, process.env.JWT_SECRET)
}

module.exports = mongoose.model("user", userSchema)
