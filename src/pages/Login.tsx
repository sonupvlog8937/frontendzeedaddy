import axios from "axios";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../main";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useAppData } from "../context/AppContext";

type Mode = "login" | "signup";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const { setUser, setIsAuth } = useAppData();

  const updateForm = (key: "name" | "email" | "password", value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const finishAuth = (result: any) => {
    finishAuth(result);
  };

  const responseGoogle = async (authResult: any) => {
    setLoading(true);
    try {
      const result = await axios.post(`${authService}/api/auth/login`, {
        code: authResult["code"],
      });

      localStorage.setItem("token", result.data.token);
      toast.success(result.data.message);
      setLoading(false);
      setUser(result.data.user);
      setIsAuth(true);
      navigate("/");
    } catch (error) {
      console.log(error);
      toast.error("Problem while login");
       } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.email || !form.password || (mode === "signup" && !form.name)) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        mode === "signup" ? "/api/auth/signup" : "/api/auth/manual-login";
      const payload =
        mode === "signup"
          ? form
          : { email: form.email, password: form.password };

      const result = await axios.post(`${authService}${endpoint}`, payload);
      finishAuth(result);
    } catch (error: any) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
       <div className="w-full max-w-sm space-y-6 rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h1 className="text-center text-3xl font-bold text-[#E23774]">Tomato</h1>

       <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg py-2 text-sm font-medium ${
              mode === "login" ? "bg-white text-[#E23774] shadow" : "text-gray-600"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg py-2 text-sm font-medium ${
              mode === "signup" ? "bg-white text-[#E23774] shadow" : "text-gray-600"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleManualSubmit}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#E23774]"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#E23774]"
            value={form.email}
            onChange={(e) => updateForm("email", e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#E23774]"
            value={form.password}
            onChange={(e) => updateForm("password", e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#E23774] px-4 py-3 font-medium text-white"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
              ? "Create Account"
              : "Login"}
          </button>
        </form>

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <button
          onClick={googleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3"
        >
          <FcGoogle size={20} />
          Continue with Google
        </button>

        <p className="text-center text-xs text-gray-400">
          By continuing, you agree with our{" "}
          <span className="text-[#E23774]">Terms of Service</span> &{" "}
          <span className="text-[#E23774]">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
