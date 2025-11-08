import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { MdOutlineDelete, MdEdit } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import axiosWrapper from "../../utils/AxiosWrapper";
import Heading from "../../components/Heading";
import DeleteConfirm from "../../components/DeleteConfirm";
import CustomButton from "../../components/CustomButton";
import Loading from "../../components/Loading";

const Branch = () => {
  const [data, setData] = useState({
    name: "",
    branchId: "",
  });
  const [branch, setBranch] = useState();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);

  useEffect(() => {
    getBranchHandler();
  }, []);

  const getBranchHandler = async () => {
    setDataLoading(true);
    try {
      const response = await axiosWrapper.get(`/branch`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("userToken")}`,
        },
      });
      if (response.data.success) {
        setBranch(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setBranch([]);
        return;
      }
      console.error(error);
      toast.error(error.response?.data?.message || "Error fetching branches");
    } finally {
      setDataLoading(false);
    }
  };

  const addBranchHandler = async (e) => {
    e?.preventDefault();
    if (!data.name || !data.branchId) {
      toast.dismiss();
      toast.error("Please fill all the fields");
      return;
    }
    try {
      toast.loading(isEditing ? "Updating Branch" : "Adding Branch");
      const headers = {
        "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("userToken")}`,
      };
      let response;
      if (isEditing) {
        response = await axiosWrapper.patch(
          `/branch/${selectedBranchId}`,
          data,
          {
            headers: headers,
          }
        );
      } else {
        response = await axiosWrapper.post(`/branch`, data, {
          headers: headers,
        });
      }
      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        setData({ name: "", branchId: "" });
        setShowAddForm(false);
        setIsEditing(false);
        setSelectedBranchId(null);
        getBranchHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      const msg = error?.response?.data?.message || error?.message || "Error adding/updating branch";
      toast.error(msg);
    }
  };

  const deleteBranchHandler = async (id) => {
    setIsDeleteConfirmOpen(true);
    setSelectedBranchId(id);
  };

  const editBranchHandler = (branch) => {
    setData({
      name: branch.name,
      branchId: branch.branchId,
    });
    setSelectedBranchId(branch._id);
    setIsEditing(true);
    setShowAddForm(true);
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Deleting Branch");
      const headers = {
        "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("userToken")}`,
      };
      const response = await axiosWrapper.delete(
        `/branch/${selectedBranchId}`,
        {
          headers: headers,
        }
      );
      toast.dismiss();
      if (response.data.success) {
        toast.success("Branch has been deleted successfully");
        setIsDeleteConfirmOpen(false);
        getBranchHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      const msg = error?.response?.data?.message || error?.message || "Error deleting branch";
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <Heading title="Branch Management" />
        <CustomButton
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) {
              setData({ name: "", branchId: "" });
              setIsEditing(false);
              setSelectedBranchId(null);
            }
          }}
          className="bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)] text-white px-4 py-2 rounded-lg"
        >
          {showAddForm ? <IoMdClose className="text-2xl" /> : <IoMdAdd className="text-2xl" />}
        </CustomButton>
      </div>

      {dataLoading && (
        <div className="rounded-2xl p-10 border border-white/5 bg-slate-900/40 backdrop-blur flex items-center justify-center">
          <Loading />
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/80 text-white shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10" style={{backgroundImage:"linear-gradient(90deg, rgba(0,209,178,0.12), rgba(124,77,255,0.08))"}}>
              <h2 className="text-lg md:text-xl font-semibold">{isEditing ? "Edit Branch" : "Add New Branch"}</h2>
              <button onClick={() => setShowAddForm(false)} className="text-slate-300 hover:text-white">
                <IoMdClose className="text-2xl" />
              </button>
            </div>
            <form onSubmit={addBranchHandler} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Branch Name</label>
                <input
                  type="text"
                  id="name"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-md bg-slate-900/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#00D1B2]/40"
                />
              </div>
              <div>
                <label htmlFor="branchId" className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Branch ID</label>
                <input
                  type="text"
                  id="branchId"
                  value={data.branchId}
                  onChange={(e) => setData({ ...data, branchId: e.target.value })}
                  className="w-full px-4 py-2 rounded-md bg-slate-900/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#00D1B2]/40"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <CustomButton className="bg-transparent hover:bg-white/5 text-slate-100 px-4 py-2 rounded-lg border border-white/10" onClick={() => setShowAddForm(false)} type="button">
                  Cancel
                </CustomButton>
                <CustomButton className="bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)] text-white px-4 py-2 rounded-lg" type="submit">
                  {isEditing ? "Update" : "Add"}
                </CustomButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {!dataLoading && (
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur shadow-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900/70 text-slate-200">
                <th className="py-3 px-4 text-left font-semibold">Branch Name</th>
                <th className="py-3 px-4 text-left font-semibold">Branch ID</th>
                <th className="py-3 px-4 text-left font-semibold">Created At</th>
                <th className="py-3 px-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branch && branch.length > 0 ? (
                branch.map((item) => (
                  <tr key={item._id} className="border-t border-white/5 hover:bg-white/5 transition">
                    <td className="py-3 px-4">{item.name}</td>
                    <td className="py-3 px-4">{item.branchId}</td>
                    <td className="py-3 px-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-3">
                        <CustomButton className="bg-transparent hover:bg-white/5 text-slate-100 px-3 py-2 rounded-lg border border-white/10 !p-2" onClick={() => editBranchHandler(item)}>
                          <MdEdit />
                        </CustomButton>
                        <CustomButton className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-2 rounded-lg border border-red-500/30 !p-2" onClick={() => deleteBranchHandler(item._id)}>
                          <MdOutlineDelete />
                        </CustomButton>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-sm py-10 text-slate-400">No branches found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        message="Are you sure you want to delete this branch?"
      />
    </div>
  );
};

export default Branch;
