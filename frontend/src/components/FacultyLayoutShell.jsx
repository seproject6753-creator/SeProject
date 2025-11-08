import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const FacultyLayoutShell = () => {
  const navItems = [
    { to: "/faculty", label: "Home", end: true },
    { to: "/faculty/profile", label: "Profile" },
    { to: "/faculty/attendance", label: "Attendance" },
    { to: "/faculty/societies", label: "Societies" },
    { to: "/faculty/events", label: "Upcoming Events" },
    { to: "/faculty/timetable", label: "Timetable" },
    { to: "/faculty/material", label: "Material" },
    { to: "/faculty/marks", label: "Marks" },
    { to: "/faculty/lostfound", label: "Lost & Found" }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#071028] via-[#07162a] to-[#071028] text-white">
      <aside className="w-60 hidden md:flex flex-col glass p-0 border-r border-white/5">
        <div className="h-20 flex items-center justify-center border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)]" />
            <span className="text-lg font-semibold">Faculty Sphere</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {navItems.map((item) => (
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
          <h1 className="text-xl font-bold">Faculty Dashboard</h1>
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

export default FacultyLayoutShell;
