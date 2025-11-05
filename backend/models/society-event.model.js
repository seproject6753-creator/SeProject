const mongoose = require("mongoose");

const SocietyEventSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: Date, required: true, index: true },
    location: { type: String, default: "" },
    createdByMembershipId: { type: mongoose.Schema.Types.ObjectId, ref: "SocietyMembership" },
    visibility: { type: String, enum: ["public", "members"], default: "public" },
    status: { type: String, enum: ["scheduled", "cancelled"], default: "scheduled" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SocietyEvent", SocietyEventSchema);
