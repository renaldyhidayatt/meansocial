const User = require("../models/users.models");
const Post = require("../models/posts.models");
const Comment = require("../models/comment.models");
const Message = require("../models/message.models");
const timeAgo = require('time-ago')


const containsDuplicate = function (array) {
    array.sort();
    for (let i = 0; i < array.length; i++) {
        if (array[i] == array[i + 1]) {
            return true;
        }
    }
}

const addCommentDetails = function (posts) {
    return new Promise(function (resolve, reject) {
        let promises = [];

        for (let post of posts) {
            for (let comment of post.comments) {
                let promise = new Promise(function (resolve, reject) {
                    User.findById(comment.commenter_id, "name profile_image", (err, user) => {
                        comment.commenter_name = user.name;
                        comment.commenter_profile_image = user.profile_image;
                        resolve(comment);
                    });
                })
                promises.push(promise);
            }
        }
        Promise.all(promises).then((val) => {
            resolve(posts);
        })
    })
}

const getRandom = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}


const addToPosts = function (array, user) {
    for (item of array) {
        item.name = user.name;
        item.ago = timeAgo.ago(item.date)
        item.ownerProfileImage = user.profile_image;
        item.ownerid = user._id;
    }
}

const alertUser = function (fromUser, toId, type, postContent) {
    return new Promise(function (resolve, reject) {
        let alert = {
            alert_type: type,
            from_id: fromUser._id,
            from_name: fromUser.name
        }

        if (postContent && postContent.length > 28) {
            postContent = postContent.substring(0, 28) + "...";
        }

        switch (type) {
            case "new_friend":
                alert.alert_text = `${alert.from_name} has accepted your friend request.`;
                break;
            case "liked_post":
                alert.alert_text = `${alert.from_name} has like your post, '${postContent}'.`;
                break;
            case "commented_post":
                alert.alert_text = `${alert.from_name} has commented on your post, '${postContent}'.`;
                break;
            default: return reject("No valid type for alert.");
        }

        User.findById(toId, (err, user) => {
            if (err) {
                reject("Error: ", err);
                return res.json({
                    err: err
                })
            }
            user.new_notifications++;
            user.notifications.splice(18)
            user.notifications.unshift(JSON.stringify(alert));

            user.save((err) => {
                if (err) {
                    reject("Error: ", err);
                    return res.json({
                        err: err
                    })
                }

                resolve();
            })
        })
    })
}

const generateFeed = function ({ payload }, res) {
    let posts = [];
    let bestiePosts = [];

    const myPosts = new Promise(function (resolve, reject) {
        User.findById(payload._id, "", { lean: true }, (err, user) => {
            if (err) {
                return res.status(400).json({
                    err: err
                })
            }

            if (!user) {
                return res.status(404).json({ message: "User Does not exitst" })


            }
            addToPosts(user.posts, user);
            posts.push(...user.posts);

            user.friends = user.friends.filter((val) => {
                return !user.besties.includes(val);
            })

            resolve(user);
        })
    })

    function getPostsFrom(arrayOfUsers, maxAmountOfPosts, postsArray) {
        return new Promise(function (resolve, reject) {
            User.find({ "_id": { $in: arrayOfUsers } }, "name posts profile_image", { lean: true }, (err, users) => {
                if (err) {
                    reject("Error", err);
                    return res.json({
                        err: err
                    })
                }

                for (user of users) {
                    addToPosts(user.posts, user);

                    postsArray.push(...user.posts);
                }

                postsArray.sort((a, b) => (a.date > b.date) ? -1 : 1);
                postsArray.slice(maxAmountOfPosts);

                addCommentDetails(postsArray).then(() => {
                    resolve()
                })
            })
        })
    }


    let myBestiesPosts = myPosts.then(({ besties }) => {
        return getPostsFrom(besties, 4, bestiePosts);
    })

    let myFriendsPosts = myPosts.then(({ friends }) => {
        return getPostsFrom(friends, 48, posts);
    })

    Promise.all([myBestiesPosts, myFriendsPosts]).then(() => {
        res.status(200).json({
            posts,
            bestiePosts
        })
    })
}

