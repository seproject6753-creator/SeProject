const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentDetail",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    selfie: { type: String },
    markedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["present", "absent"], default: "present" },
  },
  { timestamps: true }
);

AttendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
