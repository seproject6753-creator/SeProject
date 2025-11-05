require('dotenv').config();
const connect = require('../Database/db');
const mongoose = require('mongoose');
const Branch = require('../models/branch.model');
const Student = require('../models/details/student-details.model');
const Faculty = require('../models/details/faculty-details.model');
const Admin = require('../models/details/admin-details.model');

(async () => {
  try {
    connect();
    // wait briefly for connection since connect() does not return a promise
    await new Promise((r) => setTimeout(r, 1500));
    const [bc, sc, fc, ac] = await Promise.all([
      Branch.countDocuments(),
      Student.countDocuments(),
      Faculty.countDocuments(),
      Admin.countDocuments(),
    ]);
    console.log('COUNTS => Branches:', bc, 'Students:', sc, 'Faculty:', fc, 'Admins:', ac);
  } catch (e) {
    console.error('VERIFY-ERROR', e);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();
