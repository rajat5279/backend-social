const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/requireLogin");
const Post = require("../models/postModel");
const User = require("../models/userModel");

//get all posts on HomeScreen
router.get("/allpost", requireLogin, (req, res) => {
  Post.find()
    .populate("postedBy", "_id name pic")
    .populate("comments.postedBy", "_id name")
    .sort("-createdAt")
    .then((posts) => {
      res.json({ posts });
    })
    .catch((err) => {
      console.log(err);
    });
});

//get posts of my following
router.get("/getsubpost", requireLogin, (req, res) => {
  // if postedBy in following
  Post.find({ postedBy: { $in: req.user.following } })
    .populate("postedBy", "_id name")
    .populate("comments.postedBy", "_id name")
    .sort("-createdAt")
    .then((posts) => {
      res.json({ posts });
    })
    .catch((err) => {
      console.log(err);
    });
});

//create post
router.post("/createpost", requireLogin, (req, res) => {
  const { body, pic } = req.body;
  if (!body || !pic) {
    return res.status(422).json({ error: "Plase add all the fields" });
  }
  req.user.password = undefined;
  const post = new Post({
    body,
    photo: pic,
    postedBy: req.user,
  });
  post
    .save()
    .then((result) => {
      res.json({ post: result });
    })
    .catch((err) => {
      console.log(err);
    });
});

//my posts
router.get("/mypost", requireLogin, (req, res) => {
  Post.find({ postedBy: req.user._id })
    .populate("postedBy", "_id name")
    .then((mypost) => {
      res.json({ mypost });
    })
    .catch((err) => {
      console.log(err);
    });
});

//like post
router.put("/like", requireLogin, (req, res) => {
  Post.findByIdAndUpdate(
    req.body.postId,
    {
      $push: { likes: req.user._id },
    },
    {
      new: true,
    }
  )
    .populate("comments.postedBy", "_id name pic")
    .populate("postedBy", "_id name pic")
    .exec((err, result) => {
      if (err) {
        return res.status(422).json({ error: err });
      } else {
        res.json(result);
      }
    });
});

//unlike post
router.put("/unlike", requireLogin, (req, res) => {
  Post.findByIdAndUpdate(
    req.body.postId,
    {
      $pull: { likes: req.user._id },
    },
    {
      new: true,
    }
  )
    .populate("comments.postedBy", "_id name pic")
    .populate("postedBy", "_id name pic")
    .exec((err, result) => {
      if (err) {
        return res.status(422).json({ error: err });
      } else {
        res.json(result);
      }
    });
});

//make comment
router.put("/comment", requireLogin, (req, res) => {
  const comment = {
    text: req.body.text,
    postedBy: req.user,
  };
  Post.findByIdAndUpdate(
    req.body.postId,
    {
      $push: { comments: comment },
    },
    {
      new: true,
    }
  )
    .populate("comments.postedBy", "_id name pic")
    .populate("postedBy", "_id name pic")
    .exec((err, result) => {
      if (err) {
        return res.status(422).json({ error: err });
      } else {
        res.json(result);
      }
    });
});

//delete comment
router.delete("/deletecomment/:commentId", requireLogin, (req, res) => {
  Post.findOne({ _id: req.params.commentId })
    .populate("postedBy", "_id")
    .exec((err, comment) => {
      if (err && !comment) {
        return res.status(422).json({ error: err });
      }
      if (comment.postedBy._id.toString() === req.user._id.toString()) {
        comment
          .remove()
          .then((result) => {
            res.json(result);
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        return res
          .status(422)
          .json({ error: "You are not authorized to delete the comment" });
      }
    });
});

//delete post
router.delete("/deletepost/:postId", requireLogin, (req, res) => {
  Post.findOne({ _id: req.params.postId })
    .populate("postedBy", "_id")
    .exec((err, post) => {
      if (err || !post) {
        return res.status(422).json({ error: err });
      }
      if (post.postedBy._id.toString() === req.user._id.toString()) {
        post
          .remove()
          .then((result) => {
            res.json(result);
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        return res
          .status(422)
          .json({ error: "You are not authorized to delete the post" });
      }
    });
});

module.exports = router;
