const mongoose = require("mongoose");

const SocietySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      enum: ["cultural", "technical"],
      required: true,
    },
    about: { type: String, default: "" },
    activities: [{ type: String }],
    coverImage: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Society", SocietySchema);
