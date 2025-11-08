import React, { useEffect, useState } from "react";
import { MdLink } from "react-icons/md";
import Heading from "../../components/Heading";
import { useSelector } from "react-redux";
import axiosWrapper from "../../utils/AxiosWrapper";
import toast from "react-hot-toast";
import CustomButton from "../../components/CustomButton";
import Loading from "../../components/Loading";

const Material = () => {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const userData = useSelector((state) => state.userData);
  const [filters, setFilters] = useState({
    subject: "",
    type: "",
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [filters]);

  const fetchSubjects = async () => {
    try {
      setDataLoading(true);
      const response = await axiosWrapper.get(
        `/subject?semester=${userData.semester}&branch=${userData.branchId._id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("userToken")}`,
          },
        }
      );
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (error) {
      if (error && error.response && error.response.status === 404) {
        setSubjects([]);
        return;
      }
      toast.error(error?.response?.data?.message || "Failed to load subjects");
    } finally {
      setDataLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      setDataLoading(true);
      const queryParams = new URLSearchParams({
        semester: userData.semester,
        branch: userData.branchId._id,
      });

      if (filters.subject) queryParams.append("subject", filters.subject);
      if (filters.type) queryParams.append("type", filters.type);

      const response = await axiosWrapper.get(`/material?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("userToken")}`,
        },
      });
      if (response.data.success) {
        setMaterials(response.data.data);
      }
    } catch (error) {
      if (error && error.response && error.response.status === 404) {
        setMaterials([]);
        return;
      }
      toast.error(error?.response?.data?.message || "Failed to load materials");
    } finally {
      setDataLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10 px-3 md:px-0">
      <Heading title="Study Materials" className="text-white" />

      {!dataLoading && (
        <div className="w-full mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/50 backdrop-blur border border-white/10 rounded-xl p-4">
            <div>
              <label className="block text-xs font-semibold tracking-wide text-slate-300 mb-1 uppercase">Subject</label>
              <select
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 rounded-md bg-slate-800/60 border border-white/10 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide text-slate-300 mb-1 uppercase">Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 rounded-md bg-slate-800/60 border border-white/10 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Types</option>
                <option value="notes">Notes</option>
                <option value="assignment">Assignment</option>
                <option value="syllabus">Syllabus</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {dataLoading && <Loading />}

      {!dataLoading && (
        <div className="w-full mt-8 overflow-x-auto">
          <table className="text-sm min-w-full bg-slate-900/40 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
            <thead className="bg-gradient-to-r from-teal-600 to-indigo-600">
              <tr className="text-white text-xs tracking-wide uppercase">
                <th className="py-3 px-4 text-left font-semibold">File</th>
                <th className="py-3 px-4 text-left font-semibold">Title</th>
                <th className="py-3 px-4 text-left font-semibold">Subject</th>
                <th className="py-3 px-4 text-left font-semibold">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {materials && materials.length > 0 ? (
                materials.map((material) => (
                  <tr key={material._id} className="hover:bg-slate-800/60 transition">
                    <td className="py-3 px-4">
                      <CustomButton
                        variant="primary"
                        className="bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-600 !p-2"
                        onClick={() => {
                          window.open(
                            `${process.env.REACT_APP_MEDIA_LINK}/${material.file}`
                          );
                        }}
                      >
                        <MdLink className="text-xl" />
                      </CustomButton>
                    </td>
                    <td className="py-3 px-4 text-slate-200">{material.title}</td>
                    <td className="py-3 px-4 text-slate-300">{material.subject.name}</td>
                    <td className="py-3 px-4 capitalize text-slate-400">{material.type}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-sm py-10 text-slate-400">No materials found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Material;
