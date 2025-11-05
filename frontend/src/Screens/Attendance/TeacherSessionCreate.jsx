import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import QRCode from "qrcode.react";
import CustomButton from "../../components/CustomButton";

const TeacherSessionCreate = () => {
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({ subjectId: "", branchId: "", semester: "" });
  const [session, setSession] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [present, setPresent] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const SESSION_KEY = "attendance_session";
  const fileInputRef = React.useRef(null);

  // Restore active session from sessionStorage on mount so data survives reload
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.sessionId && parsed?.token && parsed?.expiresAt) {
          setSession(parsed);
        }
      }
    } catch {}
  }, []);

  // Persist session changes during this tab session
  useEffect(() => {
    if (session?.sessionId) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [session]);

  // Load subjects and branches
  useEffect(() => {
    const load = async () => {
      try {
        const token = sessionStorage.getItem("userToken");
        const [s, b] = await Promise.all([
          axiosWrapper.get("/subject", { headers: { Authorization: `Bearer ${token}` } }),
          axiosWrapper.get("/branch", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setSubjects(s.data.data || []);
        setBranches(b.data.data || []);
      } catch (e) {
        toast.error("Failed to load subjects/branches");
      }
    };
    load();
  }, []);

  // Remaining time and polling control
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      const end = new Date(session.expiresAt).getTime();
      const sec = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(sec);
      setIsPolling(sec > 0);
    }, 1000);
    return () => clearInterval(id);
  }, [session]);

  // Poll present list while active
  useEffect(() => {
    if (!session || !isPolling) return;
    const fetchList = async () => {
      try {
        const token = sessionStorage.getItem("userToken");
        const resp = await axiosWrapper.get(`/attendance/session/${session.sessionId}/present`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPresent(resp.data.data || []);
      } catch (e) {}
    };
    fetchList();
    const iid = setInterval(fetchList, 3000);
    return () => clearInterval(iid);
  }, [session, isPolling]);

  const createSession = async () => {
    if (!form.subjectId || !form.branchId || !form.semester) return toast.error("All fields required");
    try {
      const token = sessionStorage.getItem("userToken");
      const resp = await axiosWrapper.post("/attendance/session", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = { ...resp.data.data, subjectId: form.subjectId };
      setSession(payload);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
      setPresent([]);
      setShowDownloads(false);
      toast.success("Session created");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create session");
    }
  };

  const closeSession = async () => {
    if (!session?.sessionId) return;
    try {
      setClosing(true);
      const token = sessionStorage.getItem("userToken");
      await axiosWrapper.post(`/attendance/session/${session.sessionId}/close`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Session closed");
      setIsPolling(false);
      setRemaining(0);
      setSession((prev) => (prev ? { ...prev, closed: true } : prev));
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to close session");
    } finally {
      setClosing(false);
    }
  };

  const downloadExcel = async () => {
    if (!session?.sessionId) return;
    try {
      const token = sessionStorage.getItem("userToken");
      const resp = await axiosWrapper.get(`/attendance/session/${session.sessionId}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance_${session.sessionId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to download excel");
    }
  };

  const downloadSubjectMaster = async () => {
    if (!session?.subjectId) {
      toast.error("Subject not available for this session");
      return;
    }
    try {
      const token = sessionStorage.getItem("userToken");
      const resp = await axiosWrapper.get(`/attendance/subject/${session.subjectId}/master/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `subject_${session.subjectId}_master.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error(e.response?.data?.message || "Master sheet not available yet");
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();
  const uploadEditedExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!session?.sessionId) {
      toast.error("No active session");
      return;
    }
    try {
      const token = sessionStorage.getItem("userToken");
      const formData = new FormData();
      formData.append("file", file);
      await axiosWrapper.post(`/attendance/session/${session.sessionId}/import`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Session updated from Excel");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to import edited excel");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttendance = async (attendanceId) => {
    try {
      const token = sessionStorage.getItem("userToken");
      await axiosWrapper.delete(`/attendance/session/${session.sessionId}/present/${attendanceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPresent((list) => list.filter((it) => it.attendanceId !== attendanceId));
      toast.success("Attendance removed");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to remove attendance");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Create Attendance Session</h2>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="border p-2 rounded">
          <option value="">Select Subject</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
          ))}
        </select>
        <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="border p-2 rounded">
          <option value="">Select Branch</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
        <input type="number" placeholder="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="border p-2 rounded" />
      </div>
      <CustomButton onClick={createSession}>Create Session</CustomButton>

      {session && (
        <div className="mt-6 p-4 border rounded">
          <h3 className="font-semibold mb-2">Share this QR for students to scan</h3>
          <div className="flex gap-6 items-center">
            <QRCode value={session.token} size={200} />
            <div>
              <p className="mb-2">Token: <span className="font-mono">{session.token}</span></p>
              <p className="mb-2">Expires in: <b>{remaining}s</b></p>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex gap-3 items-center flex-wrap">
            <CustomButton onClick={closeSession} disabled={closing || remaining === 0}>
              {closing ? "Closing..." : "Close Session"}
            </CustomButton>
            <CustomButton variant="primary" onClick={() => setShowDownloads(true)}>
              Save
            </CustomButton>
            {showDownloads && (
              <>
                <CustomButton variant="secondary" onClick={downloadExcel}>
                  Download Excel
                </CustomButton>
                <CustomButton variant="secondary" onClick={downloadSubjectMaster}>
                  Download Subject Master
                </CustomButton>
              </>
            )}
            <CustomButton variant="ghost" onClick={triggerUpload}>
              Upload Edited Excel
            </CustomButton>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={uploadEditedExcel} />
          </div>

          {/* Live present cards */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Marked Present ({present.length})</h4>
            {present.length === 0 ? (
              <p className="text-sm text-gray-600">No one has marked present yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {present.map((p) => (
                  <div key={p.attendanceId} className="p-3 border rounded-lg bg-gray-50 hover:bg-white transition shadow-sm hover:shadow-md flex gap-3 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <img
                          src={p.profileUrl || "/assets/avatar.png"}
                          alt={`${p.name} profile`}
                          className="w-12 h-12 rounded-full object-cover border"
                          onError={(e) => { e.currentTarget.src = "/assets/avatar.png"; }}
                        />
                        <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">✓</span>
                      </div>
                      {p.selfieUrl ? (
                        <a href={p.selfieUrl} target="_blank" rel="noreferrer" title="Open selfie">
                          <img
                            src={p.selfieUrl}
                            alt={`${p.name} selfie`}
                            className="w-12 h-12 rounded object-cover border"
                            onError={(e) => { e.currentTarget.src = "/assets/avatar.png"; }}
                          />
                        </a>
                      ) : (
                        <img
                          src={"/assets/avatar.png"}
                          alt={`${p.name} selfie`}
                          className="w-12 h-12 rounded object-cover border"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 mx-2">
                      <p className="font-semibold truncate">{p.name || "Unknown"}</p>
                      <p className="text-sm text-gray-700">{p.enrollmentNo || "-"}</p>
                      <p className="text-xs text-gray-500">{new Date(p.markedAt).toLocaleTimeString()}</p>
                    </div>
                    <CustomButton variant="danger" onClick={() => removeAttendance(p.attendanceId)}>
                      Remove
                    </CustomButton>
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

export default TeacherSessionCreate;

