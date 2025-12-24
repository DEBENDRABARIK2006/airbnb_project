const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  stars: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const homeschema = mongoose.Schema({
  homename: { type: String, required: true },
  price: { type: Number, required: true },
  photo: { type: String },
  images: [{ type: String }],
  rulesFile: { type: String },
  description: { type: String, required: true },
  location: { type: String, required: true },
  hostid: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ratings: [ratingSchema],
});

// ✅ Simple virtual for average rating
homeschema.virtual("averageRating").get(function () {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const total = this.ratings.reduce((sum, r) => sum + r.stars, 0);
  return (total / this.ratings.length).toFixed(1);
});

// ✅ Include virtuals in JSON responses automatically
homeschema.set("toJSON", { virtuals: true });
homeschema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Home", homeschema);
