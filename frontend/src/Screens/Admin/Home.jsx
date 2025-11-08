import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import { useDispatch } from "react-redux";
import { setUserData } from "../../redux/actions";

// Simplified Admin Home (Dashboard) styled with dark/glass theme.
// Original menu-based layout removed in favor of sidebar navigation from AdminLayoutShell.
const Home = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const userToken = sessionStorage.getItem("userToken");

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const response = await axiosWrapper.get(`/admin/my-details`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        if (response.data.success) {
          setProfileData(response.data.data);
          dispatch(setUserData(response.data.data));
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error fetching profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [dispatch, userToken]);
  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 text-white">
      {/* Hero */}
      <div className="rounded-xl p-6 border border-white/5 bg-slate-900/50 backdrop-blur shadow-lg mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold">Welcome back, Admin!</h1>
        <p className="mt-2 text-slate-300 text-sm">Here's your summary for today.</p>
      </div>

      {/* Grid like student dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Profile */}
        <div className="rounded-xl p-5 border border-white/5 bg-slate-900/60 backdrop-blur shadow flex flex-col">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300 mb-3">PROFILE SNAPSHOT</h2>
          {loading && <p className="text-slate-400 text-sm">Loading...</p>}
          {!loading && profileData && (
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{profileData.firstName} {profileData.lastName}</p>
              <p className="text-slate-300">{profileData.email}</p>
              <p className="text-slate-400 text-xs">Role: {profileData.isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
            </div>
          )}
          {!loading && !profileData && <p className="text-slate-400 text-sm">Profile unavailable.</p>}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl p-5 border border-white/5 bg-slate-900/60 backdrop-blur shadow flex flex-col">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300 mb-3">QUICK ACTIONS</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => window.location.href='/admin/branch'} className="px-3 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10">Manage Branches</button>
            <button onClick={() => window.location.href='/admin/subjects'} className="px-3 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10">Subjects</button>
            <button onClick={() => window.location.href='/admin/student'} className="px-3 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10">Students</button>
            <button onClick={() => window.location.href='/admin/faculty'} className="px-3 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10">Faculty</button>
            <button onClick={() => window.location.href='/admin/notice'} className="px-3 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10">Notices</button>
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-xl p-5 border border-white/5 bg-slate-900/60 backdrop-blur shadow flex flex-col">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300 mb-3">SYSTEM STATUS</h2>
          <p className="text-slate-300 text-xs">All services operational.</p>
          <div className="mt-4 h-2 w-full bg-slate-800 rounded">
            <div className="h-full w-4/5 bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)] rounded" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Uptime (placeholder)</p>
        </div>
      </div>

      {/* Recent Notices placeholder */}
      <div className="rounded-xl p-6 border border-white/5 bg-slate-900/50 backdrop-blur shadow mb-10">
        <h2 className="text-lg font-semibold mb-4">Recent Notices</h2>
        <p className="text-slate-400 text-sm">View and manage notices from the sidebar.</p>
      </div>
    </div>
  );
};

export default Home;
