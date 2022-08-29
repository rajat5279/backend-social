const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//signup route
router.post("/signup", (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!email || !password || !name) {
    return res
      .status(422)
      .json({ error: "Please provide valid inputs for the fields." });
  }

  User.findOne({ email: email })
    .then((savedUser) => {
      if (savedUser) {
        return res
          .status(422)
          .json({ error: "Email already exists in the database" });
      }

      bcrypt.hash(password, 12).then((hashedPassword) => {
        const user = new User({
          email,
          password: hashedPassword,
          name,
          pic,
        });

        user
          .save()
          .then(() => {
            res.json({
              message: "Thank you. You can log in to your account now.",
            });
          })
          .catch((err) => {
            console.log(err);
          });
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

// sign in route
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(422)
      .json({ error: "Please provide the input for fields." });
  }

  User.findOne({ email: email }).then((savedUser) => {
    if (!savedUser) {
      return res.status(422).json({ error: "Invalid Email or password 😿" });
    }

    bcrypt
      .compare(password, savedUser.password)
      .then((doMatchPassword) => {
        if (doMatchPassword) {
          /*  res.json({message: "successfuly signed in!"}) */

          const token = jwt.sign({ _id: savedUser.id }, process.env.JWT_KEY);
          const { _id, name, email, pic } = savedUser;
          res.json({
            token,
            user: {
              _id,
              name,
              email,
              pic,
            },
          });
        } else {
          res.status(422).json({ error: "Invalid email or password details" });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

module.exports = router;
