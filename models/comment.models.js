const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  commenter_id: {
    type: String,
    required: true,
  },
  comment_content: {
    type: String,
    required: true,
  },
});

const Comment = mongoose.model("comment", commentSchema);

module.exports = Comment;
