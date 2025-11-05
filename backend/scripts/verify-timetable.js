const mongoose = require("mongoose");
const connectToMongo = require("../Database/db");
const Timetable = require("../models/timetable.model");
const Branch = require("../models/branch.model");

(async () => {
  try {
    await connectToMongo();
    const count = await Timetable.countDocuments();
    console.log("Timetables count:", count);
    const one = await Timetable.findOne({}).populate("branch").lean();
    console.log("Sample Timetable:", one);
  } catch (e) {
    console.error("verify-timetable error:", e);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
})();
