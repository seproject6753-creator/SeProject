import React, { useEffect, useState } from "react";
import StudentJoinSession from "../Attendance/StudentJoinSession";
import axiosWrapper from "../../utils/AxiosWrapper";

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [summaries, setSummaries] = useState([]);

  const load = async () => {
    try {
  const token = sessionStorage.getItem("userToken");
      const resp = await axiosWrapper.get(`/attendance/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(resp.data.data || []);
    } catch (e) {}
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
      const subjResp = await axiosWrapper.get(`/subject?branch=${branchId}&semester=${semester}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subs = subjResp.data?.data || [];
      setSubjects(subs);
      // parallel fetch summaries for each subject
      const results = await Promise.all(
        subs.map(async (s) => {
          try {
            const r = await axiosWrapper.get(`/attendance/subject/${s._id}/my`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return { subjectId: s._id, name: s.name, code: s.code, ...r.data.data };
          } catch {
            return { subjectId: s._id, name: s.name, code: s.code, totalSessions: 0, presentCount: 0, percentage: 0 };
          }
        })
      );
      setSummaries(results);
    } catch (e) {}
  };

  useEffect(() => {
    load();
    loadSubjectWise();
  }, []);

  return (
    <div>
      <StudentJoinSession />
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Subject-wise Attendance</h3>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Subject</th>
                <th className="p-2 border">Code</th>
                <th className="p-2 border">Present</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">%</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.subjectId}>
                  <td className="p-2 border">{s.name}</td>
                  <td className="p-2 border">{s.code}</td>
                  <td className="p-2 border">{s.presentCount}</td>
                  <td className="p-2 border">{s.totalSessions}</td>
                  <td className="p-2 border">{s.percentage}%</td>
                </tr>
              ))}
              {summaries.length === 0 && (
                <tr>
                  <td className="p-2 border text-center" colSpan={5}>No subjects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-semibold mb-2">My Attendance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Date/Time</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Selfie</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td className="p-2 border">{new Date(r.markedAt).toLocaleString()}</td>
                  <td className="p-2 border">{r.status}</td>
                  <td className="p-2 border">
                    {r.selfie && (
                      <a href={`${process.env.REACT_APP_MEDIA_LINK}/${r.selfie}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">View</a>
                    )}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td className="p-2 border text-center" colSpan={3}>No attendance yet.</td>
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
