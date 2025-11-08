import React, { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import Notice from "../Notice";
import { useDispatch } from "react-redux";
import { setUserData } from "../../redux/actions";
import axiosWrapper from "../../utils/AxiosWrapper";
import Timetable from "./Timetable";
import Material from "./Material";
import Profile from "./Profile";
import Exam from "../Exam";
import LostFound from "../LostFound";
import Societies from "../Societies";
import UpcomingEvents from "./UpcomingEvents";
import ViewMarks from "./ViewMarks";
import Attendance from "./Attendance";
import { useNavigate } from "react-router-dom";

// This component now renders only the dashboard content; navigation is via left sidebar
const Home = () => {
  const [profileData, setProfileData] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const userToken = sessionStorage.getItem("userToken");
  const navigate = useNavigate();

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      toast.loading("Loading user details...");
      const response = await axiosWrapper.get(`/student/my-details`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setProfileData(response.data.data);
        dispatch(setUserData(response.data.data));
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Error fetching user details"
      );
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [dispatch, userToken]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">Loading...</div>
      );
    }

    {
      const studentName = profileData?.name || "Student";
      const attendancePct = profileData?.attendancePercentage ?? 85;
      return (
        <div className="p-4 lg:p-6">
          <h1 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8 hidden lg:block">Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="md:col-span-2 xl:col-span-3 p-6 rounded-xl backdrop-blur bg-slate-900/40 border border-white/5 shadow-xl" style={{backgroundImage:"linear-gradient(90deg, rgba(0,209,178,0.12), rgba(124,77,255,0.08))"}}>
              <h2 className="text-2xl font-bold">Welcome back, {studentName}!</h2>
              <p className="text-slate-300 mt-1">Here's your summary for today.</p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-400 uppercase">Attendance</h3>
                <p className="text-3xl font-bold mt-2">{attendancePct}%</p>
                <button onClick={() => handleMenuClick("attendance")} className="text-sm inline-block mt-4 text-teal-400 hover:brightness-110">View Details →</button>
              </div>
              <div className="w-24 h-24 relative">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="#0a142a" strokeWidth="10" fill="none" />
                  <circle cx="50" cy="50" r="45" stroke="#00D1B2" strokeWidth="10" fill="none" strokeDasharray="282.7" strokeDashoffset={`${282.7 - (attendancePct/100)*282.7}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">{attendancePct}%</span>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleMenuClick("attendance")} className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/5 backdrop-blur bg-slate-900/40 transition-transform hover:-translate-y-1 hover:scale-105">
                  <span className="text-sm font-medium">Join Attendance</span>
                </button>
                <button onClick={() => handleMenuClick("marks")} className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/5 backdrop-blur bg-slate-900/40 transition-transform hover:-translate-y-1 hover:scale-105">
                  <span className="text-sm font-medium">View Marks</span>
                </button>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5">
              <h3 className="text-lg font-semibold mb-4">My Societies</h3>
              <p className="text-slate-300">You haven't joined any societies yet.</p>
              <button onClick={() => handleMenuClick("societies")} className="mt-3 inline-block px-4 py-2 rounded-lg text-white" style={{backgroundImage:"linear-gradient(90deg,#00D1B2,#7C4DFF)"}}>Explore Societies</button>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5">
              <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex flex-col items-center justify-center" style={{backgroundImage:"linear-gradient(180deg,#00D1B2,#7C4DFF)"}}>
                  <span className="text-base font-bold text-white">28</span>
                  <span className="text-[10px] -mt-1 text-white/90">NOV</span>
                </div>
                <div>
                  <h4 className="font-medium">Cultural Fest</h4>
                  <p className="text-sm text-slate-400">CULTURAL + AMS</p>
                </div>
              </div>
              <button onClick={() => handleMenuClick("events")} className="text-sm mt-4 text-violet-400 hover:brightness-110">View All Events →</button>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Recent Notices</h3>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-violet-500/10">
                  <span className="text-violet-400">•</span>
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="font-medium">Campus Notice</h4>
                  <p className="text-sm text-slate-400">Please check the updated timetable.</p>
                </div>
                <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
              </div>
              <button onClick={() => handleMenuClick("notice")} className="text-sm mt-4 text-teal-400 hover:brightness-110">View All Notices →</button>
            </div>
          </div>
        </div>
      );
    }
  };


  const handleMenuClick = (menuId) => {
    navigate(`/student/${menuId === 'home' ? '' : menuId}`);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
  <Toaster position="bottom-center" />
    </>
  );
};

export default Home;
