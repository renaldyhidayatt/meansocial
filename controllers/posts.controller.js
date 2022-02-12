const mongoose = require("mongoose");
const Post = mongoose.model("posts");
const User = mongoose.model("user");

const createPost = function ({ body, payload }, res) {
  if (!body.content || !body.theme) {
    return res.statusJson(400, {
      message: "Insufficient data sent with the request.",
    });
  }

  let userId = payload._id;

  const post = new Post();

  post.theme = body.theme;
  post.content = body.content;

  User.findById(userId, (err, user) => {
    if (err) {
      return res.json({
        err: err,
      });
    }

    newPost.name = payload.name;
    newPost.ownerid = payload._id;
    newPost.ownerProfileImage = user.profile_image;
    user.posts.push(post);
    user.save((err) => {
      if (err) {
        return res.json({ err: err });
      }
      return res.statusJson(201, { message: "Created post", newPost: newPost });
    });
  });
};

const likeUnlike = function ({ payload, params }, res) {
  User.findById(params.ownerid, (err, user) => {
    if (err) {
      return res.json({
        err: err,
      });
    }

    const post = user.posts.id(params.postid);

    let promise = new Promise(function (resolve, reject) {
      if (post.likes.includes(payload._id)) {
        post.likes.splice(post.likes.indexOf(payload._id), 1);
        resolve();
      } else {
        post.likes.push(payload._id);

        if (params.ownerid != payload._id) {
          User.findById(payload._id, (err, user) => {
            if (err) {
              reject("Error:", err);
              return res.json({ err: err });
            }
            alertUser(user, params.ownerid, "liked_post", post.content).then(
              () => {
                resolve();
              }
            );
          });
        } else {
          resolve();
        }
      }
    });

    promise.then(() => {
      user.save((err, user) => {
        if (err) {
          return res.json({ err: err });
        }
        res.statusJson(201, { message: "Like or Unlike a post..." });
      });
    });
  });
};

module.exports = {
  createPost,
};
