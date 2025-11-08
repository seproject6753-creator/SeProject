import React, { useEffect, useState } from "react";
import StudentJoinSession from "../Attendance/StudentJoinSession";
import axiosWrapper from "../../utils/AxiosWrapper";

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [summaries, setSummaries] = useState([]);

  const load = async () => {
    try {
      const token = sessionStorage.getItem("userToken");
      const resp = await axiosWrapper.get(`/attendance/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(resp.data.data || []);
    } catch (e) {
      // silent
    }
  };

  const loadSubjectWise = async () => {
    try {
      const token = sessionStorage.getItem("userToken");
      // get my details to know branch and semester
      const me = await axiosWrapper.get(`/student/my-details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const branchId = me.data?.data?.branchId?._id || me.data?.data?.branchId;
      const semester = me.data?.data?.semester;
      if (!branchId || !semester) return;
      const subjResp = await axiosWrapper.get(
        `/subject?branch=${branchId}&semester=${semester}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const subs = subjResp.data?.data || [];
      // parallel fetch summaries for each subject
      const results = await Promise.all(
        subs.map(async (s) => {
          try {
            const r = await axiosWrapper.get(`/attendance/subject/${s._id}/my`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return { subjectId: s._id, name: s.name, code: s.code, ...r.data.data };
          } catch {
            return {
              subjectId: s._id,
              name: s.name,
              code: s.code,
              totalSessions: 0,
              presentCount: 0,
              percentage: 0,
            };
          }
        })
      );
      setSummaries(results);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    load();
    loadSubjectWise();
  }, []);

  // Resolve media base. Prefer env var; otherwise, in production use relative '/media'
  // (works if Netlify proxy is configured). Fallback to localhost for dev.
  const mediaBase =
    process.env.REACT_APP_MEDIA_LINK ||
    (typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? "/media"
  : "http://localhost:4000/media"); // dev-only fallback

  return (
    <div className="px-4 py-6 md:p-8">
      {/* Scanner/Card */}
      <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-white/5 shadow-2xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-bold">Attendance Scanner</h2>
          <div className="h-2 w-28 rounded-full bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)]" />
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/40 p-4">
          {/* StudentJoinSession renders camera UI inside */}
          <StudentJoinSession />
        </div>
      </div>

      {/* Subject-wise Attendance */}
      <div className="mt-8 bg-slate-900/60 backdrop-blur rounded-2xl border border-white/5 shadow-2xl">
        <div
          className="px-5 py-4 border-b border-white/5 flex items-center justify-between rounded-t-2xl"
          style={{ backgroundImage: "linear-gradient(160deg,#0f2133 0%, #071028 100%)" }}
        >
          <h3 className="text-lg md:text-xl font-semibold">Subject-wise Attendance</h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-slate-300">
                <th className="text-left py-3 px-3">SUBJECT</th>
                <th className="text-left py-3 px-3">CODE</th>
                <th className="text-left py-3 px-3">PRESENT</th>
                <th className="text-left py-3 px-3">TOTAL</th>
                <th className="text-left py-3 px-3">%</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.subjectId} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-3 font-medium text-slate-100">{s.name}</td>
                  <td className="py-4 px-3 text-slate-300">{s.code}</td>
                  <td className="py-4 px-3 text-slate-200">{s.presentCount}</td>
                  <td className="py-4 px-3 text-slate-200">{s.totalSessions}</td>
                  <td className="py-4 px-3 font-semibold">
                    <span
                      className={
                        Number(s.percentage) > 0
                          ? "bg-clip-text text-transparent bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)]"
                          : "text-slate-300"
                      }
                    >
                      {s.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
              {summaries.length === 0 && (
                <tr className="border-t border-white/5">
                  <td className="py-6 px-3 text-center text-slate-300" colSpan={5}>
                    No subjects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Attendance History */}
      <div className="mt-8 bg-slate-900/60 backdrop-blur rounded-2xl border border-white/5 shadow-2xl">
        <div
          className="px-5 py-4 border-b border-white/5 flex items-center justify-between rounded-t-2xl"
          style={{ backgroundImage: "linear-gradient(160deg,#0f2133 0%, #071028 100%)" }}
        >
          <h3 className="text-lg md:text-xl font-semibold">My Attendance History</h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-slate-300">
                <th className="text-left py-3 px-3">DATE/TIME</th>
                <th className="text-left py-3 px-3">STATUS</th>
                <th className="text-left py-3 px-3">SELFIE</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-3 text-slate-100">{new Date(r.markedAt).toLocaleString()}</td>
                  <td className="py-4 px-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        r.status === "present"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    {r.selfie ? (
                      <a
                        href={`${mediaBase}/${r.selfie}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#7C4DFF] hover:text-[#00D1B2] underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr className="border-t border-white/5">
                  <td className="py-8 px-3 text-center text-slate-300" colSpan={3}>
                    No attendance yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
