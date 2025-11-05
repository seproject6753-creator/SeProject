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
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
      {loading && <div>Loading...</div>}
      {!loading && events.length === 0 && <div className="text-gray-600">No upcoming events yet.</div>}
      <ul className="space-y-3">
        {events.map((ev) => (
          <li key={ev._id} className="bg-white border rounded p-4">
            <div className="text-sm text-gray-500 uppercase">{ev.societyId?.category} • {ev.societyId?.name}</div>
            <div className="text-lg font-semibold">{ev.title}</div>
            <div className="text-sm text-gray-600">{new Date(ev.date).toLocaleString()} • {ev.location}</div>
            {ev.description && <div className="text-gray-700 mt-1">{ev.description}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UpcomingEvents;
