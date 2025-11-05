const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const connect = require('../Database/db');
const mongoose = require('mongoose');
const Subject = require('../models/subject.model');
const Student = require('../models/details/student-details.model');
const Enrollment = require('../models/enrollment.model');

(async () => {
  try {
    connect();
    await new Promise((r) => setTimeout(r, 1500));
    const [subjectCount, studentCount, enrollmentCount] = await Promise.all([
      Subject.countDocuments(),
      Student.countDocuments(),
      Enrollment.countDocuments(),
    ]);
    console.log('COUNTS => Subjects:', subjectCount, 'Students:', studentCount, 'Enrollments:', enrollmentCount);

    // sample: pick a random student and list their subjects
    const sample = await Student.findOne({}).select('_id firstName lastName enrollmentNo semester branchId');
    if (sample) {
      const regs = await Enrollment.find({ studentId: sample._id }).populate('subjectId');
      console.log(`Sample student ${sample.enrollmentNo} S${sample.semester} has ${regs.length} enrollments`);
      regs.slice(0, 5).forEach((e) => console.log('-', e.subjectId?.code, e.subjectId?.name));
    }
  } catch (e) {
    console.error('VERIFY-ENROLL-ERROR', e);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();
