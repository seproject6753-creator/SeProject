import React, { useEffect, useState } from "react";
import { FiUpload } from "react-icons/fi";
import { MdOutlineDelete, MdEdit, MdViewComfy, MdLink } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import Heading from "../../components/Heading";
import { AiOutlineClose } from "react-icons/ai";
import toast from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import DeleteConfirm from "../../components/DeleteConfirm";
import CustomButton from "../../components/CustomButton";

const AddTimetableModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  branches,
}) => {
  const [formData, setFormData] = useState({
    branch: initialData?.branch || "",
    semester: initialData?.semester || "",
    file: null,
    previewUrl: initialData?.file || "",
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/80 text-white shadow-2xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10" style={{backgroundImage:"linear-gradient(90deg, rgba(0,209,178,0.12), rgba(124,77,255,0.08))"}}>
          <h2 className="text-lg md:text-xl font-semibold">
            {initialData ? "Edit Timetable" : "Add New Timetable"}
          </h2>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <IoMdClose className="text-2xl" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block mb-2 text-slate-300 text-sm">Branch</label>
            <select
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              className="w-full px-4 py-2 rounded-md bg-slate-900/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#00D1B2]/40"
            >
              <option className="bg-slate-900" value="">Select Branch</option>
              {branches?.map((b) => (
                <option className="bg-slate-900" key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-slate-300 text-sm">Semester</label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              className="w-full px-4 py-2 rounded-md bg-slate-900/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#00D1B2]/40"
            >
              <option className="bg-slate-900" value="">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option className="bg-slate-900" key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-slate-300 text-sm">Timetable File</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="w-full text-slate-200"
            />
          </div>

          {formData.previewUrl && (
            <div className="mt-2 rounded-lg border border-white/10 bg-slate-900/50 p-3">
              {formData.file && formData.file.type === "application/pdf" ? (
                <div className="text-sm text-slate-300">PDF selected: {formData.file.name}</div>
              ) : (
                <img src={formData.previewUrl} alt="Preview" className="max-w-full h-auto rounded" />
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <CustomButton className="bg-transparent hover:bg-white/5 text-slate-100 px-4 py-2 rounded-lg border border-white/10" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton className="bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)] text-white px-4 py-2 rounded-lg" onClick={handleSubmit}>
              {initialData ? "Update" : "Add"}
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
};

const Timetable = () => {
  const [branch, setBranch] = useState();
  const [timetables, setTimetables] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedTimetableId, setSelectedTimetableId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState(null);
  const userToken = sessionStorage.getItem("userToken");

  useEffect(() => {
    getBranchHandler();
    getTimetablesHandler();
  }, []);

  const getBranchHandler = async () => {
    try {
      const response = await axiosWrapper.get(`/branch`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setBranch(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error fetching branches");
    }
  };

  const getTimetablesHandler = async () => {
    try {
      const response = await axiosWrapper.get(`/timetable`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setTimetables(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error fetching timetables");
    }
  };

  const handleSubmitTimetable = async (formData) => {
    const headers = {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${userToken}`,
    };

    const submitData = new FormData();
    submitData.append("branch", formData.branch);
    submitData.append("semester", formData.semester);
    if (formData.file) {
      submitData.append("file", formData.file);
    }

    try {
      toast.loading(
        editingTimetable ? "Updating Timetable" : "Adding Timetable"
      );

      let response;
      if (editingTimetable) {
        response = await axiosWrapper.put(
          `/timetable/${editingTimetable._id}`,
          submitData,
          { headers }
        );
      } else {
        response = await axiosWrapper.post("/timetable", submitData, {
          headers,
        });
      }

      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        getTimetablesHandler();
        setShowAddModal(false);
        setEditingTimetable(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Error with timetable");
    }
  };

  const deleteTimetableHandler = async (id) => {
    setIsDeleteConfirmOpen(true);
    setSelectedTimetableId(id);
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Deleting Timetable");
      const response = await axiosWrapper.delete(
        `/timetable/${selectedTimetableId}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );
      toast.dismiss();
      if (response.data.success) {
        toast.success("Timetable deleted successfully");
        setIsDeleteConfirmOpen(false);
        getTimetablesHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Error deleting timetable");
    }
  };

  const editTimetableHandler = (timetable) => {
    setEditingTimetable(timetable);
    setShowAddModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 text-white">
      <div className="rounded-2xl p-6 border border-white/5 shadow-xl flex items-center justify-between" style={{backgroundImage:"linear-gradient(90deg, rgba(0,209,178,0.15), rgba(124,77,255,0.10))"}}>
        <Heading title="Timetable Management" />
        <CustomButton className="bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)] text-white px-4 py-2 rounded-lg" onClick={() => setShowAddModal(true)}>
          <IoMdAdd className="text-2xl" />
        </CustomButton>
      </div>

      <div className="mt-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur shadow-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/70 text-slate-200">
              <th className="py-3 px-4 text-left font-semibold">View</th>
              <th className="py-3 px-4 text-left font-semibold">Branch</th>
              <th className="py-3 px-4 text-left font-semibold">Semester</th>
              <th className="py-3 px-4 text-left font-semibold">Created At</th>
              <th className="py-3 px-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {timetables.map((item, index) => (
              <tr key={index} className="border-t border-white/5 hover:bg-white/5 transition">
                <td className="py-3 px-4">
                  <a
                    className="inline-flex items-center gap-2 text-slate-200 hover:text-white"
                    href={`${process.env.REACT_APP_MEDIA_LINK}/${item.link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MdLink className="text-xl" />
                    <span className="text-xs">Open</span>
                  </a>
                </td>
                <td className="py-3 px-4">{item.branch.name}</td>
                <td className="py-3 px-4">{item.semester}</td>
                <td className="py-3 px-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <div className="flex justify-center gap-3">
                    <CustomButton className="bg-transparent hover:bg-white/5 text-slate-100 px-3 py-2 rounded-lg border border-white/10" onClick={() => editTimetableHandler(item)}>
                      <MdEdit />
                    </CustomButton>
                    <CustomButton className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-2 rounded-lg border border-red-500/30" onClick={() => deleteTimetableHandler(item._id)}>
                      <MdOutlineDelete />
                    </CustomButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddTimetableModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingTimetable(null);
        }}
        onSubmit={handleSubmitTimetable}
        initialData={editingTimetable}
        branches={branch}
      />

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        message="Are you sure you want to delete this timetable?"
      />
    </div>
  );
};

export default Timetable;
