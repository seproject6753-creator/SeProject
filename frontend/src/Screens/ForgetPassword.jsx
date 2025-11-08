import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import axiosWrapper from "../utils/AxiosWrapper";
import CustomButton from "../components/CustomButton";

const USER_TYPES = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  ADMIN: "Admin",
};

const UserTypeSelector = ({ selected, onSelect }) => (
  <div className="w-full mb-8">
    <div className="flex bg-slate-800/70 border border-slate-700 rounded-xl p-1">
      {Object.values(USER_TYPES).map((type) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
            selected === type
              ? "bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)] text-white shadow"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  </div>
);

const ForgetPassword = () => {
  const navigate = useNavigate();
  const userToken = sessionStorage.getItem("userToken");
  const [selected, setSelected] = useState(USER_TYPES.STUDENT);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (userToken) {
  navigate(`/${sessionStorage.getItem("userType")}`);
    }
  }, [userToken, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    toast.loading("Sending reset mail...");
    if (email === "") {
      toast.dismiss();
      toast.error("Please enter your email");
      return;
    }
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      const resp = await axiosWrapper.post(
        `/${selected.toLowerCase()}/forget-password`,
        { email },
        {
          headers: headers,
        }
      );

      if (resp.data.success) {
        toast.dismiss();
        toast.success(resp.data.message);
      } else {
        toast.dismiss();
        toast.error(resp.data.message);
      }
    } catch (error) {
      toast.dismiss();
      console.error(error);
      toast.error(error.response?.data?.message || "Error sending reset mail");
    } finally {
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#071028] via-[#07162a] to-[#071028] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md px-2 sm:px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6">{selected} Forget Password</h1>
        <UserTypeSelector selected={selected} onSelect={setSelected} />
        <form
          className="w-full p-8 bg-slate-900/60 backdrop-blur rounded-2xl shadow-2xl border border-slate-700"
          onSubmit={onSubmit}
        >
          <div className="mb-6">
            <label className="block text-slate-200 text-sm font-medium mb-2" htmlFor="email">
              {selected} Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="e.g., 500027@gmail.com"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
              className="w-full px-4 py-3 text-sm bg-slate-800/70 text-slate-100 placeholder-slate-400 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] glass-input"
            />
          </div>
          <CustomButton
            type="submit"
            className="w-full text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-lg hover:-translate-y-0.5 bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)]"
          >
            Send Reset Link
          </CustomButton>
        </form>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
};

export default ForgetPassword;
