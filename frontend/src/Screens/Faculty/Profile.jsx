import React, { useState, useEffect } from "react";
import CustomButton from "../../components/CustomButton";
import UpdatePasswordLoggedIn from "../../components/UpdatePasswordLoggedIn";
import axiosWrapper from "../../utils/AxiosWrapper";

const Profile = ({ profileData: propProfile }) => {
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const [profileData, setProfileData] = useState(propProfile || null);
  const [loading, setLoading] = useState(!propProfile);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propProfile) return; // use provided data
    const load = async () => {
      try {
        const token = sessionStorage.getItem("userToken");
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }
        const resp = await axiosWrapper.get(`/faculty/my-details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.data?.success) {
          setProfileData(resp.data.data);
        } else {
          setError(resp.data?.message || "Failed to load profile");
        }
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [propProfile]);

  if (loading) return <div className="p-8 text-slate-300">Loading profile...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!profileData) return <div className="p-8 text-slate-400">No profile data.</div>;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 text-white">
      {/* Header Card */}
      <div className="rounded-xl p-6 lg:p-8 mb-8 border border-white/5 shadow-xl" style={{backgroundImage:"linear-gradient(90deg, rgba(0,209,178,0.12), rgba(124,77,255,0.08))"}}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={`${process.env.REACT_APP_MEDIA_LINK}/${profileData.profile}`}
              alt="Profile"
              className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-[#00D1B2]/60"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">{`${profileData.firstName || ''} ${profileData.lastName || ''}`.trim()}</h1>
              <p className="text-slate-300 mt-1">Employee ID: {profileData.employeeId}</p>
              <p className="text-slate-300">{profileData.designation}</p>
            </div>
          </div>
          <div className="shrink-0">
            <CustomButton
              onClick={() => setShowPasswordUpdate(!showPasswordUpdate)}
              className="bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)] px-5 py-2.5 rounded-lg text-white font-semibold"
            >
              {showPasswordUpdate ? "Hide" : "Update Password"}
            </CustomButton>
          </div>
        </div>
        {showPasswordUpdate && (
          <div className="mt-6">
            <UpdatePasswordLoggedIn onClose={() => setShowPasswordUpdate(false)} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 rounded-xl p-6 border border-white/5 bg-slate-900/50 backdrop-blur">
          <h2 className="text-xl font-bold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Info label="Email" value={profileData.email} />
            <Info label="Phone" value={profileData.phone} />
            <Info label="Gender" value={profileData.gender} />
            <Info label="Blood Group" value={profileData.bloodGroup} />
            <Info label="Date of Birth" value={formatDate(profileData.dob)} />
            <Info label="Status" value={profileData.status} />
          </div>
        </div>

        {/* Employment Information */}
        <div className="rounded-xl p-6 border border-white/5 bg-slate-900/50 backdrop-blur">
          <h2 className="text-xl font-bold mb-4">Employment</h2>
          <div className="grid grid-cols-1 gap-4">
            <Info label="Employee ID" value={profileData.employeeId} />
            <Info label="Designation" value={profileData.designation} />
            <Info label="Joining Date" value={formatDate(profileData.joiningDate)} />
            <Info label="Salary" value={`₹${(profileData.salary ?? 0).toLocaleString()}`} />
          </div>
        </div>

        {/* Address Information */}
        <div className="lg:col-span-3 rounded-xl p-6 border border-white/5 bg-slate-900/50 backdrop-blur">
          <h2 className="text-xl font-bold mb-4">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Info className="md:col-span-2" label="Address" value={profileData.address} />
            <Info label="City" value={profileData.city} />
            <Info label="State" value={profileData.state} />
            <Info label="Pincode" value={profileData.pincode} />
            <Info label="Country" value={profileData.country} />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="lg:col-span-3 rounded-xl p-6 border border-white/5 bg-slate-900/50 backdrop-blur">
          <h2 className="text-xl font-bold mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Info label="Name" value={profileData.emergencyContact?.name} />
            <Info label="Relationship" value={profileData.emergencyContact?.relationship} />
            <Info label="Phone" value={profileData.emergencyContact?.phone} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value, className = "" }) => (
  <div className={className}>
    <p className="text-slate-400 text-xs uppercase tracking-wide">{label}</p>
    <p className="mt-1 font-medium">{value}</p>
  </div>
);

export default Profile;
