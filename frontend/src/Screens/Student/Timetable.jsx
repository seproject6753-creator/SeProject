import React, { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import Heading from "../../components/Heading";
import { useSelector } from "react-redux";
import axiosWrapper from "../../utils/AxiosWrapper";
import { toast } from "react-hot-toast";
import Loading from "../../components/Loading";

const Timetable = () => {
  const [timetable, setTimetable] = useState("");
  const userData = useSelector((state) => state.userData);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const getTimetable = async () => {
      try {
        setDataLoading(true);
        const response = await axiosWrapper.get(
          `/timetable?semester=${userData.semester}&branch=${userData.branchId?._id}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("userToken")}`,
            },
          }
        );
        if (response.data.success && response.data.data.length > 0) {
          setTimetable(response.data.data[0].link);
        } else {
          setTimetable("");
        }
      } catch (error) {
        if (error?.response?.status === 404) {
          setTimetable("");
          return;
        }
        toast.error(error.response?.data?.message || "Error fetching timetable");
        console.error(error);
      } finally {
        setDataLoading(false);
      }
    };
    userData && getTimetable();
  }, [userData, userData?.branchId, userData?.semester]);

  const mediaBase = process.env.REACT_APP_MEDIA_LINK;

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 text-white">
      {/* Header / Actions */}
      <div className="rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={{backgroundImage:"linear-gradient(90deg, rgba(0,209,178,0.15), rgba(124,77,255,0.10))"}}>
        <Heading title={`Semester ${userData.semester} Timetable`} />
        {!dataLoading && timetable && (
          <button
            className="flex items-center gap-2 bg-slate-900/40 hover:bg-slate-900/60 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium transition"
            onClick={() => window.open(`${mediaBase}/${timetable}`)}
          >
            <FiDownload /> Download
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mt-8 min-h-[300px]">
        {dataLoading && (
          <div className="rounded-2xl p-10 border border-white/5 bg-slate-900/40 backdrop-blur flex items-center justify-center">
            <Loading />
          </div>
        )}

        {!dataLoading && timetable && (
          <div className="rounded-2xl p-4 border border-white/5 bg-slate-900/60 backdrop-blur shadow-xl flex justify-center">
            {timetable.toLowerCase().endsWith(".pdf") ? (
              <object
                data={`${mediaBase}/${timetable}#toolbar=1`}
                type="application/pdf"
                className="w-full h-[70vh] rounded-lg"
              >
                <p className="text-slate-300 p-4">
                  Your browser can't display this PDF. You can download it instead.
                </p>
              </object>
            ) : (
              <img
                className="rounded-lg max-w-full h-auto"
                src={`${mediaBase}/${timetable}`}
                alt="timetable"
              />
            )}
          </div>
        )}

        {!dataLoading && !timetable && (
          <div className="rounded-2xl p-10 border border-white/5 bg-slate-900/40 backdrop-blur text-center text-slate-300">
            No Timetable Available At The Moment!
          </div>
        )}
      </div>
    </div>
  );
};

export default Timetable;
