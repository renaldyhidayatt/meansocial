const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  from_id: {
    type: String,
    required: true,
  },
  content: [
    {
      messageer: String,
      message: String,
    },
  ],
});

const Message = mongoose.model("message", messageSchema);

module.exports = Message;
