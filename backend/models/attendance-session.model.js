const mongoose = require("mongoose");

const AttendanceSessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true }, // QR token
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FacultyDetail",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    semester: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

AttendanceSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("AttendanceSession", AttendanceSessionSchema);
