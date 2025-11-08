import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import QRCode from "qrcode.react";
import CustomButton from "../../components/CustomButton";

const SESSION_KEY = "attendance_session";

const TeacherSessionCreate = () => {
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({ subjectId: "", branchId: "", semester: "" });
  const [session, setSession] = useState(null); // {sessionId, token, expiresAt}
  const [remaining, setRemaining] = useState(0);
  const [present, setPresent] = useState([]);
  const [closing, setClosing] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const fileInputRef = useRef(null);

  const tokenHeader = useMemo(() => {
    const token = sessionStorage.getItem("userToken");
    return { Authorization: `Bearer ${token}` };
  }, [sessionStorage.getItem("userToken")]);

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
        const [s, b] = await Promise.all([
          axiosWrapper.get("/subject", { headers: tokenHeader }),
          axiosWrapper.get("/branch", { headers: tokenHeader }),
        ]);
        setSubjects(s.data?.data || []);
        setBranches(b.data?.data || []);
      } catch (e) {
        toast.error("Failed to load subjects/branches");
      }
    };
    load();
  }, []); // load once

  // Remaining time ticker
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      const end = new Date(session.expiresAt).getTime();
      const sec = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(sec);
    }, 1000);
    return () => clearInterval(id);
  }, [session]);

  // Poll present list while active
  useEffect(() => {
    if (!session || remaining === 0) return;
    const id = setInterval(async () => {
      try {
        const resp = await axiosWrapper.get(`/attendance/session/${session.sessionId}/present`, {
          headers: tokenHeader,
        });
        setPresent(resp.data?.data || []);
      } catch {}
    }, 3000);
    // fetch immediately once
    (async () => {
      try {
        const resp = await axiosWrapper.get(`/attendance/session/${session.sessionId}/present`, {
          headers: tokenHeader,
        });
        setPresent(resp.data?.data || []);
      } catch {}
    })();
    return () => clearInterval(id);
  }, [session, remaining]);

  // Actions
  const createSession = async () => {
    try {
      if (!form.subjectId || !form.branchId || !form.semester) {
        return toast.error("Please select subject, branch and semester");
      }
      const resp = await axiosWrapper.post(
        "/attendance/session",
        { subjectId: form.subjectId, branchId: form.branchId, semester: Number(form.semester), durationSec: 300 },
        { headers: tokenHeader }
      );
      const data = resp.data?.data;
      setSession(data);
      setShowDownloads(false);
      setPresent([]);
      toast.success("Session created");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create session");
    }
  };

  const closeSession = async () => {
    if (!session) return;
    try {
      setClosing(true);
      await axiosWrapper.post(`/attendance/session/${session.sessionId}/close`, {}, { headers: tokenHeader });
      toast.success("Session closed");
      // stop timer by setting remaining to 0
      setRemaining(0);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to close session");
    } finally {
      setClosing(false);
    }
  };

  // Clear session completely (close on server if still active, then wipe local state & QR)
  const clearSession = async () => {
    if (!session) return; // nothing to clear
    try {
      // If still active, attempt close to keep backend consistent
      if (remaining > 0) {
        try {
          await axiosWrapper.post(`/attendance/session/${session.sessionId}/close`, {}, { headers: tokenHeader });
        } catch (_) {
          // ignore close errors in clear path
        }
      }
      setSession(null);
      setPresent([]);
      setShowDownloads(false);
      setRemaining(0);
      toast.success("Session cleared");
    } catch (e) {
      toast.error("Failed to clear session");
    }
  };

  const removeAttendance = async (attendanceId) => {
    if (!session) return;
    try {
      await axiosWrapper.delete(`/attendance/session/${session.sessionId}/present/${attendanceId}`, {
        headers: tokenHeader,
      });
      setPresent((list) => list.filter((it) => it.attendanceId !== attendanceId));
      toast.success("Attendance removed");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to remove attendance");
    }
  };

  const downloadExcel = async () => {
    if (!session) return;
    try {
      const res = await axiosWrapper.get(`/attendance/session/${session.sessionId}/export`, {
        headers: tokenHeader,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance_${session.sessionId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Failed to download Excel");
    }
  };

  const downloadSubjectMaster = async () => {
    try {
      if (!form.subjectId) return toast.error("Select a subject first");
      const res = await axiosWrapper.get(`/attendance/subject/${form.subjectId}/master/export`, {
        headers: tokenHeader,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `subject_${form.subjectId}_master.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Master not available");
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const uploadEditedExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      await axiosWrapper.post(`/attendance/session/${session.sessionId}/import`, formData, {
        headers: { ...tokenHeader, "Content-Type": "multipart/form-data" },
      });
      toast.success("Session updated from Excel");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload Excel");
    } finally {
      e.target.value = ""; // reset input
    }
  };

  return (
    <div className="max-w-5xl mx-auto text-white">
      <h2 className="text-xl md:text-2xl font-bold mb-4">Create Attendance Session</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <select
          value={form.subjectId}
          onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
          className="bg-slate-900/60 border border-white/10 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00D1B2]/50"
        >
          <option className="bg-slate-900" value="">Select Subject</option>
          {subjects.map((s) => (
            <option className="bg-slate-900" key={s._id} value={s._id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
        <select
          value={form.branchId}
          onChange={(e) => setForm({ ...form, branchId: e.target.value })}
          className="bg-slate-900/60 border border-white/10 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00D1B2]/50"
        >
          <option className="bg-slate-900" value="">Select Branch</option>
          {branches.map((b) => (
            <option className="bg-slate-900" key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Semester"
          value={form.semester}
          onChange={(e) => setForm({ ...form, semester: e.target.value })}
          className="bg-slate-900/60 border border-white/10 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00D1B2]/50"
        />
      </div>
      <CustomButton className="bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)] text-white font-semibold px-4 py-2 rounded-lg" onClick={createSession}>Create Session</CustomButton>

      {session && (
        <div className="mt-6 p-4 md:p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur shadow-2xl">
          <h3 className="font-semibold mb-3">Share this QR for students to scan</h3>
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="p-3 rounded-xl border border-white/10 bg-slate-900/40">
              {/* Use a high-contrast QR with white background and quiet zone to improve file-scan reliability */}
              <QRCode
                value={session.token}
                size={220}
                bgColor="#ffffff"
                fgColor="#111827"
                includeMargin={true}
                level="M"
              />
            </div>
            <div>
              <p className="mb-2 text-slate-300">
                Token: <span className="font-mono text-slate-100">{session.token}</span>
              </p>
              <p className="mb-2 text-slate-300">
                Expires in: <b className="text-slate-100">{remaining}s</b>
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-5 flex gap-3 items-center flex-wrap">
            <CustomButton
              className="bg-red-500/20 hover:bg-red-500/30 text-red-200 font-medium px-3 py-2 rounded-lg border border-red-500/30"
              onClick={closeSession}
              disabled={closing || remaining === 0}
            >
              {closing ? "Closing..." : "Close Session"}
            </CustomButton>
            <CustomButton
              className="bg-red-600/30 hover:bg-red-600/40 text-red-200 font-semibold px-3 py-2 rounded-lg border border-red-600/40"
              onClick={clearSession}
              disabled={!session}
            >
              Clear
            </CustomButton>
            <CustomButton
              className="bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)] text-white font-semibold px-3 py-2 rounded-lg"
              onClick={() => setShowDownloads(true)}
            >
              Save
            </CustomButton>
            {showDownloads && (
              <>
                <CustomButton
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium px-3 py-2 rounded-lg border border-white/10"
                  onClick={downloadExcel}
                >
                  Download Excel
                </CustomButton>
                <CustomButton
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium px-3 py-2 rounded-lg border border-white/10"
                  onClick={downloadSubjectMaster}
                >
                  Download Subject Master
                </CustomButton>
              </>
            )}
            <CustomButton
              className="bg-transparent hover:bg-white/5 text-slate-100 font-medium px-3 py-2 rounded-lg border border-white/10"
              onClick={triggerUpload}
            >
              Upload Edited Excel
            </CustomButton>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={uploadEditedExcel} />
          </div>

          {/* Live present cards */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Marked Present ({present.length})</h4>
            {present.length === 0 ? (
              <p className="text-sm text-slate-300">No one has marked present yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {present.map((p) => (
                  <div
                    key={p.attendanceId}
                    className="p-3 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-900/60 transition shadow-sm hover:shadow-md flex gap-3 items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <img
                          src={p.profileUrl || "/assets/avatar.png"}
                          alt={`${p.name} profile`}
                          className="w-12 h-12 rounded-full object-cover border border-white/10"
                          onError={(e) => {
                            e.currentTarget.src = "/assets/avatar.png";
                          }}
                        />
                        <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">✓</span>
                      </div>
                      {p.selfieUrl ? (
                        <a href={p.selfieUrl} target="_blank" rel="noreferrer" title="Open selfie">
                          <img
                            src={p.selfieUrl}
                            alt={`${p.name} selfie`}
                            className="w-12 h-12 rounded object-cover border border-white/10"
                            onError={(e) => {
                              e.currentTarget.src = "/assets/avatar.png";
                            }}
                          />
                        </a>
                      ) : (
                        <img
                          src={"/assets/avatar.png"}
                          alt={`${p.name} selfie`}
                          className="w-12 h-12 rounded object-cover border border-white/10"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 mx-2">
                      <p className="font-semibold truncate text-slate-100">{p.name || "Unknown"}</p>
                      <p className="text-sm text-slate-300">{p.enrollmentNo || "-"}</p>
                      <p className="text-xs text-slate-400">{new Date(p.markedAt).toLocaleTimeString()}</p>
                    </div>
                    <CustomButton
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-200 font-medium px-3 py-2 rounded-lg border border-red-500/30"
                      onClick={() => removeAttendance(p.attendanceId)}
                    >
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

