import React from "react";
import Login from "./Screens/Login";
import { BrowserRouter as Router, Routes, Route, NavLink, Outlet, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import mystore from "./redux/store";
import StudentHome from "./Screens/Student/Home";
import StudentProfile from "./Screens/Student/Profile";
import StudentAttendance from "./Screens/Student/Attendance";
import StudentTimetable from "./Screens/Student/Timetable";
import StudentMaterial from "./Screens/Student/Material";
import StudentUpcomingEvents from "./Screens/Student/UpcomingEvents";
import StudentViewMarks from "./Screens/Student/ViewMarks";
import Societies from "./Screens/Societies";
import Notice from "./Screens/Notice";
import LostFound from "./Screens/LostFound";
import FacultyHome from "./Screens/Faculty/Home";
import FacultyLayoutShell from "./components/FacultyLayoutShell";
import FacultyProfile from "./Screens/Faculty/Profile";
import FacultyAttendance from "./Screens/Faculty/Attendance";
import FacultyTimetable from "./Screens/Faculty/Timetable";
import FacultyMaterial from "./Screens/Faculty/Material";
import FacultyAddMarks from "./Screens/Faculty/AddMarks";
import AdminHome from "./Screens/Admin/Home";
import AdminLayoutShell from "./components/AdminLayoutShell";
import AdminProfile from "./Screens/Admin/Profile";
import AdminStudent from "./Screens/Admin/Student";
import AdminFaculty from "./Screens/Admin/Faculty";
import AdminBranch from "./Screens/Admin/Branch";
import AdminSubject from "./Screens/Admin/Subject";
import ForgetPassword from "./Screens/ForgetPassword";
import UpdatePassword from "./Screens/UpdatePassword";
import Chatbot from "./components/Chatbot";
// Sidebar layout shell for student routes
const StudentLayoutShell = () => {
  const navItems = [
    { to: "/student", label: "Home", end: true },
    { to: "/student/profile", label: "Profile" },
    { to: "/student/attendance", label: "Attendance" },
    { to: "/student/societies", label: "Societies" },
    { to: "/student/events", label: "Upcoming Events" },
    { to: "/student/timetable", label: "Timetable" },
    { to: "/student/material", label: "Material" },
    { to: "/student/marks", label: "Marks" },
    { to: "/student/lostfound", label: "Lost & Found" }
  ];
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#071028] via-[#07162a] to-[#071028] text-white">
      <aside className="w-60 hidden md:flex flex-col glass p-0 border-r border-white/5">
        <div className="h-20 flex items-center justify-center border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)]" />
            <span className="text-lg font-semibold">Student Sphere</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all sidebar-link ${isActive ? 'bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)] text-white shadow-glow-lg' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-16 flex items-center justify-between px-5 glass border-b border-white/5 sticky top-0 z-10">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <button className="text-slate-300 hover:text-white transition-colors">🔔</button>
            <button
              onClick={() => {
                sessionStorage.removeItem('userToken');
                sessionStorage.removeItem('userType');
                window.location.href = '/login';
              }}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};


const App = () => {
  return (
    <>
      <Provider store={mystore}>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forget-password" element={<ForgetPassword />} />
            <Route
              path="/:type/update-password/:resetId"
              element={<UpdatePassword />}
            />
            <Route
              path="student/*"
              element={
                <StudentLayoutShell />
              }
            >
              <Route index element={<StudentHome />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="attendance" element={<StudentAttendance />} />
              <Route path="societies" element={<Societies />} />
              <Route path="events" element={<StudentUpcomingEvents />} />
              <Route path="timetable" element={<StudentTimetable />} />
              <Route path="material" element={<StudentMaterial />} />
              {/* Exam route removed */}
              <Route path="marks" element={<StudentViewMarks />} />
              <Route path="lostfound" element={<LostFound />} />
              <Route path="notice" element={<Notice />} />
            </Route>
            <Route
              path="faculty/*"
              element={<FacultyLayoutShell />}
            >
              <Route index element={<FacultyHome />} />
              <Route path="profile" element={<FacultyProfile />} />
              <Route path="attendance" element={<FacultyAttendance />} />
              <Route path="timetable" element={<FacultyTimetable />} />
              <Route path="material" element={<FacultyMaterial />} />
              <Route path="marks" element={<FacultyAddMarks />} />
              <Route path="societies" element={<Societies />} />
              <Route path="events" element={<StudentUpcomingEvents />} />
              <Route path="lostfound" element={<LostFound />} />
              <Route path="notice" element={<Notice />} />
              {/* Exam route removed */}
            </Route>
            <Route path="admin/*" element={<AdminLayoutShell />}>
              <Route index element={<AdminHome />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="student" element={<AdminStudent />} />
              <Route path="faculty" element={<AdminFaculty />} />
              <Route path="branch" element={<AdminBranch />} />
              <Route path="subjects" element={<AdminSubject />} />
              <Route path="notice" element={<Notice />} />
              <Route path="societies" element={<Societies />} />
              <Route path="lostfound" element={<LostFound />} />
            </Route>
            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {/* Global chatbot - visible on all routes */}
          <Chatbot />
        </Router>
      </Provider>
    </>
  );
};

export default App;
