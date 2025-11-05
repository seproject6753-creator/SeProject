import React, { useEffect, useMemo, useState } from "react";
import axiosWrapper from "../utils/AxiosWrapper";
import { Toaster, toast } from "react-hot-toast";
import CustomButton from "../components/CustomButton";

const SectionTitle = ({ children }) => (
  <h3 className="text-lg font-semibold mt-6 mb-2">{children}</h3>
);

const SocietyCard = ({ s, onSelect }) => (
  <div
    className="border rounded p-4 hover:shadow cursor-pointer bg-white"
    onClick={() => onSelect(s)}
  >
    <div className="text-sm uppercase text-gray-500">{s.category}</div>
    <div className="text-xl font-semibold">{s.name}</div>
    <div className="text-gray-600 mt-1 line-clamp-2">{s.about}</div>
  </div>
);

const PeopleList = ({ title, items, actions }) => (
  <div className="mt-3">
    <div className="font-medium mb-2">{title}</div>
    <div className="grid grid-cols-1 gap-2">
      {items.map((m) => (
        <div key={`${m._id}`} className="border rounded p-3 flex items-center gap-3 bg-white w-full">
          {m.profile ? (
            <img src={m.profile} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
              {m.name?.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium">{m.name}</div>
            <div className="text-xs text-gray-500">{m.email}</div>
          </div>
          {actions && <div className="ml-auto flex gap-2 shrink-0">{actions(m)}</div>}
        </div>
      ))}
      {items.length === 0 && <div className="text-gray-500 text-sm">No one yet</div>}
    </div>
  </div>
);

const Societies = () => {
  const [societies, setSocieties] = useState([]);
  const [selected, setSelected] = useState(null); // society object
  const [members, setMembers] = useState({ heads: [], coordinators: [], members: [], myRole: null });
  const [events, setEvents] = useState([]);
  const [creating, setCreating] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", description: "", date: "", location: "" });
  const [manageForm, setManageForm] = useState({ userId: "", role: "member" });
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [aboutEdit, setAboutEdit] = useState("");
  const [activitiesEdit, setActivitiesEdit] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const token = sessionStorage.getItem("userToken");

  const grouped = useMemo(() => {
    return {
      cultural: societies.filter((s) => s.category === "cultural"),
      technical: societies.filter((s) => s.category === "technical"),
    };
  }, [societies]);

  const loadSocieties = async () => {
    setListLoading(true);
    try {
      const res = await axiosWrapper.get("/societies");
      if (res.data.success) setSocieties(res.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load societies");
    } finally { setListLoading(false); }
  };

  const loadSociety = async (soc) => {
    setSelected(soc);
    try {
      setDetailLoading(true);
      const detail = await axiosWrapper.get(`/societies/${soc.slug}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (detail.data.success) {
        const d = detail.data.data;
        setSelected(d.society);
        setMembers({ heads: d.heads || [], coordinators: d.coordinators || [], members: d.members || [], myRole: d.myRole || null });
        setAboutEdit(d.society.about || "");
        setActivitiesEdit((d.society.activities || []).join("\n"));
        const ev = await axiosWrapper.get(`/societies/${d.society._id}/events`);
        if (ev.data.success) setEvents(ev.data.data);
      } else toast.error(detail.data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load society");
    } finally {
      setDetailLoading(false);
    }
  };

  const createEvent = async () => {
    if (!selected) return;
    if (!eventForm.title || !eventForm.date) {
      toast.error("Title and date are required");
      return;
    }
    setCreating(true);
    try {
      const resp = await axiosWrapper.post(
        `/societies/${selected._id}/events`,
        eventForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.data.success) {
        toast.success("Event created");
        setEventForm({ title: "", description: "", date: "", location: "" });
        // reload events
        const ev = await axiosWrapper.get(`/societies/${selected._id}/events`);
        if (ev.data.success) setEvents(ev.data.data);
      } else toast.error(resp.data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadSocieties();
  }, []);

  const changeRole = async (memberId, role) => {
    try {
      const resp = await axiosWrapper.patch(
        `/societies/${selected._id}/members/${memberId}`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.data.success) {
        toast.success("Role updated");
        await loadSociety(selected);
      } else toast.error(resp.data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update role");
    }
  };

  const removeMember = async (memberId) => {
    try {
      const resp = await axiosWrapper.delete(
        `/societies/${selected._id}/members/${memberId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.data.success) {
        toast.success("Member removed");
        await loadSociety(selected);
      } else toast.error(resp.data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to remove member");
    }
  };

  const updateSociety = async () => {
    try {
      const activities = activitiesEdit
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const resp = await axiosWrapper.patch(
        `/societies/${selected._id}`,
        { about: aboutEdit, activities },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.data.success) {
        toast.success("Society info updated");
        setSelected(resp.data.data);
      } else toast.error(resp.data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update society");
    }
  };

  return (
    <div className="max-w-6xl mx-auto mb-10">
      <Toaster position="bottom-center" />
      {!selected ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Societies</h2>
          {listLoading ? (
            <div className="flex justify-center items-center h-40 text-gray-600">Loading societies...</div>
          ) : (
          <>
          <SectionTitle>Cultural</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {grouped.cultural.map((s) => (
              <SocietyCard key={s._id} s={s} onSelect={loadSociety} />
            ))}
          </div>
          <SectionTitle>Technical</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {grouped.technical.map((s) => (
              <SocietyCard key={s._id} s={s} onSelect={loadSociety} />
            ))}
          </div>
          </>
          )}
        </div>
      ) : (
        <div>
          {detailLoading && (
            <div className="mb-3 text-sm text-blue-700 bg-blue-50 border border-blue-100 p-2 rounded">Fetching details...</div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <CustomButton onClick={() => setSelected(null)}>Back</CustomButton>
            <h2 className="text-2xl font-bold">{selected.name}</h2>
            <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 uppercase">{selected.category}</span>
            {!members.myRole && (
              <button
                className="ml-auto text-xs px-3 py-1 border rounded"
                onClick={async()=>{
                  try {
                    const resp = await axiosWrapper.post(`/societies/${selected._id}/become-head`, {}, { headers: { Authorization: `Bearer ${token}` } });
                    if (resp.data.success) { toast.success("You are a head now"); await loadSociety(selected); }
                    else toast.error(resp.data.message);
                  } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
                }}
              >Become Head (dev)</button>
            )}
          </div>
          {selected.about && (
            <div className="bg-white border rounded p-4 mb-4">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-gray-700 whitespace-pre-line">{selected.about}</p>
            </div>
          )}
          {selected.activities?.length > 0 && (
            <div className="bg-white border rounded p-4 mb-4">
              <h3 className="font-semibold mb-2">What we do</h3>
              <ul className="list-disc pl-5 text-gray-700">
                {selected.activities.map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border rounded p-4">
              <h3 className="font-semibold mb-2">Team</h3>
              <PeopleList title="Heads" items={members.heads} actions={(m)=> (
                members.myRole === "head" && (members.heads?.length || 0) > 1 ? (
                  <>
                    <button className="text-xs px-2 py-1 border rounded" onClick={()=>changeRole(m._id, "coordinator")}>Demote</button>
                    <button className="text-xs px-2 py-1 border rounded" onClick={()=>removeMember(m._id)}>Remove</button>
                  </>
                ) : null
              )} />
              <PeopleList title="Coordinators" items={members.coordinators} actions={(m)=> (
                members.myRole === "head" ? (
                  <>
                    <button className="text-xs px-2 py-1 border rounded" onClick={()=>changeRole(m._id, "head")}>Promote</button>
                    <button className="text-xs px-2 py-1 border rounded" onClick={()=>changeRole(m._id, "member")}>Demote</button>
                    <button className="text-xs px-2 py-1 border rounded" onClick={()=>removeMember(m._id)}>Remove</button>
                  </>
                ) : null
              )} />
              <PeopleList title="Members" items={members.members} actions={(m)=> (
                members.myRole === "head" ? (
                  <>
                    <button className="text-xs px-2 py-1 border rounded" onClick={()=>changeRole(m._id, "coordinator")}>Promote</button>
                    <button className="text-xs px-2 py-1 border rounded" onClick={()=>removeMember(m._id)}>Remove</button>
                  </>
                ) : null
              )} />
              {members.myRole === "head" && (
                <div className="mt-4 border-t pt-4">
                  <div className="font-semibold mb-2">Manage Members</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                    <input
                      className="border rounded px-3 py-2"
                      placeholder="User ID"
                      value={manageForm.userId}
                      onChange={(e) => setManageForm({ ...manageForm, userId: e.target.value })}
                    />
                    <select
                      className="border rounded px-3 py-2"
                      value={manageForm.role}
                      onChange={(e) => setManageForm({ ...manageForm, role: e.target.value })}
                    >
                      <option value="member">Member</option>
                      <option value="coordinator">Coordinator</option>
                      <option value="head">Head</option>
                    </select>
                    <CustomButton
                      onClick={async () => {
                        try {
                          const resp = await axiosWrapper.post(
                            `/societies/${selected._id}/members`,
                            manageForm,
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          if (resp.data.success) {
                            toast.success("Member added");
                            setManageForm({ userId: "", role: "member" });
                            // refresh roster
                            await loadSociety(selected);
                          } else toast.error(resp.data.message);
                        } catch (e) {
                          toast.error(e.response?.data?.message || "Failed to add member");
                        }
                      }}
                    >
                      Add
                    </CustomButton>
                  </div>
                  <div className="mt-4">
                    <div className="font-medium mb-2">Search users</div>
                    <div className="flex gap-2 mb-2">
                      <input className="border rounded px-3 py-2 flex-1" placeholder="Search by name, email, enrollment/employee id" value={searchQ} onChange={(e)=>setSearchQ(e.target.value)} />
                      <CustomButton onClick={async ()=>{
                        try {
                          const resp = await axiosWrapper.get(`/societies/search-users?q=${encodeURIComponent(searchQ)}`, { headers: { Authorization: `Bearer ${token}` } });
                          if (resp.data.success) setSearchResults(resp.data.data);
                          else toast.error(resp.data.message);
                        } catch (e) {
                          toast.error(e.response?.data?.message || "Search failed");
                        }
                      }}>Search</CustomButton>
                    </div>
                    {searchResults.length > 0 && (
                      <ul className="space-y-2 max-h-60 overflow-auto">
                        {searchResults.map((u)=> (
                          <li key={`${u.userType}-${u.userId}`} className="border rounded p-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {u.profile ? <img src={u.profile} alt={u.name} className="w-8 h-8 rounded-full object-cover"/> : <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">{u.name?.charAt(0)}</div>}
                              <div>
                                <div className="font-medium text-sm">{u.name}</div>
                                <div className="text-xs text-gray-500">{u.email}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {(["member","coordinator","head"]).map((r)=> (
                                <button key={r} className="text-xs px-2 py-1 border rounded" onClick={async()=>{
                                  try {
                                    const resp = await axiosWrapper.post(`/societies/${selected._id}/members`, { userId: u.userId, role: r }, { headers: { Authorization: `Bearer ${token}` } });
                                    if (resp.data.success) { toast.success(`Added as ${r}`); await loadSociety(selected); }
                                    else toast.error(resp.data.message);
                                  } catch (e) {
                                    toast.error(e.response?.data?.message || "Failed to add");
                                  }
                                }}>{r}</button>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white border rounded p-4">
              <h3 className="font-semibold mb-2">Upcoming Events</h3>
              {events.length === 0 && <div className="text-gray-500 text-sm">No upcoming events</div>}
              <ul className="space-y-3">
                {events.map((ev) => (
                  <li key={ev._id} className="border rounded p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{ev.title}</div>
                        <div className="text-sm text-gray-600">{new Date(ev.date).toLocaleString()} • {ev.location}</div>
                        {ev.description && <div className="text-gray-700 mt-1 whitespace-pre-line">{ev.description}</div>}
                      </div>
                      {members.myRole === "head" && (
                        <button className="text-xs px-2 py-1 border rounded" onClick={async()=>{
                          try { 
                            const resp = await axiosWrapper.patch(`/societies/${selected._id}/events/${ev._id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
                            if (resp.data.success) { toast.success("Cancelled"); await loadSociety(selected); }
                            else toast.error(resp.data.message);
                          } catch (e) { toast.error(e.response?.data?.message || "Failed to cancel"); }
                        }}>Cancel</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {(members.myRole === "coordinator" || members.myRole === "head") && (
                <div className="mt-4 border-t pt-4">
                  <div className="font-semibold mb-2">Schedule an event</div>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      className="border rounded px-3 py-2"
                      placeholder="Title"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    />
                    <textarea
                      className="border rounded px-3 py-2"
                      placeholder="Description"
                      rows={3}
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    />
                    <input
                      type="datetime-local"
                      className="border rounded px-3 py-2"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    />
                    <input
                      className="border rounded px-3 py-2"
                      placeholder="Location"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    />
                    <div className="flex justify-end">
                      <CustomButton onClick={createEvent} disabled={creating}>
                        {creating ? "Creating..." : "Create Event"}
                      </CustomButton>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {members.myRole === "head" && (
            <div className="bg-white border rounded p-4 mt-4">
              <h3 className="font-semibold mb-2">Edit Society Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">About</div>
                  <textarea className="border rounded px-3 py-2 w-full" rows={6} value={aboutEdit} onChange={(e)=>setAboutEdit(e.target.value)} />
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Activities (one per line)</div>
                  <textarea className="border rounded px-3 py-2 w-full" rows={6} value={activitiesEdit} onChange={(e)=>setActivitiesEdit(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <CustomButton onClick={updateSociety}>Save</CustomButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Societies;
