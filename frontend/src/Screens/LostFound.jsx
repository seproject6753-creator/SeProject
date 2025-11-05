import React, { useEffect, useMemo, useState } from "react";
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
    <div className="w-full mx-auto mt-10 flex flex-col mb-10">
      <div className="flex justify-between items-center w-full">
        <Heading title="Lost & Found" />
        <div>
          <CustomButton onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "Report"}
          </CustomButton>
        </div>
      </div>

      {/* Post form (hidden by default) */}
      {showForm && (
        <div className="bg-white mt-6 p-4 rounded shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Type</label>
              <select value={form.type} onChange={(e)=>setForm({...form, type:e.target.value})} className="w-full border rounded px-3 py-2">
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Title</label>
              <input value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Description</label>
              <textarea value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} className="w-full border rounded px-3 py-2" rows={2} />
            </div>
            <div>
              <label className="block text-sm mb-1">Contact Name</label>
              <input value={form.contactName} onChange={(e)=>setForm({...form, contactName:e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Contact Phone</label>
              <input value={form.contactPhone} onChange={(e)=>setForm({...form, contactPhone:e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Contact Email</label>
              <input value={form.contactEmail} onChange={(e)=>setForm({...form, contactEmail:e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Location</label>
              <input value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Photo</label>
              <input type="file" accept="image/*" onChange={(e)=>setForm({...form, photo:e.target.files[0]})} />
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <CustomButton variant="secondary" onClick={()=>setShowForm(false)}>Cancel</CustomButton>
            <CustomButton onClick={onSubmit}>Post</CustomButton>
          </div>
        </div>
      )}

      {/* Items lists */}
      {loading ? (
        <div className="mt-6">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Lost Items</h2>
            {lostItems.length === 0 ? (
              <p className="text-sm text-gray-500">No lost items yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lostItems.map((item) => (
                  <div
                    key={item._id}
                    className={`p-4 rounded shadow ${
                      item.status === 'claimed'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-white'
                    }`}
                  >
                    {item.photo && (
                      <img src={`${process.env.REACT_APP_MEDIA_LINK + "/" + item.photo}`} alt={item.title} className="w-full h-40 object-cover rounded" />
                    )}
                    <h3 className="text-lg font-semibold mt-3">{item.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{item.description}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      <div>Status: {item.status}{item.expiresAt && item.status === 'claimed' ? ` • ${formatTimeLeft(item.expiresAt)}` : ''}</div>
                      {item.location && <div>Location: {item.location}</div>}
                      {(item.contactName || item.contactPhone || item.contactEmail) && (
                        <div className="mt-1">
                          Contact: {[item.contactName, item.contactPhone, item.contactEmail].filter(Boolean).join(" • ")}
                        </div>
                      )}
                      <div>Posted on: {new Date(item.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {isUploader(item) && item.status === 'open' && (
                        <CustomButton variant="secondary" onClick={() => markClaimed(item._id)}>Mark Claimed</CustomButton>
                      )}
                      {isUploader(item) && (
                        <CustomButton variant="danger" onClick={() => removeItem(item._id)}>Delete</CustomButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3">Found Items</h2>
            {foundItems.length === 0 ? (
              <p className="text-sm text-gray-500">No found items yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {foundItems.map((item) => (
                  <div
                    key={item._id}
                    className={`p-4 rounded shadow ${
                      item.status === 'claimed'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-white'
                    }`}
                  >
                    {item.photo && (
                      <img src={`${process.env.REACT_APP_MEDIA_LINK + "/" + item.photo}`} alt={item.title} className="w-full h-40 object-cover rounded" />
                    )}
                    <h3 className="text-lg font-semibold mt-3">{item.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{item.description}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      <div>Status: {item.status}{item.expiresAt && item.status === 'claimed' ? ` • ${formatTimeLeft(item.expiresAt)}` : ''}</div>
                      {item.location && <div>Location: {item.location}</div>}
                      {(item.contactName || item.contactPhone || item.contactEmail) && (
                        <div className="mt-1">
                          Contact: {[item.contactName, item.contactPhone, item.contactEmail].filter(Boolean).join(" • ")}
                        </div>
                      )}
                      <div>Posted on: {new Date(item.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {isUploader(item) && item.status === 'open' && (
                        <CustomButton variant="secondary" onClick={() => markClaimed(item._id)}>Mark Claimed</CustomButton>
                      )}
                      {isUploader(item) && (
                        <CustomButton variant="danger" onClick={() => removeItem(item._id)}>Delete</CustomButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LostFound;
