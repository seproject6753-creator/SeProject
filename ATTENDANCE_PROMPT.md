Title: Add QR-based Selfie Attendance System to College-Management-System (MERN)

Context:
- Monorepo: backend (Node/Express/MongoDB/Mongoose), frontend (React + Redux minimal, react-scripts)
- API base: http://localhost:4000/api
- Media base: http://localhost:4000/media
- JWT-based auth. Authorization header is required: `Authorization: Bearer <token>`.
- Existing folders:
  - backend/controllers, routes, models, middlewares (multer), utils/ApiResponse
  - frontend/src/Screens for Admin, Faculty, Student, with a dashboard-style `Home.jsx` per role

Goal:
Implement an attendance feature where faculty creates a QR session; students scan the QR with their phone, a 5-second timer triggers a selfie capture, and attendance is marked with the selfie saved on the server. Faculty can export attendance to Excel. Students can view their own attendance. Integrate cleanly with the existing project.

Key Requirements:
1) Faculty flow
   - Create a session with subject, branch, semester, and duration (default 5 minutes).
   - Display a QR code that encodes a short session token.
   - Show a live countdown until session expiry.
   - Allow exporting the session to an Excel file listing enrolled students who marked present with timestamp and selfie URL.

2) Student flow
   - Scan the QR token using the device camera.
   - Trigger a 5-second countdown and capture a selfie automatically.
   - Submit attendance with the selfie; store file on backend and persist record.
   - Show a "present" card with timestamp and selfie preview.
   - Provide a "My Attendance" list.

3) Backend
   - Models:
     - AttendanceSession: { token, facultyId, subjectId, branchId, semester, expiresAt, closedAt, timestamps }
       - TTL index on `expiresAt` (partial: only when `closedAt` is not set)
     - Attendance: { sessionId, studentId, subjectId, selfie, markedAt, status="present", timestamps }
       - Unique compound index: { sessionId, studentId }
   - Endpoints (under /api/attendance):
     - POST /session (auth: faculty) -> { sessionId, token, expiresAt }
     - GET /session/token/:token -> session status and context (active, expiresAt, totalMarked)
     - POST /session/:sessionId/close (auth) -> mark closed
     - POST /mark?token=... (auth: student, multipart) -> mark present, upload selfie to `media/attendance`
     - GET /my (auth: student) -> list student's attendance
     - GET /session/:sessionId/export (auth: faculty) -> Excel download (xlsx)
   - Use existing ApiResponse helper and JWT auth middleware.
   - Use route-scoped multer storage to save selfies in `backend/media/attendance`.
   - Use `exceljs` to generate the export; include columns: Enrollment No, Name, Status, Marked At (local), Selfie URL.

4) Frontend
   - Faculty screens (under src/Screens/Attendance):
     - TeacherSessionCreate.jsx: form (subject, branch, semester) + Create button; show QR (qrcode.react) and expiry countdown.
   - Student screens:
     - StudentJoinSession.jsx: QR scanner (react-qr-reader), 5s countdown, selfie capture (react-webcam), submit to API.
     - Student/Attendance.jsx: wraps join UI and shows table of "My Attendance".
   - Add menu item "Attendance" to Faculty/Home.jsx and Student/Home.jsx.
   - Use axiosWrapper with Authorization header from localStorage token.

5) AI extension (optional/next):
   - Add face verification using face-api.js or an external service to match selfie with the student's profile photo.
   - Add location constraint (within a campus geofence).
   - Add session whitelist by subject enrollment.

Constraints:
- Keep changes isolated and consistent with existing code style.
- Do not break existing features (material uploads, marks, etc.).
- Keep auth simple: rely on current JWT (userId) and role via UI separation.

Deliverables:
- Backend: new models, controller, routes wired in `backend/index.js`.
- Frontend: new screens and menu integration.
- Add dependencies: backend `exceljs`; frontend `qrcode.react`, `react-qr-reader`, `react-webcam`.
- Minimal usage docs in README or a separate section.

Acceptance Criteria:
- Faculty can create a session, display QR, see countdown.
- Student can scan with phone, a selfie is captured after 5 seconds, and attendance is marked.
- Selfie file is stored and visible via /media/... URL.
- Faculty can download an Excel for a session.
- Student can view a list of their attendance entries.
- All endpoints respond with the ApiResponse format.
