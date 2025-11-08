import React, { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import Notice from "../Notice";
import { useDispatch } from "react-redux";
import { setUserData } from "../../redux/actions";
import axiosWrapper from "../../utils/AxiosWrapper";
import Timetable from "./Timetable";
import Material from "./Material";
import StudentFinder from "./StudentFinder";
import Profile from "./Profile";
import Marks from "./AddMarks";
import Attendance from "./Attendance";
import Exam from "../Exam";
import LostFound from "../LostFound";
import Societies from "../Societies";
import { useNavigate } from "react-router-dom";

// Static menu registry (logic preserved)
const MENU_ITEMS = [
  { id: "home", label: "Home", component: null },
  { id: "timetable", label: "Timetable", component: Timetable },
  { id: "material", label: "Material", component: Material },
  { id: "notice", label: "Notice", component: Notice },
  { id: "student info", label: "Student Info", component: StudentFinder },
  { id: "marks", label: "Marks", component: Marks },
  { id: "exam", label: "Exam", component: Exam },
  { id: "attendance", label: "Attendance", component: Attendance },
  { id: "lostfound", label: "Lost & Found", component: LostFound },
  { id: "societies", label: "Societies", component: Societies },
];

const Home = () => {
  const [selectedMenu, setSelectedMenu] = useState("Home");
  const [profileData, setProfileData] = useState(null);
  const dispatch = useDispatch();
  const userToken = sessionStorage.getItem("userToken");
  const navigate = useNavigate();

  // Load faculty profile (logic unchanged)
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axiosWrapper.get("/faculty/my-details", {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        if (response.data.success) {
          setProfileData(response.data.data);
          dispatch(setUserData(response.data.data));
        }
      } catch (error) {
        toast.error("Failed to load profile");
      }
    };
    fetchUserDetails();
  }, [dispatch, userToken]);

  const dashboardContent = () => {
    const facultyName = `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim() || 'Faculty';
    return (
      <div className="p-4 lg:p-6">
        <h1 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8 hidden lg:block">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="md:col-span-2 xl:col-span-3 p-6 rounded-xl backdrop-blur bg-slate-900/40 border border-white/5 shadow-xl" style={{backgroundImage:"linear-gradient(90deg, rgba(0,209,178,0.12), rgba(124,77,255,0.08))"}}>
            <h2 className="text-2xl font-bold">Welcome back, {facultyName}!</h2>
            <p className="text-slate-300 mt-1">Here's your summary for today.</p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-400 uppercase">Teaching Overview</h3>
              <p className="text-sm mt-2 text-slate-300">Employee ID: <span className="font-semibold text-white">{profileData?.employeeId || '—'}</span></p>
              <p className="text-sm text-slate-300">Designation: <span className="font-semibold text-white">{profileData?.designation || '—'}</span></p>
              <button onClick={() => navigate('/faculty/timetable')} className="text-sm inline-block mt-4 text-teal-400 hover:brightness-110">Go to Timetable →</button>
            </div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[linear-gradient(180deg,#00D1B2,#7C4DFF)] text-white font-bold">TT</div>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => navigate('/faculty/attendance')} className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/5 backdrop-blur bg-slate-900/40 transition-transform hover:-translate-y-1 hover:scale-105">
                <span className="text-sm font-medium">Take Attendance</span>
              </button>
              <button onClick={() => navigate('/faculty/marks')} className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/5 backdrop-blur bg-slate-900/40 transition-transform hover:-translate-y-1 hover:scale-105">
                <span className="text-sm font-medium">Add Marks</span>
              </button>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5">
            <h3 className="text-lg font-semibold mb-4">My Societies</h3>
            <p className="text-slate-300">You're not moderating any society yet.</p>
            <span className="mt-3 inline-block px-4 py-2 rounded-lg text-white" style={{backgroundImage:"linear-gradient(90deg,#00D1B2,#7C4DFF)"}}>Explore Societies</span>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5">
            <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex flex-col items-center justify-center" style={{backgroundImage:"linear-gradient(180deg,#00D1B2,#7C4DFF)"}}>
                <span className="text-base font-bold text-white">28</span>
                <span className="text-[10px] -mt-1 text-white/90">NOV</span>
              </div>
              <div>
                <h4 className="font-medium">Faculty Meetup</h4>
                <p className="text-sm text-slate-400">ACADEMICS</p>
              </div>
            </div>
            <span className="text-sm mt-4 inline-block text-violet-400">View All Events →</span>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Recent Notices</h3>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-violet-500/10">
                <span className="text-violet-400">•</span>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="font-medium">Department Update</h4>
                <p className="text-sm text-slate-400">Exam committee meeting at 4 PM.</p>
              </div>
              <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
            </div>
            <span className="text-sm mt-4 inline-block text-teal-400">View All Notices →</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4">
        {dashboardContent()}
      </div>
      <Toaster position="bottom-center" />
    </>
  );
};

export default Home;
