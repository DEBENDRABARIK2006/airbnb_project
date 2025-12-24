// routes/hostrouter.js
const express = require("express");
const hostrouter = express.Router();
const hostcontroller = require("../controller/hostcontroller");
const { isauth, ishost } = require("../controller/authcontroller");

const upload = require("../utils/multerMemory");

// ✅ Add new home (multiple images + one rules file)
hostrouter.get("/host/addhome", isauth, ishost, hostcontroller.getaddhome);

hostrouter.post(
  "/host/addhome",
  isauth,
  ishost,
  upload.fields([
    { name: "images", maxCount: 10 }, // ✅ must include maxCount for multiple images
    { name: "rulesfile", maxCount: 1 },
  ]),
  hostcontroller.postaddhome
);

// ✅ View homes owned by the host
hostrouter.get("/host/ownhome", isauth, ishost, hostcontroller.getmyhome);

// ✅ Edit home details
hostrouter.get("/host/edithome/:id", isauth, ishost, hostcontroller.getedithome);

hostrouter.post(
  "/host/edithome/:id",
  isauth,
  ishost,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "rulesfile", maxCount: 1 },
  ]),
  hostcontroller.postedithome
);

// ✅ Delete a home
hostrouter.post("/host/deletehome/:id", isauth, ishost, hostcontroller.delethome);

module.exports = hostrouter;
