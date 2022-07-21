const bodyParser = require("body-parser");
const alert = require("alert");
const express = require("express");
const mongoose = require("mongoose");
const moment = require("moment");
const { Person, Tweet, Comment } = require("./models/File");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/twitterDB", (err) => {
  if (err) console.log(err);
  else console.log("mongdb is connected");
});

app.route("/").get((req, res) => {
  res.render("index");
});

//signUp
app
  .route("/signUp")
  .get((req, res) => {
    res.render("signUp");
  })
  .post((req, res) => {
    Person.exists({ name: req.body.name }, function (err, doc) {
      if (!err) {
        if (doc) {
          alert("This username already exists, please choose another one!");
          res.redirect("/signUp");
        } else {
          newPerson = Person.create({
            name: req.body.name,
            password: req.body.password,
            followers: 0,
          });
          alert("Welcome to twitter!");
          res.redirect(`/feed/${req.body.name}`);
        }
      } else console.log(err);
    });
  });

//signIn
app
  .route("/signIn")
  .get((req, res) => {
    res.render("signIn");
  })
  .post((req, res) => {
    Person.find(
      {
        name: req.body.name,
        password: req.body.password,
      },
      (err, result) => {
        if (!err) {
          if (result.length === 0) {
            alert("Please fill your data correctly or Sign Up!");
            res.redirect("/signIn");
          } else {
            alert(`Welcome back ${result[0].name}!`);
            res.redirect(`/feed/${req.body.name}`);
          }
        } else console.log(err);
      }
    );
  });

//compose tweet
app
  .route(`/compose/:userName`)
  .get((req, res) => {
    res.render("compose", {
      route: req.params.userName,
    });
  })
  .post((req, res) => {
    Tweet.create(
      {
        content: req.body.text,
        postedTweetTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
      },
      (err, newTweet) => {
        if (!err) {
          Person.findOne({ name: req.params.userName }, (err, doc) => {
            if (!err) {
              newTweet.postedBy = doc._id;
              newTweet.save();

              doc.tweets.unshift(newTweet._id);
              doc.save();
              res.redirect(`/feed/${req.params.userName}`);
            } else console.log(err);
          });
        } else console.log(err);
      }
    );
  });

//compose comment
app
  .route(`/feed/:userName/comment/:tweetId`)
  .get((req, res) => {
    res.render("comment", {
      user: req.params.userName,
      tweetId: req.params.tweetId,
    });
  })
  .post((req, res) => {
    Comment.create(
      {
        content: req.body.text,
        postedBy: req.params.userName,
        postedCommentTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
        likes: 0,
      },
      (err, newComment) => {
        if (!err) {
          Tweet.findOne({ _id: req.params.tweetId }, (err, doc) => {
            if (!err) {
              doc.comments.unshift(newComment._id);
              doc.save();
              res.redirect(`/feed/${req.params.userName}`);
            } else console.log(err);
          });
        }
      }
    );
  });

//feed
app.route("/feed/:userName").get((req, res) => {
  Tweet.find()
    .populate("comments")
    .populate("postedBy")
    .sort({ createdAt: -1 })
    .exec((err, docs) => {
      if (!err) {
        //to know if a person has liked tweet
        docs.forEach((doc) => {
          if (!doc.likes.includes(req.params.userName)) {
            doc.likeTweetBtn = "Like";
          } else doc.likeTweetBtn = "Liked";
        });

        //to know if a person has liked comment
        docs.forEach((doc) => {
          doc.comments.forEach((docComment) => {
            if (!docComment.likes.includes(req.params.userName)) {
              docComment.likeCommentBtn = "Like";
            } else docComment.likeCommentBtn = "Liked";
          });
        });

        res.render("feed", {
          tweets: docs,
          user: req.params.userName,
        });
      } else console.log(err);
    });
});

//like tweet
app.route("/feed/:userName/like/:tweetId").post((req, res) => {
  Tweet.findById(req.params.tweetId, (err, doc) => {
    if (!err) {
      if (!doc.likes.includes(req.params.userName)) {
        doc.likes.push(req.params.userName);
        doc.likeTweetBtn = "Liked";
        doc.save();
      } else {
        let indexForLikes = doc.likes.indexOf(req.params.userName);
        doc.likes.splice(indexForLikes, 1);
        doc.likeTweetBtn = "Like";
        doc.save();
      }
    }
  });
});

