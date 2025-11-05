const mongoose = require("mongoose");

const SocietyMembershipSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userType: { type: String, enum: ["StudentDetail", "FacultyDetail", "AdminDetail"], required: true },
    role: { type: String, enum: ["head", "coordinator", "member"], default: "member", index: true },
    name: String,
    email: String,
    profile: String,
  },
  { timestamps: true }
);

SocietyMembershipSchema.index({ societyId: 1, userId: 1, userType: 1 }, { unique: true });

module.exports = mongoose.model("SocietyMembership", SocietyMembershipSchema);
