const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const ApiResponse = require("../utils/ApiResponse");
const AttendanceSession = require("../models/attendance-session.model");
const Attendance = require("../models/attendance.model");
const Student = require("../models/details/student-details.model");
const Excel = require("exceljs");

// Helper to build media URL
const mediaURL = (req, file) => `${req.protocol}://${req.get("host")}/media/${file}`;

exports.createSession = async (req, res) => {
  try {
    const { subjectId, branchId, semester, durationSec = 300 } = req.body;
    if (!subjectId || !branchId || !semester) {
      return ApiResponse.badRequest("subjectId, branchId and semester are required").send(res);
    }
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + Number(durationSec) * 1000);
    const session = await AttendanceSession.create({
      token,
      facultyId: req.userId,
      subjectId,
      branchId,
      semester,
      expiresAt,
    });
    return ApiResponse.created(
      {
        sessionId: session._id,
        token: session.token,
        expiresAt: session.expiresAt,
      },
      "Attendance session created"
    ).send(res);
  } catch (err) {
    console.error(err);
    return ApiResponse.internalServerError(err.message).send(res);
  }
};

exports.getSessionByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const session = await AttendanceSession.findOne({ token });
    if (!session) return ApiResponse.notFound("Invalid session token").send(res);

    const now = new Date();
    const active = !session.closedAt && session.expiresAt > now;
    const total = await Attendance.countDocuments({ sessionId: session._id });

    return ApiResponse.success({
      sessionId: session._id,
      subjectId: session.subjectId,
      branchId: session.branchId,
      semester: session.semester,
      expiresAt: session.expiresAt,
      active,
      totalMarked: total,
    }).send(res);
  } catch (err) {
    console.error(err);
    return ApiResponse.internalServerError(err.message).send(res);
  }
};

exports.closeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await AttendanceSession.findByIdAndUpdate(
      sessionId,
      { closedAt: new Date() },
      { new: true }
    );
    if (!session) return ApiResponse.notFound("Session not found").send(res);
    // Update the subject master excel with 1/0 for all students of this subject (branch+semester)
    try {
      await updateSubjectMasterExcel(req, session);
    } catch (e) {
      console.error("Master Excel update failed:", e);
    }
    return ApiResponse.success(session, "Session closed").send(res);
  } catch (err) {
    return ApiResponse.internalServerError(err.message).send(res);
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return ApiResponse.badRequest("token is required").send(res);
    const session = await AttendanceSession.findOne({ token });
    if (!session) return ApiResponse.notFound("Invalid session token").send(res);
    if (session.closedAt || session.expiresAt <= new Date()) {
      return ApiResponse.forbidden("Session is closed or expired").send(res);
    }

    const studentId = req.userId;

    let selfieFile = null;
    if (req.file) {
      selfieFile = `attendance/${req.file.filename}`;
    }

    try {
      const rec = await Attendance.create({
        sessionId: session._id,
        studentId,
        subjectId: session.subjectId,
        selfie: selfieFile,
      });
      return ApiResponse.created(
        {
          attendanceId: rec._id,
          markedAt: rec.markedAt,
          selfieUrl: selfieFile ? mediaURL(req, selfieFile) : null,
        },
        "Attendance marked"
      ).send(res);
    } catch (e) {
      if (e.code === 11000) {
        return ApiResponse.conflict("Attendance already marked").send(res);
      }
      throw e;
    }
  } catch (err) {
    console.error(err);
    return ApiResponse.internalServerError(err.message).send(res);
  }
};

// Utilities to manage the subject-wise master Excel
const masterDir = path.join(__dirname, "..", "media", "attendance", "master");
if (!fs.existsSync(masterDir)) fs.mkdirSync(masterDir, { recursive: true });

async function updateSubjectMasterExcel(req, session) {
  // roster: all students in the session's branch+semester
  const roster = await Student.find({ branchId: session.branchId, semester: session.semester })
    .select("enrollmentNo firstName lastName")
    .sort({ enrollmentNo: 1 });

  // map of present students in this session
  const presents = await Attendance.find({ sessionId: session._id }).select("studentId").populate({
    path: "studentId",
    select: "enrollmentNo",
  });
  const presentEnrollSet = new Set(presents.map((p) => p.studentId?.enrollmentNo).filter(Boolean));

  const filePath = path.join(masterDir, `subject_${String(session.subjectId)}.xlsx`);
  const workbook = new Excel.Workbook();
  let sheet;
  if (fs.existsSync(filePath)) {
    await workbook.xlsx.readFile(filePath);
    sheet = workbook.getWorksheet("Attendance") || workbook.worksheets[0];
  } else {
    sheet = workbook.addWorksheet("Attendance");
    sheet.columns = [
      { header: "Enrollment No", key: "enroll", width: 15 },
      { header: "Student Name", key: "name", width: 28 },
    ];
    // seed rows
    roster.forEach((s) => {
      sheet.addRow({
        enroll: s.enrollmentNo,
        name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
      });
    });
  }

  // Determine a new column header for this session
  const headerRow = sheet.getRow(1);
  let newColIndex = headerRow.cellCount + 1;
  const sessionLabel = (session.closedAt || new Date()).toISOString();
  sheet.getColumn(newColIndex).header = sessionLabel;
  sheet.getColumn(newColIndex).width = 14;

  // Build a map of existing rows by enrollment
  const enrollToRow = new Map();
  for (let r = 2; r <= sheet.rowCount; r++) {
    const enroll = sheet.getRow(r).getCell(1).value; // column 1 is Enrollment No
    if (enroll) enrollToRow.set(Number(enroll), r);
  }

  // Ensure roster coverage and set 1/0 values
  roster.forEach((s) => {
    let rowIndex = enrollToRow.get(s.enrollmentNo);
    if (!rowIndex) {
      const row = sheet.addRow({
        enroll: s.enrollmentNo,
        name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
      });
      rowIndex = row.number;
    }
    sheet.getRow(rowIndex).getCell(newColIndex).value = presentEnrollSet.has(s.enrollmentNo) ? 1 : 0;
  });

  await workbook.xlsx.writeFile(filePath);
}

