// controller/usercontroller.js
const Home = require("../models/home");

exports.gethome = async (req, res, next) => {
  try {
    const home = await Home.find();
    res.status(200).json({
      home,
      user: req.session.user || null,
    });
  } catch (err) {
    console.error("Get home error:", err);
    res.status(500).send("Error fetching homes");
  }
};

// Get single home with rating user details and average rating
exports.getHomeById = async (req, res) => {
  try {
    const homeid = req.params.id;

    // Populate both host info and rating users
    const homedata = await Home.findById(homeid)
      .populate("hostid", "firstname lastname email")
      .populate("ratings.user", "firstname lastname email");

    if (!homedata) return res.status(404).json({ error: "Home not found" });

    // Compute average rating
    const avgRating =
      homedata.ratings.length > 0
        ? (
            homedata.ratings.reduce((sum, r) => sum + r.stars, 0) /
            homedata.ratings.length
          ).toFixed(1)
        : null;

    res.status(200).json({
      home: {
        ...homedata.toObject(),
        averageRating: avgRating,
      },
      user: req.session.user || null,
    });
  } catch (err) {
    console.error("Get home by id error:", err);
    res.status(500).send("Server error");
  }
};

// Guests submit rating (Updated to allow non-guests but block owners)
exports.postRating = async (req, res) => {
  try {
    const homeid = req.params.id;
    const userid = req.session.user?.id;

    if (!userid) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { stars, comment } = req.body;
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "Invalid rating value" });
    }

    const home = await Home.findById(homeid);
    if (!home) return res.status(404).json({ error: "Home not found" });

    // --- NEW CHECK: Prevent Host from rating their own home ---
    if (home.hostid.toString() === userid) {
      return res.status(403).json({ error: "You cannot rate your own home." });
    }
    // ----------------------------------------------------------

    // Check if this user already rated — update instead of duplicate
    const existingRating = home.ratings.find(r => r.user.toString() === userid);
    if (existingRating) {
      existingRating.stars = stars;
      existingRating.comment = comment;
      existingRating.createdAt = new Date();
    } else {
      home.ratings.push({ user: userid, stars, comment });
    }

    await home.save();

    // repopulate rating users for frontend
    const updatedHome = await Home.findById(homeid)
      .populate("ratings.user", "firstname lastname email");

    res.status(200).json({
      message: "Rating submitted successfully",
      ratings: updatedHome.ratings,
    });
  } catch (err) {
    console.error("Post rating error:", err);
    res.status(500).send("Server error while submitting rating");
  }
};