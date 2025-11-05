const mongoose = require("mongoose");

const LostFoundSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["lost", "found"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    photo: {
      type: String, // filename stored under /media
    },
    contactName: String,
    contactPhone: String,
    contactEmail: String,
    location: String,
    status: {
      type: String,
      enum: ["open", "claimed"],
      default: "open",
    },
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    claimedAt: Date,
    // When set, MongoDB TTL index will remove the document automatically
    expiresAt: Date,
  },
  { timestamps: true }
);

// TTL index for expiresAt. When expiresAt <= now, document is purged
LostFoundSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("LostFound", LostFoundSchema);