// Rebuild the subject master Excel from all sessions in DB (keeps master consistent after edits)
async function regenerateSubjectMasterExcel(req, subjectId) {
  const sessions = await AttendanceSession.find({ subjectId }).sort({ closedAt: 1, createdAt: 1 });
  if (!sessions.length) return; // nothing to do

  // Assume subject is tied to one branch/semester; use the first session's roster
  const base = sessions[0];
  const roster = await Student.find({ branchId: base.branchId, semester: base.semester })
    .select("enrollmentNo firstName lastName")
    .sort({ enrollmentNo: 1 });

  const filePath = path.join(masterDir, `subject_${String(subjectId)}.xlsx`);
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Attendance");
  sheet.columns = [
    { header: "Enrollment No", key: "enroll", width: 15 },
    { header: "Student Name", key: "name", width: 28 },
  ];
  // Seed rows
  roster.forEach((s) => {
    sheet.addRow({
      enroll: s.enrollmentNo,
      name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
    });
  });

  // Build a map of enroll -> row index for quick writes
  const enrollToRow = new Map();
  for (let r = 2; r <= sheet.rowCount; r++) {
    const enroll = sheet.getRow(r).getCell(1).value;
    if (enroll) enrollToRow.set(Number(enroll), r);
  }

  for (const sess of sessions) {
    // add a column for this session
    const headerRow = sheet.getRow(1);
    const colIndex = headerRow.cellCount + 1;
    const label = (sess.closedAt || sess.createdAt || new Date()).toISOString();
    sheet.getColumn(colIndex).header = label;
    sheet.getColumn(colIndex).width = 14;

    // who were present in this session?
    const presents = await Attendance.find({ sessionId: sess._id }).select("studentId").populate({
      path: "studentId",
      select: "enrollmentNo",
    });
    const presentEnrollSet = new Set(presents.map((p) => p.studentId?.enrollmentNo).filter(Boolean));

    // fill 1/0
    for (const [enroll, rowIdx] of enrollToRow.entries()) {
      sheet.getRow(rowIdx).getCell(colIndex).value = presentEnrollSet.has(enroll) ? 1 : 0;
    }
  }

  await workbook.xlsx.writeFile(filePath);
}

// Student: View subject-wise attendance summary
exports.getMySubjectAttendance = async (req, res) => {
  try {
    const { subjectId } = req.params;
    if (!subjectId) return ApiResponse.badRequest("subjectId is required").send(res);

    // total sessions for this subject (matching student's branch & semester implicitly recorded in session)
    const totalSessions = await AttendanceSession.countDocuments({ subjectId });
    const presentCount = await Attendance.countDocuments({ subjectId, studentId: req.userId });
    const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    return ApiResponse.success({ subjectId, totalSessions, presentCount, percentage }).send(res);
  } catch (err) {
    console.error(err);
    return ApiResponse.internalServerError(err.message).send(res);
  }
};

