const adminDetails = require("./models/details/admin-details.model");
const facultyDetails = require("./models/details/faculty-details.model");
const studentDetails = require("./models/details/student-details.model");
const Branch = require("./models/branch.model");
const Subject = require("./models/subject.model");
const Exam = require("./models/exam.model");
const Marks = require("./models/marks.model");
const Timetable = require("./models/timetable.model");
const Enrollment = require("./models/enrollment.model");
const connectToMongo = require("./Database/db");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const seedData = async () => {
  try {
    // Establish DB connection (connectToMongo uses mongoose.connect internally)
    await connectToMongo();

    // Clear existing data for a clean seed
    await Promise.all([
      adminDetails.deleteMany({}),
      facultyDetails.deleteMany({}),
      studentDetails.deleteMany({}),
      Branch.deleteMany({}),
      Subject.deleteMany({}),
      Enrollment.deleteMany({}),
      Exam.deleteMany({}),
      Marks.deleteMany({}),
      Timetable.deleteMany({}),
    ]);

    const password = "admin123";
    const employeeId = 123456;

    const adminDetail = {
      employeeId: employeeId,
      firstName: "Sundar",
      middleName: "R",
      lastName: "Pichai",
      email: "admin@gmail.com",
      phone: "1234567890",
      profile: "Faculty_Profile_123456.jpg",
      address: "123 College Street",
      city: "College City",
      state: "State",
      pincode: "123456",
      country: "India",
      gender: "male",
      dob: new Date("1990-01-01"),
      designation: "System Administrator",
      joiningDate: new Date(),
      salary: 50000,
      status: "active",
      isSuperAdmin: true,
      emergencyContact: {
        name: "Emergency Contact",
        relationship: "Spouse",
        phone: "9876543210",
      },
      bloodGroup: "O+",
      password: password,
    };

    await adminDetails.create(adminDetail);

    // Seed branches
    const branches = [
      { name: "IT", branchId: "IT" },
      { name: "IT-BI", branchId: "IT-BI" },
      { name: "ECE", branchId: "ECE" },
    ];
  const createdBranches = await Branch.insertMany(branches);

    const branchByName = Object.fromEntries(
      createdBranches.map((b) => [b.name, b])
    );

    // Seed faculty (teachers) - 50 profs
    const facultyPassword = "faculty123";
    const facultySeed = [];
    let empStart = 3000;
    const profBranches = [branchByName["IT"], branchByName["IT-BI"], branchByName["ECE"]];
    for (let i = 0; i < 50; i++) {
      const b = profBranches[i % profBranches.length];
      facultySeed.push({
        employeeId: empStart + i,
        firstName: `Prof${i + 1}`,
        lastName: "Faculty",
        email: `prof${i + 1}@college.test`,
        phone: `9${String(100000000 + i).padStart(9, "0")}`.slice(0, 10),
        profile: "",
        address: "Dept. Office",
        city: "College City",
        state: "State",
        pincode: "123456",
        country: "India",
        gender: i % 2 === 0 ? "male" : "female",
        dob: new Date(1975 + (i % 20), 0, 1),
        designation: "Faculty",
        joiningDate: new Date(2010 + (i % 10), 0, 1),
        salary: 50000 + (i % 10) * 2000,
        status: "active",
        emergencyContact: { name: `EC${i + 1}`, relationship: "Parent", phone: `8${String(200000000 + i).padStart(9, "0")}`.slice(0, 10) },
        bloodGroup: ["A+", "B+", "O+", "AB+"][i % 4],
        branchId: b._id,
        password: facultyPassword,
      });
    }
    const createdFaculty = await facultyDetails.create(facultySeed);

    // Seed subjects across branches and semesters
    // Seed 32 subjects: 4 per semester for 8 semesters
    const subjectsSeed = [];
    const semCount = 8;
    const perSem = 4;
    let subjIdx = 1;
    const branchList = [branchByName["IT"], branchByName["IT-BI"], branchByName["ECE"]];
    for (let sem = 1; sem <= semCount; sem++) {
      for (let j = 1; j <= perSem; j++) {
        const branchForCourse = branchList[(subjIdx - 1) % branchList.length];
        subjectsSeed.push({
          name: `Course S${sem} - ${j}`,
          code: `C${String(sem).padStart(2, "0")}${String(j).padStart(2, "0")}`,
          branch: branchForCourse._id,
          semester: sem,
          credits: 3 + (j % 2),
        });
        subjIdx++;
      }
    }
    const createdSubjects = await Subject.insertMany(subjectsSeed);

    // Assign a faculty to each subject (prefer same-branch faculty, otherwise random)
  // Enrollment model already required at top
    const facultyByBranch = {};
    createdFaculty.forEach((f) => {
      const key = String(f.branchId);
      facultyByBranch[key] = facultyByBranch[key] || [];
      facultyByBranch[key].push(f);
    });

    for (const subj of createdSubjects) {
      const list = facultyByBranch[String(subj.branch)] || createdFaculty;
      const chosen = list[Math.floor(Math.random() * list.length)];
      await Subject.findByIdAndUpdate(subj._id, { facultyId: chosen._id });
    }

    // (Moved enrollment seeding after students are created)

    // Seed 200 students distributed across branches and semesters
    const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = (arr) => arr[rnd(0, arr.length - 1)];
    const genders = ["male", "female", "other"];
    const bloods = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const branchesPool = [branchByName["IT"], branchByName["IT-BI"], branchByName["ECE"]];

    const students = [];
    const startEnroll = 500000;
    for (let i = 0; i < 200; i++) {
      const enroll = startEnroll + i;
      const branch = branchesPool[i % branchesPool.length];
      const first = `Student${i + 1}`;
      const middle = "K";
      const last = "Test";
      const semester = rnd(1, 8);
      const gender = pick(genders);
      const blood = pick(bloods);
      const dobYear = rnd(2000, 2005);
      const dobMonth = rnd(1, 12);
      const dobDay = rnd(1, 28);
      students.push({
        enrollmentNo: enroll,
        firstName: first,
        middleName: middle,
        lastName: last,
        email: `${enroll}@gmail.com`,
        phone: `9${String(100000000 + i).padStart(9, "0")}`.slice(0, 10),
        semester,
        branchId: branch._id,
        gender,
        dob: new Date(`${dobYear}-${String(dobMonth).padStart(2, "0")}-${String(dobDay).padStart(2, "0")}`),
        address: "Hostel Block",
        city: "College City",
        state: "State",
        pincode: "123456",
        country: "India",
        profile: "",
        status: "active",
        bloodGroup: blood,
        emergencyContact: { name: "EC", relationship: "Parent", phone: `8${String(200000000 + i).padStart(9, "0")}`.slice(0, 10) },
        password: "student123",
      });
    }
    await studentDetails.create(students);

    // Auto-enroll students into all subjects for their semester AND branch
    const enrollments = [];
    const subjectsBySemBranch = {};
    createdSubjects.forEach((s) => {
      const key = `${s.semester}:${String(s.branch)}`;
      subjectsBySemBranch[key] = subjectsBySemBranch[key] || [];
      subjectsBySemBranch[key].push(s);
    });
    const allStudents = await studentDetails.find({}).select("_id semester branchId enrollmentNo");
    allStudents.forEach((st) => {
      const key = `${st.semester}:${String(st.branchId)}`;
      const subs = subjectsBySemBranch[key] || [];
      subs.forEach((sub) => {
        enrollments.push({ studentId: st._id, subjectId: sub._id, semester: st.semester, branchId: st.branchId });
      });
    });
    if (enrollments.length) {
      await Enrollment.insertMany(enrollments);
    }

    // Seed Exams: For each semester, create a Mid and End term exam
    const examDocs = [];
    const now = new Date();
    for (let sem = 1; sem <= 8; sem++) {
      const midDate = new Date(now.getFullYear(), (sem - 1) % 12, 10);
      const endDate = new Date(now.getFullYear(), (sem - 1) % 12, 25);
      examDocs.push({
        name: `Semester ${sem} Mid Term`,
        date: midDate,
        semester: sem,
        examType: "mid",
        timetableLink: `timetable_S${sem}_mid.pdf`,
        totalMarks: 30,
      });
      examDocs.push({
        name: `Semester ${sem} End Term`,
        date: endDate,
        semester: sem,
        examType: "end",
        timetableLink: `timetable_S${sem}_end.pdf`,
        totalMarks: 70,
      });
    }
    const createdExams = await Exam.insertMany(examDocs);

    // Seed Marks for enrollments per exam and subject in that semester
    const allEnrollments = await Enrollment.find({}).select("studentId subjectId semester");
    const createdSubjectsBySem = createdSubjects.reduce((acc, s) => {
      (acc[s.semester] = acc[s.semester] || []).push(s);
      return acc;
    }, {});

    const marksToInsert = [];
    for (const ex of createdExams) {
      const subjectsOfSem = createdSubjectsBySem[ex.semester] || [];
      if (subjectsOfSem.length === 0) continue;
      for (const sub of subjectsOfSem) {
        const enrs = allEnrollments.filter(
          (en) => String(en.subjectId) === String(sub._id) && en.semester === ex.semester
        );
        for (const en of enrs) {
          const max = ex.totalMarks;
          // Generate a realistic score: 40% - 95% of total
          const minScore = Math.floor(max * 0.4);
          const maxScore = Math.floor(max * 0.95);
          const obtained = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
          marksToInsert.push({
            studentId: en.studentId,
            subjectId: sub._id,
            marksObtained: obtained,
            semester: ex.semester,
            examId: ex._id,
          });
        }
      }
    }
    if (marksToInsert.length) {
      await Marks.insertMany(marksToInsert);
    }

    // Generate Timetables (PDF) for each branch and semester
    const mediaDir = path.join(__dirname, "media");
    if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const periodsPerDay = 6;
    const makeGrid = (subjects, facultyById) => {
      const grid = [];
      for (let d = 0; d < days.length; d++) {
        const row = [];
        for (let p = 0; p < periodsPerDay; p++) {
          const sub = subjects[Math.floor(Math.random() * subjects.length)];
          let cell = sub.code;
          if (sub.facultyId) {
            const f = facultyById[String(sub.facultyId)] || null;
            if (f) cell += `\n(${f.firstName})`;
          }
          row.push(cell);
        }
        grid.push(row);
      }
      return grid;
    };

    // Build a map of faculty by id for names
    const facultyById = createdFaculty.reduce((acc, f) => {
      acc[String(f._id)] = f;
      return acc;
    }, {});

    const timetableDocs = [];
    for (const br of createdBranches) {
      for (let sem = 1; sem <= 8; sem++) {
        const subs = createdSubjects.filter(
          (s) => s.semester === sem && String(s.branch) === String(br._id)
        );
        if (subs.length === 0) continue;

        const grid = makeGrid(subs, facultyById);
        const fileName = `timetable_S${sem}_${br.branchId}.pdf`;
        const filePath = path.join(mediaDir, fileName);

        // Render a simple PDF table
        const doc = new PDFDocument({ size: "A4", margin: 40 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(18).text(`Timetable - ${br.name} (Sem ${sem})`, { align: "center" });
        doc.moveDown(1);

        const tableTop = 100;
        const colCount = periodsPerDay + 1; // include Day column
        const colWidth = (doc.page.width - doc.options.margin * 2) / colCount;
        const rowHeight = 60;

        // Header row
        doc.fontSize(12).text("Day/Period", doc.options.margin + 5, tableTop + 5, { width: colWidth - 10, align: "center" });
        for (let p = 0; p < periodsPerDay; p++) {
          doc.text(`P${p + 1}`, doc.options.margin + (p + 1) * colWidth + 5, tableTop + 5, { width: colWidth - 10, align: "center" });
        }

        // Grid rows
        for (let r = 0; r < days.length; r++) {
          const y = tableTop + (r + 1) * rowHeight;
          doc.text(days[r], doc.options.margin + 5, y + 5, { width: colWidth - 10, align: "center" });
          for (let c = 0; c < periodsPerDay; c++) {
            const x = doc.options.margin + (c + 1) * colWidth + 5;
            doc.text(grid[r][c], x, y + 5, { width: colWidth - 10, align: "center" });
          }
        }

        // Simple borders
        doc.rect(doc.options.margin, tableTop, colWidth * colCount, rowHeight * (days.length + 1)).stroke();
        for (let i = 1; i < colCount; i++) {
          const x = doc.options.margin + i * colWidth;
          doc.moveTo(x, tableTop).lineTo(x, tableTop + rowHeight * (days.length + 1)).stroke();
        }
        for (let j = 1; j < days.length + 1; j++) {
          const y = tableTop + j * rowHeight;
          doc.moveTo(doc.options.margin, y).lineTo(doc.options.margin + colWidth * colCount, y).stroke();
        }

        doc.end();
        await new Promise((resolve) => stream.on("finish", resolve));

        timetableDocs.push({ link: fileName, branch: br._id, semester: sem });
      }
    }

    if (timetableDocs.length) {
      await Timetable.insertMany(timetableDocs);
    }

    console.log("\n=== Admin Credentials ===");
    console.log("Employee ID:", employeeId);
    console.log("Password:", password);
    console.log("Email:", adminDetail.email);
    console.log("=======================\n");
    console.log("Seeded Branches:", branches.map((b) => `${b.name}(${b.branchId})`).join(", "));
    console.log("Seeded Faculty (password: faculty123): total=", createdFaculty.length);
  console.log("Seeded Students:", students.length);
  console.log("Seeded Subjects:", createdSubjects.length);
  console.log("Seeded Exams:", createdExams.length);
  console.log("Seeded Marks:", marksToInsert.length);
  console.log("Seeded Timetables:", timetableDocs.length);
  console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error while seeding:", error);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

seedData();
