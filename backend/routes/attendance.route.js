const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Create attendance-only multer storage to media/attendance
const attendanceDir = path.join(__dirname, "..", "media", "attendance");
if (!fs.existsSync(attendanceDir)) {
  fs.mkdirSync(attendanceDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, attendanceDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

const controller = require("../controllers/attendance.controller");

// Faculty creates a session
router.post("/session", auth, controller.createSession);

// Get session status by token (anyone)
router.get("/session/token/:token", controller.getSessionByToken);

// Close a session (faculty)
router.post("/session/:sessionId/close", auth, controller.closeSession);

// Student marks attendance with selfie (requires auth)
router.post("/mark", auth, upload.single("selfie"), controller.markAttendance);

// Student views own attendance
router.get("/my", auth, controller.getMyAttendance);

// Export a session to Excel (faculty)
router.get("/session/:sessionId/export", auth, controller.exportSessionExcel);

// Import edited session Excel (faculty)
router.post("/session/:sessionId/import", auth, upload.single("file"), controller.importSessionExcel);

// List present students for a session (faculty)
router.get("/session/:sessionId/present", auth, controller.getSessionAttendanceList);

// Remove a student's attendance from a session
router.delete("/session/:sessionId/present/:attendanceId", auth, controller.removeAttendance);

// Subject master: student subject-wise attendance summary
router.get("/subject/:subjectId/my", auth, controller.getMySubjectAttendance);

// Subject master excel download
router.get("/subject/:subjectId/master/export", auth, controller.downloadSubjectMaster);

module.exports = router;