// Faculty/Student: Download subject master excel (if exists)
exports.downloadSubjectMaster = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const filePath = path.join(masterDir, `subject_${String(subjectId)}.xlsx`);
    if (!fs.existsSync(filePath)) return ApiResponse.notFound("Master excel not available").send(res);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=subject_${subjectId}_master.xlsx`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error(err);
    return ApiResponse.internalServerError(err.message).send(res);
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const filter = { studentId: req.userId };
    if (subjectId) filter.subjectId = subjectId;
    const recs = await Attendance.find(filter).populate("sessionId").sort({ markedAt: -1 });
    return ApiResponse.success(recs).send(res);
  } catch (err) {
    return ApiResponse.internalServerError(err.message).send(res);
  }
};

// Faculty: Import edited session Excel to update attendance records
exports.importSessionExcel = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await AttendanceSession.findById(sessionId);
    if (!session) return ApiResponse.notFound("Session not found").send(res);
    if (!req.file) return ApiResponse.badRequest("file is required").send(res);

    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const sheet = workbook.getWorksheet("Attendance") || workbook.worksheets[0];
    if (!sheet) return ApiResponse.badRequest("Invalid Excel file").send(res);

    // Build enrollment -> studentId map from roster
    const roster = await Student.find({ branchId: session.branchId, semester: session.semester })
      .select("_id enrollmentNo")
      .lean();
    const enrollToId = new Map(roster.map((s) => [Number(s.enrollmentNo), String(s._id)]));

    // find columns by header
    const header = sheet.getRow(1);
    let enrollCol = 1; // default first
    let statusCol = null;
    for (let c = 1; c <= header.cellCount; c++) {
      const h = String(header.getCell(c).value || "").toLowerCase();
      if (h.includes("enrollment")) enrollCol = c;
      if (h.includes("status")) statusCol = c;
    }

    // Iterate rows and apply changes
    for (let r = 2; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      const enrollRaw = row.getCell(enrollCol).value;
      const enroll = Number(enrollRaw);
      if (!enroll || !enrollToId.has(enroll)) continue;

      const studentId = enrollToId.get(enroll);
      const statusVal = statusCol ? row.getCell(statusCol).value : undefined;
      const statusStr = String(statusVal || "").toLowerCase();
      const isPresent = statusStr ? ["present", "1", "yes", "y"].includes(statusStr) : null;

      if (isPresent === true) {
        await Attendance.updateOne(
          { sessionId: session._id, studentId },
          { $setOnInsert: { subjectId: session.subjectId } },
          { upsert: true }
        );
      } else if (isPresent === false) {
        await Attendance.deleteOne({ sessionId: session._id, studentId });
      } else {
        // skip if not edited / unclear
      }
    }

    // Keep master consistent if session is closed
    try {
      if (session.closedAt) {
        await regenerateSubjectMasterExcel(req, session.subjectId);
      }
    } catch (e) {
      console.error("Master regeneration after import failed:", e);
    }

    return ApiResponse.success({}, "Session updated from Excel").send(res);
  } catch (err) {
    console.error(err);
    return ApiResponse.internalServerError(err.message).send(res);
  }
};

// Faculty: Remove a student's attendance from a session
exports.removeAttendance = async (req, res) => {
  try {
    const { sessionId, attendanceId } = req.params;
    const session = await AttendanceSession.findById(sessionId);
    if (!session) return ApiResponse.notFound("Session not found").send(res);

    const result = await Attendance.deleteOne({ _id: attendanceId, sessionId });
    if (!result.deletedCount) return ApiResponse.notFound("Attendance not found").send(res);

    // Keep master consistent if session is closed
    try {
      if (session.closedAt) {
        await regenerateSubjectMasterExcel(req, session.subjectId);
      }
    } catch (e) {
      console.error("Master regeneration after delete failed:", e);
    }

    return ApiResponse.success({}, "Attendance removed").send(res);
  } catch (err) {
    console.error(err);
    return ApiResponse.internalServerError(err.message).send(res);
  }
};

exports.exportSessionExcel = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await AttendanceSession.findById(sessionId);
    if (!session) return ApiResponse.notFound("Session not found").send(res);

    const recs = await Attendance.find({ sessionId }).populate("studentId");

    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet("Attendance");
    sheet.columns = [
      { header: "Enrollment No", key: "enroll", width: 15 },
      { header: "Student Name", key: "name", width: 28 },
      { header: "Status", key: "status", width: 10 },
      { header: "Marked At", key: "time", width: 22 },
      { header: "Selfie URL", key: "selfie", width: 50 },
    ];

    recs.forEach((r) => {
      sheet.addRow({
        enroll: r.studentId?.enrollmentNo || "",
        name: `${r.studentId?.firstName || ""} ${r.studentId?.lastName || ""}`.trim(),
        status: r.status,
        time: new Date(r.markedAt).toLocaleString(),
        selfie: r.selfie ? `${req.protocol}://${req.get("host")}/media/${r.selfie}` : "",
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=attendance_${sessionId}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    return ApiResponse.internalServerError(err.message).send(res);
  }
};

// List students marked present for a given session (faculty view)
exports.getSessionAttendanceList = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await AttendanceSession.findById(sessionId);
    if (!session) return ApiResponse.notFound("Session not found").send(res);

    const recs = await Attendance.find({ sessionId })
      .populate("studentId")
      .sort({ markedAt: -1 });

    const list = recs.map((r) => {
      const s = r.studentId || {};
      return {
        attendanceId: r._id,
        studentId: s?._id,
        name: [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" "),
        enrollmentNo: s.enrollmentNo,
        branchName: s.branchId?.name,
        markedAt: r.markedAt,
        selfieUrl: r.selfie ? mediaURL(req, r.selfie) : null,
        profileUrl: s.profile ? mediaURL(req, s.profile) : null,
      };
    });

    return ApiResponse.success(list).send(res);
  } catch (err) {
    console.error(err);
    return ApiResponse.internalServerError(err.message).send(res);
  }
};
