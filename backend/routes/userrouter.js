// routes/userrouter.js
const express = require("express");
const userrouter = express.Router();
const usercontroller = require("../controller/usercontroller");
const { isauth, ishost, isguest } = require("../controller/authcontroller");

userrouter.get("/", isauth, usercontroller.gethome);

// Single home details
userrouter.get("/home/:id", isauth, usercontroller.getHomeById);

// Post rating
// REMOVED 'isguest' so you can test with your current account
userrouter.post("/home/:id/rate", isauth, usercontroller.postRating);

module.exports = userrouter;