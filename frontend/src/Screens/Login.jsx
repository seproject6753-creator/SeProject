import React, { useState, useEffect } from "react";
import { FiLogIn } from "react-icons/fi";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { setUserToken } from "../redux/actions";
import { useDispatch } from "react-redux";
import CustomButton from "../components/CustomButton";
import axiosWrapper from "../utils/AxiosWrapper";
const USER_TYPES = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  ADMIN: "Admin",
};
const LoginForm = ({ selected, onSubmit, formData, setFormData }) => (
  <form
  className="w-full p-8 glass-card bg-slate-900/70 backdrop-blur rounded-2xl shadow-xl border border-white/5"
    onSubmit={onSubmit}
  >
    <div className="mb-5">
      <label
        className="block text-slate-200 text-sm font-medium mb-2"
        htmlFor="email"
      >
        {selected} Email
      </label>
      <input
        type="email"
        id="email"
        required
        placeholder="e.g., 500027@gmail.com"
  className="w-full px-4 py-3 text-sm bg-slate-800/70 text-slate-100 placeholder-slate-400 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] glass-input"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
    </div>
    <div className="mb-4">
      <label
        className="block text-slate-200 text-sm font-medium mb-2"
        htmlFor="password"
      >
        Password
      </label>
      <input
        type="password"
        id="password"
        required
        placeholder="Enter your password"
  className="w-full px-4 py-3 text-sm bg-slate-800/70 text-slate-100 placeholder-slate-400 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] glass-input"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
    </div>
    <div className="flex items-center justify-between mb-6">
      <Link
  className="text-sm text-[#7C4DFF] hover:text-[#00D1B2] hover:underline"
        to="/forget-password"
      >
        Forgot Password?
      </Link>
    </div>
    <CustomButton
      type="submit"
      className="w-full text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex justify-center items-center gap-2 shadow-lg hover:-translate-y-0.5 bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)]"
    >
      Login
      <FiLogIn className="text-lg" />
    </CustomButton>
  </form>
);

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

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [selected, setSelected] = useState(USER_TYPES.STUDENT);

  const handleUserTypeSelect = (type) => {
    const userType = type.toLowerCase();
    setSelected(type);
    setSearchParams({ type: userType });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const role = selected.toLowerCase();
      const isProd = typeof window !== "undefined" && window.location.hostname !== "localhost";
      let response;

      if (isProd) {
        // Use same-origin, adblock-safe proxy path; Netlify rewrites to Render login
        response = await axios.post(`/xapi/${role}/auth`, formData, {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // Dev: call backend directly through axiosWrapper baseURL
        response = await axiosWrapper.post(`/${role}/login`, formData, {
          headers: { "Content-Type": "application/json" },
        });
      }

      const { token } = response.data.data;
  sessionStorage.setItem("userToken", token);
  sessionStorage.setItem("userType", selected);
      dispatch(setUserToken(token));
      navigate(`/${selected.toLowerCase()}`);
    } catch (error) {
      toast.dismiss();
      console.error(error);
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  useEffect(() => {
  const userToken = sessionStorage.getItem("userToken");
    if (userToken) {
  navigate(`/${sessionStorage.getItem("userType").toLowerCase()}`);
    }
  }, [navigate]);

  useEffect(() => {
    if (type) {
      const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
      setSelected(capitalizedType);
    }
  }, [type]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#071028] via-[#07162a] to-[#071028] text-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full h-screen">
        {/* Left hero */}
  <div className="hidden lg:flex flex-col justify-center items-center p-10 h-full" style={{backgroundImage:"linear-gradient(160deg,#0f2133 0%, #071028 100%)"}}>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-[linear-gradient(90deg,#00D1B2,#7C4DFF)]" />
            <span className="sr-only">Logo</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">Student Sphere</h1>
          <p className="text-slate-300 text-lg">Your complete campus companion.</p>
        </div>

        {/* Right card */}
        <div className="flex items-center justify-center h-full p-6 sm:p-12">
          <div className="w-full max-w-md">
            <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-700 p-6 md:p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-center mb-2">Welcome Back</h2>
              <p className="text-center text-slate-300 mb-6">Log in to your account</p>
              <UserTypeSelector selected={selected} onSelect={handleUserTypeSelect} />
              <LoginForm
                selected={selected}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
              />
            </div>
          </div>
        </div>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
};

export default Login;
