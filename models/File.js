const mongoose = require("mongoose");
const moment = require("moment");

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  followers: {
    type: Array,
  },
  followBtn: {
    type: String,
    default: "Follow",
  },
  tweets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tweet" }],
});

const tweetSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
    },
    postedTweetTime: {
      type: String,
      default: moment().format("MMMM Do YYYY, h:mm:ss a"),
    },
    likes: {
      type: Array,
    },
    likeTweetBtn: {
      type: String,
      default: "Like",
    },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  },
  {
    timestamps: true,
  }
);

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    postedBy: {
      type: String,
    },
    postedCommentTime: {
      type: String,
      default: moment().format("MMMM Do YYYY, h:mm:ss a"),
    },
    likes: {
      type: Array,
    },
    likeCommentBtn: {
      type: String,
      default: "Like",
    },
  },
  { timestamps: true }
);

const Person = mongoose.model("Person", personSchema);
const Tweet = mongoose.model("Tweet", tweetSchema);
const Comment = mongoose.model("Comment", commentSchema);

module.exports = { Person, Tweet, Comment };
