const mongoose = require("mongoose");

const EnrollmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentDetail", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    semester: { type: Number },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enrollment", EnrollmentSchema);
