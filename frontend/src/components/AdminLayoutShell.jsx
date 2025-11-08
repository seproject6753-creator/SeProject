import React from "react";
import { NavLink, Outlet } from "react-router-dom";

// Admin layout shell using the same dark / glass theme as Student & Faculty
const AdminLayoutShell = () => {
  const navItems = [
    { to: "/admin", label: "Home", end: true },
    { to: "/admin/student", label: "Students" },
    { to: "/admin/faculty", label: "Faculty" },
    { to: "/admin/branch", label: "Branches" },
    { to: "/admin/subjects", label: "Subjects" },
    { to: "/admin/notice", label: "Notice" },
    { to: "/admin/societies", label: "Societies" },
    { to: "/admin/lostfound", label: "Lost & Found" }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#071028] via-[#07162a] to-[#071028] text-white">
      <aside className="w-60 hidden md:flex flex-col glass p-0 border-r border-white/5">
        <div className="h-20 flex items-center justify-center border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)]" />
            <span className="text-lg font-semibold">Admin Sphere</span>
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
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
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

export default AdminLayoutShell;