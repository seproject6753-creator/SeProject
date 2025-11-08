import React, { useState } from "react";
import UpdatePasswordLoggedIn from "../../components/UpdatePasswordLoggedIn";
import CustomButton from "../../components/CustomButton";

const Profile = ({ profileData }) => {
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);
  if (!profileData) return <div className="p-6 text-slate-400">No profile data.</div>;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 text-white">
      {/* Header */}
      <div className="rounded-2xl p-6 border border-white/5 shadow-xl mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6" style={{backgroundImage:"linear-gradient(90deg, rgba(0,209,178,0.12), rgba(124,77,255,0.08))"}}>
        <div className="flex items-center gap-5">
          <img
            src={`${process.env.REACT_APP_MEDIA_LINK}/${profileData.profile}`}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover ring-4 ring-[#00D1B2]/50"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">{profileData.firstName} {profileData.lastName}</h1>
            <p className="text-slate-300 text-sm md:text-base">Employee ID: {profileData.employeeId}</p>
            <p className="text-slate-300 text-sm md:text-base">{profileData.designation}{profileData.isSuperAdmin && " (Super Admin)"}</p>
          </div>
        </div>
        <CustomButton
          onClick={() => setShowUpdatePasswordModal(true)}
          className="bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)] text-white px-5 py-2.5 rounded-lg font-semibold"
        >
          Update Password
        </CustomButton>
        {showUpdatePasswordModal && (
          <div className="mt-4 w-full md:w-auto">
            <UpdatePasswordLoggedIn onClose={() => setShowUpdatePasswordModal(false)} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Personal Information */}
        <div className="rounded-xl p-6 border border-white/5 bg-slate-900/50 backdrop-blur">
          <h2 className="text-xl font-bold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Info label="Email" value={profileData.email} />
            <Info label="Phone" value={profileData.phone} />
            <Info label="Gender" value={profileData.gender} />
            <Info label="Blood Group" value={profileData.bloodGroup} />
            <Info label="Date of Birth" value={formatDate(profileData.dob)} />
            <Info label="Joining Date" value={formatDate(profileData.joiningDate)} />
            <Info label="Salary" value={`₹${profileData.salary?.toLocaleString()}`} />
            <Info label="Status" value={profileData.status} />
            <Info label="Role" value={profileData.isSuperAdmin ? "Super Admin" : "Admin"} />
          </div>
        </div>

        {/* Address Information */}
        <div className="rounded-xl p-6 border border-white/5 bg-slate-900/50 backdrop-blur">
          <h2 className="text-xl font-bold mb-4">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Info label="Address" value={profileData.address} className="md:col-span-2" />
            <Info label="City" value={profileData.city} />
            <Info label="State" value={profileData.state} />
            <Info label="Pincode" value={profileData.pincode} />
            <Info label="Country" value={profileData.country} />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="rounded-xl p-6 border border-white/5 bg-slate-900/50 backdrop-blur">
          <h2 className="text-xl font-bold mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
