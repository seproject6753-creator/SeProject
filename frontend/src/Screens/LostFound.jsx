import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import axiosWrapper from "../utils/AxiosWrapper";
import CustomButton from "../components/CustomButton";
import Heading from "../components/Heading";

const LostFound = () => {
  const userData = useSelector((s) => s.userData);
  const token = sessionStorage.getItem("userToken");
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    type: "lost",
    title: "",
    description: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    location: "",
    photo: null,
  });
  const [showForm, setShowForm] = useState(false);

  const userType = sessionStorage.getItem("userType");
  const isAdmin = userType === "Admin";
  const isUploader = (item) => userData && String(item.uploaderId) === String(userData._id);

  const fetchItems = async () => {
    try {
      setLoading(true);
      // Fetch all and split client-side
      const resp = await axiosWrapper.get(`/lostfound`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (resp.data.success) {
        const all = resp.data.data || [];
        setLostItems(all.filter((i) => i.type === "lost"));
        setFoundItems(all.filter((i) => i.type === "found"));
      } else {
        setLostItems([]);
        setFoundItems([]);
      }
    } catch (e) {
      if (e?.response?.status === 404) { // no items
        setLostItems([]);
        setFoundItems([]);
      } else {
        toast.error(e.response?.data?.message || "Error loading items");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const onSubmit = async () => {
    if (!form.title || !form.description) {
      toast.error("Title and description are required");
      return;
    }
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "photo") {
          if (v) fd.append("photo", v);
        } else {
          fd.append(k, v ?? "");
        }
      });
      toast.loading("Posting item...");
      const resp = await axiosWrapper.post(`/lostfound`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      toast.dismiss();
      if (resp.data.success) {
        toast.success("Added!");
        setForm({ ...form, title: "", description: "", contactName: "", contactPhone: "", contactEmail: "", location: "", photo: null, type: "lost" });
        setShowForm(false);
        fetchItems();
      } else toast.error(resp.data.message);
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.message || "Error posting item");
    }
  };

  const markClaimed = async (id) => {
    try {
      toast.loading("Marking claimed...");
      const resp = await axiosWrapper.post(`/lostfound/${id}/claim`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.dismiss();
      if (resp.data.success) {
        toast.success("Marked claimed");
        fetchItems();
      } else toast.error(resp.data.message);
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.message || "Error marking claimed");
    }
  };

  const removeItem = async (id) => {
    try {
      toast.loading("Deleting...");
      const resp = await axiosWrapper.delete(`/lostfound/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.dismiss();
      if (resp.data.success) {
        toast.success("Deleted");
        fetchItems();
      } else toast.error(resp.data.message);
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.message || "Error deleting item");
    }
  };

  const formatTimeLeft = (expiresAt) => {
    if (!expiresAt) return null;
    const diffMs = new Date(expiresAt) - new Date();
    if (diffMs <= 0) return "removing soon";
    const days = Math.floor(diffMs / (24*60*60*1000));
    const hours = Math.floor((diffMs % (24*60*60*1000)) / (60*60*1000));
    return `${days}d ${hours}h left`;
  };

  return (
    <div className="w-full mx-auto px-6 lg:px-10 py-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Lost & Found</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center px-5 py-2.5 text-white font-semibold rounded-lg shadow-glow-lg transition-transform hover:-translate-y-1 bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)]"
        >
          {showForm ? 'Close' : 'Report an Item'}
        </button>
      </div>

      {/* Report Form */}
      {showForm && (
        <div className="backdrop-blur bg-[#0f2133]/60 border border-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Report a New Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-slate-400 uppercase">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-900/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              >
                <option value="lost" className="bg-[#071028]">Lost</option>
                <option value="found" className="bg-[#071028]">Found</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Black Wallet"
                className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-900/40 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 uppercase">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the item..."
                className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-900/40 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase">Contact Name</label>
              <input
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="Your Name"
                className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-900/40 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase">Contact Phone</label>
              <input
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="Your Phone"
                className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-900/40 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase">Contact Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="Your Email"
                className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-900/40 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., C-Block, Room 303"
                className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-900/40 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 uppercase">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, photo: e.target.files[0] })}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-900/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6 gap-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-lg font-medium text-white bg-white/5 hover:bg-white/10 backdrop-blur transition"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="px-5 py-2.5 rounded-lg font-semibold text-white shadow-glow-lg bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)] hover:-translate-y-1 transition-transform"
            >
              Post Item
            </button>
          </div>
        </div>
      )}

      {/* Items Lists */}
      {loading ? (
        <div className="text-slate-300">Loading items...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lost Items */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Lost Items</h2>
            <div className="backdrop-blur bg-[#0f2133]/60 border border-white/5 rounded-xl p-6 space-y-4">
              {lostItems.length === 0 ? (
                <p className="text-center text-slate-400 py-4">No lost items reported yet.</p>
              ) : (
                lostItems.map((item) => (
                  <div
                    key={item._id}
                    className="glass rounded-xl border border-white/5 p-4 flex gap-4 hover-outline"
                  >
                    {item.photo && (
                      <div className="w-24 h-24 p-2 bg-white rounded-lg flex-shrink-0">
                        <img
                          src={`${process.env.REACT_APP_MEDIA_LINK + '/' + item.photo}`}
                          alt={item.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <span className="text-xs text-slate-400">{item.status === 'claimed' ? 'Claimed' : 'Open'}{item.expiresAt && item.status === 'claimed' ? ` • ${formatTimeLeft(item.expiresAt)}` : ''}</span>
                      <h3 className="text-xl font-bold text-white mt-1">{item.title}</h3>
                      <p className="text-slate-300 text-sm mt-1">{item.description}</p>
                      {item.location && <p className="text-xs text-slate-400 mt-2">Location: {item.location}</p>}
                      {(item.contactName || item.contactPhone || item.contactEmail) && (
                        <p className="text-xs text-slate-400">Contact: {[item.contactName, item.contactPhone, item.contactEmail].filter(Boolean).join(' • ')}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">Posted on: {new Date(item.createdAt).toLocaleDateString()}</p>
                      <div className="flex gap-2 mt-3">
                        {(isUploader(item) || isAdmin) && item.status === 'open' && (
                          <button
                            onClick={() => markClaimed(item._id)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/10 hover:bg-white/20 transition text-white"
                          >
                            Mark Claimed
                          </button>
                        )}
                        {(isUploader(item) || isAdmin) && (
                          <button
                            onClick={() => removeItem(item._id)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600/80 hover:bg-red-600 transition text-white"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Found Items */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Found Items</h2>
            <div className="space-y-4">
              {foundItems.length === 0 ? (
                <div className="backdrop-blur bg-[#0f2133]/60 border border-white/5 rounded-xl p-6">
                  <p className="text-center text-slate-400 py-4">No found items reported yet.</p>
                </div>
              ) : (
                foundItems.map((item) => (
                  <div
                    key={item._id}
                    className="glass hover-outline rounded-xl border border-teal-400/30 p-4 flex gap-4"
                  >
                    {item.photo && (
                      <div className="w-24 h-24 p-2 bg-white rounded-lg flex-shrink-0">
                        <img
                          src={`${process.env.REACT_APP_MEDIA_LINK + '/' + item.photo}`}
                          alt={item.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <span className="text-xs text-slate-400">{item.status === 'claimed' ? 'Claimed' : 'Open'}{item.expiresAt && item.status === 'claimed' ? ` • ${formatTimeLeft(item.expiresAt)}` : ''}</span>
                      <h3 className="text-xl font-bold text-white mt-1">{item.title}</h3>
                      <p className="text-slate-300 text-sm mt-1">{item.description}</p>
                      {item.location && <p className="text-xs text-slate-400 mt-2">Location: {item.location}</p>}
                      {(item.contactName || item.contactPhone || item.contactEmail) && (
                        <p className="text-xs text-slate-400">Contact: {[item.contactName, item.contactPhone, item.contactEmail].filter(Boolean).join(' • ')}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">Posted on: {new Date(item.createdAt).toLocaleDateString()}</p>
                      <div className="flex gap-2 mt-3">
                        {(isUploader(item) || isAdmin) && item.status === 'open' && (
                          <button
                            onClick={() => markClaimed(item._id)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/10 hover:bg-white/20 transition text-white"
                          >
                            Mark Claimed
                          </button>
                        )}
                        {(isUploader(item) || isAdmin) && (
                          <button
                            onClick={() => removeItem(item._id)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600/80 hover:bg-red-600 transition text-white"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostFound;
