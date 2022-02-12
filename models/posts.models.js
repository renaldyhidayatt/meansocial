const mongoose = require('mongoose')
const { commentSchema } = require('./comment.models.js')

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  theme: {
    type: String,
    default: "primary"
  },
  likes: {
    type: [String],
    default: []
  },
  comments: {
    type: [commentSchema],
    default: []
  }
})

mongoose.model("posts", postSchema)

module.exports = postSchema
