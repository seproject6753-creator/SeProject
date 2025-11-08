import React from "react";
import TeacherSessionCreate from "../Attendance/TeacherSessionCreate";

const Attendance = () => {
  return (
    <div className="px-4 py-6 md:p-8 text-white">
      <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-white/5 shadow-2xl p-6" style={{backgroundImage:"linear-gradient(160deg,#0f2133 0%, #071028 100%)"}}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Attendance Session</h2>
          <div className="h-2 w-24 rounded-full bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)]" />
        </div>
        <TeacherSessionCreate />
      </div>
    </div>
  );
};

export default Attendance;
