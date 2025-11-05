const mongoose = require("mongoose");
const connectToMongo = require("../Database/db");
const Exam = require("../models/exam.model");
const Marks = require("../models/marks.model");
// Register referenced models for population
require("../models/subject.model");
require("../models/details/student-details.model");

(async () => {
  try {
    await connectToMongo();
    const examCount = await Exam.countDocuments();
    const marksCount = await Marks.countDocuments();
    const sampleExam = await Exam.findOne({}).lean();
    const sampleMarks = await Marks.findOne({})
      .populate("examId subjectId")
      .lean();

    console.log("Exams count:", examCount);
    console.log("Marks count:", marksCount);
    console.log("Sample Exam:", sampleExam);
    if (sampleMarks) {
      console.log("Sample Marks:", {
        subject: sampleMarks.subjectId?.code,
        exam: sampleMarks.examId?.name,
        examType: sampleMarks.examId?.examType,
        obtained: sampleMarks.marksObtained,
        total: sampleMarks.examId?.totalMarks,
        semester: sampleMarks.semester,
      });
    } else {
      console.log("No sample marks found.");
    }
  } catch (e) {
    console.error("verify-exams error:", e);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
})();
