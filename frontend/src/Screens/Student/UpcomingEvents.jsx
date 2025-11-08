import React, { useEffect, useState } from "react";
import axiosWrapper from "../../utils/AxiosWrapper";
import { toast } from "react-hot-toast";

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosWrapper.get("/societies/events/upcoming");
      if (res.data.success) setEvents(res.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-0">
      <h2 className="text-2xl font-bold mb-4 text-white">Upcoming Events</h2>
      {loading && (
        <div className="text-slate-400">Loading...</div>
      )}
      {!loading && events.length === 0 && (
        <div className="text-slate-400">No upcoming events yet.</div>
      )}
      <ul className="space-y-3">
        {events.map((ev) => (
          <li key={ev._id} className="rounded-xl p-4 bg-slate-900/50 backdrop-blur border border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-indigo-500 text-white flex flex-col items-center justify-center text-xs font-bold shrink-0">
                <div>{new Date(ev.date).getDate().toString().padStart(2, "0")}</div>
                <div className="uppercase text-[10px] tracking-wide">{new Date(ev.date).toLocaleString(undefined,{month:'short'})}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-teal-300/80">{ev.societyId?.category} • {ev.societyId?.name}</div>
                <div className="text-lg font-semibold text-white">{ev.title}</div>
                <div className="text-sm text-slate-400">{new Date(ev.date).toLocaleString()} • {ev.location}</div>
                {ev.description && <div className="text-slate-300 mt-1 whitespace-pre-line">{ev.description}</div>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UpcomingEvents;