const getSearchResults = function ({ query, payload }, res) {
    if (!query.query) {
        return res.json({
            err: "Missing a query"
        })
    }

    User.find({ name: { $regex: query.query, $options: "i" } }, "name profile_image friends friend_requests", (err, results) => {
        if (err) {
            return res.json({
                err: err
            })
        }

        results = results.slice(0, 20);

        for (let i = 0; i < results.length; i++) {
            if (results[i]._id == payload.id) {
                results.splice(i, 1);
                break;
            }
        }

        return res.status(200).json({
            message: "Getting Search Results",
            results: results
        })
    })
}

const makeFriendRequest = function ({ params }, res) {
    User.findById(params.to, (err, user) => {
        if (err) {
            return res.json({
                err: err
            })
        }

        if (containsDuplicate([params.from, ...user.friend_requests])) {
            return res.json({
                message: "Friend Request is already sent"
            });
        }

        user.friend_requests.push(params.from);

        user.save((err, user) => {
            if (err) {
                return res.json({
                    err: err
                })
            }

            return res.status(201).json({
                message: "Successfully sent a friend requests"
            })
        })
    })
}

const getUserData = function ({ params }, res) {
    User.findById(params.userId, "-salt -password", { lean: true }, (err, user) => {
        if (err) {
            return res.status(400).json({
                err: err
            })
        }

        if (!user) {
            return res.status(400).json({
                message: "User does not exitst"
            });
        }

        function getRandomFriends(friendsList) {
            let copyOfFriendsList = Array.from(friendsList);
            let randomIds = [];

            for (let i = 0; i < 6; i++) {
                if (friendsList.length <= 6) {
                    randomIds = copyOfFriendsList;
                    break;
                }

                let randomId = getRandom(0, copyOfFriendsList.length);

                randomIds.push(copyOfFriendsList[randomId]);

                copyOfFriendsList.splice(randomId, 1);
            }

            return new Promise(function (resolve, reject) {
                User.find({ "_id": { $in: randomIds } }, "name profile_image", (err, friends) => {
                    if (err) {
                        return res.json({
                            err: err
                        })
                    }
                    resolve(friends);
                })
            })
        }

        function addMessengerDetails(messages) {
            return new Promise(function (resolve, reject) {
                if (!messages.length) {
                    resolve(messages);
                }

                let usersArray = [];

                for (let message of messages) {
                    usersArray.push(message.from_id);
                }

                User.find({ "_id": { $in: usersArray } }, "name profile_image", (err, users) => {
                    if (err) {
                        return res.json({
                            err: err
                        })
                    }

                    for (message of messages) {
                        for (let i = 0; i < users.length; i++) {
                            if (message.from_id == users[i]._id) {
                                message.messagerName = users[i].name;
                                message.messengerProfileImage = users[i].profile_image;
                                users.splice(i, 1);
                                break;
                            }
                        }
                    }
                    resolve(messages)
                })
            })
        }

        user.posts.sort((a, b) => (a.date > b.date) ? -1 : 1);

        addToPosts(user.posts, user);

        let randomFriends = getRandomFriends(user.friends);
        let commentDetails = addCommentDetails(user.posts);
        let messageDetails = addMessengerDetails(user.messages);

        let besties = new Promise(function (resolve, reject) {
            User.find({ '_id': { $in: user.besties } }, "name profile_image", (err, users) => {
                user.besties = users;
                resolve();
            });
        });

        let enemies = new Promise(function (resolve, reject) {
            User.find({ '_id': { $in: user.enemies } }, "name profile_image", (err, users) => {
                user.enemies = users;
                resolve();
            });
        });

        let waitFor = [
            randomFriends,
            commentDetails,
            messageDetails,
            besties,
            enemies
        ]

        Promise.all(waitFor).then((val) => {
            user.random_friends = val[0];
            user.messages = val[2];
            res.status(200).json({
                user: user
            })
        })

    })
}

const getFriendRequests = function ({ query }, res) {
    let friendRequests = JSON.parse(query.friend_requests);
    User.find({ '_id': { $in: friendRequests } }, "name profile_image", (err, users) => {
        if (err) {
            return res.json({
                err: err
            })
        }

        return res.status(200).json({
            message: "Getting friend Requests",
            users: users
        })
    })
}