//like comment
app.route("/feed/:userName/like-comment/:commentId").post((req, res) => {
  Comment.findById(req.params.commentId, (err, doc) => {
    if (!err) {
      if (!doc.likes.includes(req.params.userName)) {
        doc.likes.push(req.params.userName);
        doc.likeCommentBtn = "Liked";
        doc.save();
      } else {
        let indexForLikes = doc.likes.indexOf(req.params.userName);
        doc.likes.splice(indexForLikes, 1);
        doc.likeCommentBtn = "Like";
        doc.save();
      }
    } else console.log(err);
  });
});

//follow
app.route("/feed/:userName/follow/:user").post((req, res) => {
  Person.findOne({ name: req.params.user }, (err, doc) => {
    if (!err) {
      if (doc.name !== req.params.userName) {
        if (!doc.followers.includes(req.params.userName)) {
          doc.followers.push(req.params.userName);
          doc.followBtn = "Following";
          doc.save();
        } else {
          let indexForUnFollow = doc.followers.indexOf(req.params.userName);
          doc.followers.splice(indexForUnFollow, 1);
          doc.followBtn = "Follow";
          doc.save();
        }
      } else alert("You cannot follow yourself!");
    }
  });
});

//dashboard
app.route("/feed/:userName/dashboard/:user").get((req, res) => {
  Person.findOne({ name: req.params.user })
    .populate({
      path: "tweets",
      populate: [{ path: "comments" }, { path: "postedBy" }],
    })
    .exec(function (err, person) {
      if (err) return handleError(err);
      else {
        // to know if person follows another user
        if (!person.followers.includes(req.params.userName)) {
          person.followBtn = "Follow";
        } else person.followBtn = "Following";

        res.render("dashboard", {
          person: person,
          tweets: person.tweets,
          user: req.params.userName,
        });
      }
    });
});

//edit page
app.route("/dashboard/:userName/edit-tweet/:user/:tweetId").post((req, res) => {
  if (req.params.userName !== req.params.user) {
    res.redirect(`/feed/${req.params.userName}/dashboard/${req.params.user}`);
    alert(`You cannot edit someone else's tweet!`);
  } else {
    Tweet.findOne({ _id: req.params.tweetId }, (err, doc) => {
      res.render("edit", {
        tweetId: req.params.tweetId,
        user: req.params.userName,
        user2: req.params.user,
        initialText: doc.content,
      });
    });
  }
});

//edit btn
app.route("/edit/:userName/:tweetId/:user").post((req, res) => {
  Tweet.findOne({ _id: req.params.tweetId }, (err, doc) => {
    doc.content = req.body.text;
    doc.save();
    alert("Succesfully edited the tweet!");
    res.redirect(
      "/feed/" + req.params.userName + "/dashboard/" + req.params.user
    );
  });
});

//delete tweet
app
  .route("/dashboard/:userName/delete-tweet/:user/:tweetId")
  .post((req, res) => {
    if (req.params.userName !== req.params.user) {
      res.redirect(`/feed/${req.params.userName}/dashboard/${req.params.user}`);
      alert(`You cannot delete someone else's tweet!`);
    } else {
      Tweet.findOneAndDelete({ _id: req.params.tweetId }, (err) => {
        if (!err) {
          res.redirect(
            `/feed/${req.params.userName}/dashboard/${req.params.user}`
          );
        } else console.log(err);
      });
    }
  });

//delete comment
app
  .route("/feed/:userName/delete-comment/:user/:commentId")
  .post((req, res) => {
    if (req.params.userName !== req.params.user) {
      res.redirect(`/feed/${req.params.userName}`);
      alert(`You cannot delete someone else's comment!`);
    } else {
      Comment.findOneAndDelete({ _id: req.params.commentId }, (err) => {
        if (!err) {
          res.redirect(`/feed/${req.params.userName}`);
        } else console.log(err);
      });
    }
  });

app.listen(3000, () => {
  console.log("Server running at port 3000!");
});
