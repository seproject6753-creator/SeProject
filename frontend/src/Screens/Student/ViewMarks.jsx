import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import Heading from "../../components/Heading";
import { useSelector } from "react-redux";

const ViewMarks = () => {
  const userData = useSelector((state) => state.userData);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(
    userData?.semester || 1
  );
  const [marks, setMarks] = useState([]);
  const userToken = sessionStorage.getItem("userToken");

  const fetchMarks = async (semester) => {
    setDataLoading(true);
    toast.loading("Loading marks...");
    try {
      const response = await axiosWrapper.get(
        `/marks/student?semester=${semester}`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      if (response.data.success) {
        setMarks(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching marks");
    } finally {
      setDataLoading(false);
      toast.dismiss();
    }
  };

  useEffect(() => {
    fetchMarks(userData?.semester || 1);
  }, []);

  const handleSemesterChange = (e) => {
    const semester = e.target.value;
    setSelectedSemester(semester);
    fetchMarks(semester);
  };

  const midTermMarks = marks.filter((mark) => mark.examId.examType === "mid");
  const endTermMarks = marks.filter((mark) => mark.examId.examType === "end");

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10 px-3 md:px-0">
      <div className="flex justify-between items-center w-full mb-6">
        <Heading title="View Marks" />
        <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur border border-white/10 rounded-lg px-4 py-2">
          <label className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Semester</label>
          <select
            value={selectedSemester || ""}
            onChange={handleSemesterChange}
            className="px-3 py-2 rounded-md bg-slate-800/60 border border-white/10 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="rounded-xl p-6 bg-slate-900/50 backdrop-blur border border-white/10">
          <h2 className="text-lg font-semibold mb-4 text-white">Mid Term Marks</h2>
          {dataLoading ? (
            <p className="text-slate-400">Loading...</p>
          ) : midTermMarks.length > 0 ? (
            <div className="space-y-4">
              {midTermMarks.map((mark) => (
                <div key={mark._id} className="rounded-lg p-4 bg-slate-800/60 border border-white/10 hover:border-white/20 transition">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-medium text-slate-100">{mark.subjectId.name}</p>
                      <p className="text-xs text-slate-400">{mark.examId.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold bg-gradient-to-r from-teal-400 to-indigo-500 text-transparent bg-clip-text">
                        {mark.marksObtained}
                      </p>
                      <p className="text-xs text-slate-400">out of {mark.examId.totalMarks}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No mid term marks available</p>
          )}
        </div>
        <div className="rounded-xl p-6 bg-slate-900/50 backdrop-blur border border-white/10">
          <h2 className="text-lg font-semibold mb-4 text-white">End Term Marks</h2>
          {dataLoading ? (
            <p className="text-slate-400">Loading...</p>
          ) : endTermMarks.length > 0 ? (
            <div className="space-y-4">
              {endTermMarks.map((mark) => (
                <div key={mark._id} className="rounded-lg p-4 bg-slate-800/60 border border-white/10 hover:border-white/20 transition">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-medium text-slate-100">{mark.subjectId.name}</p>
                      <p className="text-xs text-slate-400">{mark.examId.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold bg-gradient-to-r from-teal-400 to-indigo-500 text-transparent bg-clip-text">
                        {mark.marksObtained}
                      </p>
                      <p className="text-xs text-slate-400">out of {mark.examId.totalMarks}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No end term marks available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewMarks;
