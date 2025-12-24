// controllers/hostcontroller.js
const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary, uploadBuffer } = require("../utils/cloudinary");
const Home = require("../models/home");

// Keep storage definition (optional for direct multer-cloudinary)
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = file.mimetype.includes("pdf") ? "airbnb/rules" : "airbnb/homes";
    const resourceType = file.mimetype.includes("pdf") ? "raw" : "image";
    return {
      folder,
      resource_type: resourceType,
      allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    };
  },
});

const upload = multer({ storage });
exports.uploadMiddleware = upload.single("file");

exports.getaddhome = (req, res) => {
  res.status(200).json({ message: "API endpoint to add home" });
};

exports.postaddhome = async (req, res) => {
  try {
    console.log("postaddhome - session.user:", req.session?.user);
    console.log("postaddhome - req.body keys:", Object.keys(req.body || {}));
    console.log("postaddhome - req.files:", req.files ? Object.keys(req.files) : req.files);

    // ✅ Auth check
    const sessionUser = req.session?.user;
    const hostid = sessionUser?.id || sessionUser?._id;
    if (!sessionUser || !hostid || sessionUser.usertype !== "host") {
      return res.status(401).json({ error: "Unauthorized: login as host required" });
    }

    const { homename, price, description, location } = req.body;
    if (!homename || !price || !description || !location) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ error: "Price must be positive" });
    }

    const files = req.files || {};
    const images = [];
    let rulesFileUrl = null;

    // ✅ Upload images
    if (files.images && Array.isArray(files.images)){
      for (const file of files.images){
        try {
          const result = await uploadBuffer(file.buffer, { folder: "airbnb/homes" }, file.mimetype);
          if (result?.secure_url) images.push(result.secure_url);
        } catch (err){
          console.error("Image upload failed:", err.message);
        }
      }
    }

    // ✅ Upload PDF/DOC
    if (files.rulesfile && files.rulesfile[0]) {
      const rf = files.rulesfile[0];
      try {
        const result = await uploadBuffer(
          rf.buffer,
          { folder: "airbnb/rules" },
          rf.mimetype
        );
        if (result?.secure_url) rulesFileUrl = result.secure_url;
      } catch (err) {
        console.error("Rules file upload failed:", err.message);
      }
    }

    // ✅ Fallback photo
    const photoField = req.body.photo || images[0] || "";

    // ✅ Save new home
    const home = new Home({
      homename,
      price: priceNum,
      description,
      location,
      hostid,
      images,
      rulesFile: rulesFileUrl,
      photo: photoField,
    });

    await home.save();
    res.status(201).json({ message: "Home added successfully", home });
  } catch (err) {
    console.error("Add home error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

// ✅ Fetch homes for current host
exports.getmyhome = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    const hostid = sessionUser?.id || sessionUser?._id;
    if (!hostid) return res.status(401).json({ error: "Unauthorized" });

    const homes = await Home.find({ hostid });
    res.status(200).json({ homes });
  } catch (err) {
    console.error("getmyhome error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single home for editing
exports.getedithome = async (req, res) => {
  try {
    const homeid = req.params.id;
    const homedata = await Home.findById(homeid);
    if (!homedata) return res.status(404).send("Home not found");
    res.status(200).json({ home: homedata });
  } catch (err) {
    console.error("Get Edit Error:", err);
    res.status(500).send("Server Error");
  }
};

// ✅ Edit home
exports.postedithome = async (req, res) => {
  try {
    const homeId = req.params.id;
    const { homename, description, location, price } = req.body;
    const hostid = req.session.user?.id;
    if (!hostid) return res.status(401).json({ error: "Unauthorized" });

    const files = req.files || {};
    const updates = { homename, description, location, price };

    // Replace images
    if (files.images && Array.isArray(files.images)) {
      const newImages = [];
      for (const file of files.images) {
        try {
          const result = await uploadBuffer(file.buffer, { folder: "airbnb/homes" }, file.mimetype);
          if (result?.secure_url) newImages.push(result.secure_url);
        } catch (err) {
          console.error("Image upload failed:", err.message);
        }
      }
      if (newImages.length > 0) updates.images = newImages;
    }

    // Replace PDF (if provided)
    if (files.rulesfile && files.rulesfile[0]) {
      const rf = files.rulesfile[0];
      try {
        const result = await uploadBuffer(rf.buffer, { folder: "airbnb/rules" }, rf.mimetype);
        if (result?.secure_url) updates.rulesFile = result.secure_url;
      } catch (err) {
        console.error("Rules file upload failed:", err.message);
      }
    }

    const updatedHome = await Home.findByIdAndUpdate(homeId, updates, { new: true });
    if (!updatedHome) return res.status(404).json({ error: "Home not found" });

    res.json({ message: "Home updated successfully", home: updatedHome });
  } catch (err) {
    console.error("Edit home error:", err);
    res.status(500).json({ error: "Internal server error while editing home" });
  }
};

// ✅ Delete home
exports.delethome = async (req, res) => {
  try {
    const homeid = req.params.id;
    const homedata = await Home.findById(homeid);
    if (!homedata) return res.status(404).send("Home not found");

    await Home.findByIdAndDelete(homeid);
    console.log("Home deleted successfully");
    res.status(200).json({ message: "Home deleted successfully" });
  } catch (err) {
    console.error("Delete Home Error:", err);
    res.status(500).send("Server Error");
  }
};