const resolveFriendRequest = function ({ query, params }, res) {
    User.findById(params.to, (err, user) => {
        if (err) {
            return res.json({
                err: err
            })
        }

        for (let i = 0; i < user.friend_requests.length; i++) {
            if (user.friend_requests[i] === params.from) {
                user.friend_requests.splice(i, i)
                break;
            }
        }
        let promise = new Promise(function (resolve, reject) {
            if (query.resolution == "accept") {
                if (containsDuplicate([params.from, ...user.friends])) {
                    return res.json({
                        message: "Duplicate Error."
                    })
                }
                user.friends.push(params.from);

                User.findById(params.from, (err, user) => {
                    if (err) {
                        return res.json({
                            message: "Duplicate Error"
                        })
                    }
                    if (containsDuplicate([params.to, ...user.friends])) {
                        return res.json({ message: "Duplicate Error." });
                    }

                    user.friends.push(params.to);
                    user.save((err, user) => {
                        if (err) { return res.json({ err: err }); }
                        resolve();
                    });
                })
            } else {
                resolve();
            }
        });

        promise.then(() => {
            user.save((err, user) => {
                if (err) {
                    return res.json({
                        err: err
                    })
                }
                alertUser(user, params.from, "new_friend").then(() => {
                    res.statusJson(201, { message: "Resolved friend request" });
                });
            })
        })

    })
}

const createPost = function ({ body, payload }, res) {
    if (!body.content || !body.theme) {
        return res.status(400).json({
            message: "Insufficient data sent with the request."
        })
    }
    let userId = payload._id;
    const post = new Post();

    post.theme = body.theme;
    post.content = body.content;

    User.findById(userId, (err, user) => {
        if (err) {
            return res.json({
                err: err
            })
        }

        let newPost = new post.toObject();
        newPost.name = payload.name;
        newPost.ownerid = payload._id;
        newPost.ownerProfileImage = user.profile_image;
        user.posts.push(post);
        user.save((err) => {
            if (err) { return res.json({ err: err }); }
            return res.statusJson(201, { message: "Created post", newPost: newPost });
        });
    })
}


const likeUnlike = function ({ payload, params }, res) {
    User.findById(params.ownerid, (err, user) => {
        if (err) {
            return res.json({
                err: err
            })
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
                        if (err) { reject("Error:", err); return res.json({ err: err }); }
                        alertUser(user, params.ownerid, "liked_post", post.content).then(() => {
                            resolve();
                        });
                    });
                } else {
                    resolve();
                }
            }
        })

        promise.then(() => {
            user.save((err, user) => {
                if (err) {
                    return res.json({
                        err: err
                    })
                }

                return res.status(201).json({
                    message: "Like or Unlike a Post"
                })
            })
        })
    })
}


const postCommentOnPost = function ({ body, payload, params }, res) {
    User.findById(params.ownerid, (err, user) => {
        if (err) {
            return res.json({
                err: err
            })
        }

        const post = user.posts.id(params.postid);

        let comment = new Comment();
        comment.commenter_id = payload._id;
        comment.comment_content = body.content;

        post.comment.push(comment);

        user.save((err, user) => {
            if (err) {
                return res.json({
                    err: err
                })
            };

            let promise = new Promise(function (resolve, reject) {
                if (payload._id != params.ownerid) {
                    alertUser(user, params.ownerid, "commented_post", post.content).then(() => {
                        resolve();
                    });
                } else {
                    resolve();
                }
            })

            promise.then(() => {
                res.status(201).json({
                    message: "Posted Comment",
                    comment: comment,
                    commenter: user
                })
            })
        })
    })
}

