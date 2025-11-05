const mongoose = require("mongoose");

const Subject = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FacultyDetail",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", Subject);