const sendMessage = function ({ body, payload, params }, res) {
    let from = payload._id;
    let to = params.to;

    let fromPromise = new Promise(function (resolve, reject) {
        User.findById(from, "messages", (err, user) => {
            if (err) {
                reject("Error", err);
                return res.json({
                    err: err
                })
            }

            from = user;
            resolve(user);
        })
    });

    let toPromise = new Promise(function (resolve, reject) {
        User.findById(to, "messages new_message_notifications", (err, user) => {
            if (err) {
                reject("Error", err)
                return res.json({
                    err: err
                })
            }
            to = user;
            resolve(user);
        })
    });

    let sendMessagePromise = Promise.all([fromPromise, toPromise]).then(() => {
        function hasMessageFrom(messages, id) {
            for (let message of messages) {
                if (message.from_id == id) {
                    return message;
                }
            }
        }

        function sendMessageTo(to, from, notify = false) {
            return new Promise(function (resolve, reject) {
                if (notify && !to.new_message_notifications.includes(from._id)) {
                    to.new_message_notifications.push(from._id);
                }

                if (foundMessage = hasMessageFrom(to.messages, from._id)) {
                    foundMessage.content.push(message);
                    to.save((err, user) => {
                        if (err) { reject("Error", err); return res.json({ err: err }); }
                        resolve(user);
                    });
                } else {
                    let newMessage = new Message();
                    newMessage.from_id = from._id;
                    newMessage.content = [message];
                    to.messages.push(newMessage);

                    to.save((err, user) => {
                        if (err) { reject("Error", err); return res.json({ err: err }); }
                        resolve(user);
                    })
                }
            })
        }

        let message = {
            messager: from._id,
            message: body.content
        }

        let sendMessageToRecipient = sendMessageTo(to, from, true);
        let sendMessageToAuthor = sendMessageTo(from, to);


        return new Promise(function (resolve, reject) {
            Promise.all([sendMessageToRecipient, sendMessageToAuthor]).then(() => {
                resolve();
            });
        });
    })

    sendMessagePromise.then(() => {
        return res.status(201).json({
            mesage: "Sending Mesage"
        });
    })
}

const resetMessageNotifications = function ({ payload }, res) {
    User.findById(payload._id, (err, user) => {
        if (err) {
            return res.json({
                err: err
            })
        }

        user.new_message_notifications = [];
        user.save((err) => {
            if (err) { return res.json({ err: err }); }
            return res.statusJson(201, { message: "Reset message notifications." });
        });
    })
}

const bestieEnemyToggle = function ({ payload, params, query }, res) {
    let toggle = query.toggle;
    if (toggle != "besties" && toggle != "enemies") {
        return res.json({ message: "Incorrect query supplied" });
    }

    let myId = payload._id;
    let friendId = params.userid;

    User.findById(myId, (err, user) => {
        if (err) {
            return res.json({
                err: err
            })
        }
        if (!user.friends.includes(friendId)) {
            return res.json({ message: "You are not friends with this user." });
        }


        let arr = user[toggle];

        if (arr.includes(friendId)) {
            arr.splice(arr.indexOf(friendId), 1);
        } else {
            if (toggle == "besties" && user.besties.length >= 2) {
                return res.json({ message: "You have the max amount of besties." });
            }
            arr.push(friendId);
        }

        user.save((err) => {
            if (err) {
                return res.json({
                    err: err
                })
            }

            return res.status(201).json({
                message: "Bestie/Enemy Toggle"
            })
        })

    })
}


const resetAlertNotifications = function ({ payload }, res) {
    User.findById(payload._id, (err, user) => {
        if (err) { return res.json({ err: err }); }
        user.new_notifications = 0;
        user.save((err) => {
            if (err) { return res.json({ err: err }); }
            return res.statusJson(201, { message: "Reset Alert Notifications." });
        });
    });
}


const deleteAllUsers = function (req, res) {
    User.deleteMany({}, (err, info) => {
        if (err) { return res.send({ error: err }); }
        return res.json({ message: "Deleted All Users", info: info });
    });
}

const getAllUsers = function (req, res) {
    User.find((err, users) => {
        if (err) { return res.send({ error: err }); }
        return res.json({ users: users });
    });
}





module.exports = {
    deleteAllUsers,
    getAllUsers,
    registerUser,
    loginUser,
    generateFeed,
    getSearchResults,
    makeFriendRequest,
    getUserData,
    getFriendRequests,
    resolveFriendRequest,
    createPost,
    likeUnlike,
    postCommentOnPost,
    sendMessage,
    resetMessageNotifications,
    deleteMessage,
    bestieEnemyToggle,
    resetAlertNotifications
}