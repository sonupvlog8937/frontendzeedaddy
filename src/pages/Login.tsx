import axios from "axios";
import { useState } from "react";
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
  const [showOtp, setShowOtp] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const navigate = useNavigate();
  const { setUser, setIsAuth } = useAppData();

  const completeAuth = (data: any) => {
    localStorage.setItem("token", data.token);
    setUser(data.user);
    setIsAuth(true);
    navigate("/");
  };


  const responseGoogle = async (authResult: any) => {
    setLoading(true);
    try {
      const result = await axios.post(`${authService}/api/auth/login`, {
        code: authResult["code"],
      });

      
      toast.success(result.data.message);
      completeAuth(result.data);
    } catch (error) {
      toast.error("Problem while login");
       } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });

  const handleEmailSubmit = async () => {
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data } = await axios.post(`${authService}/api/auth/register`, {
          name,
          email,
          password,
        });
        toast.success(data.message);
        setShowOtp(true);
      } else {
        const { data } = await axios.post(`${authService}/api/auth/login-password`, {
          email,
          password,
        });
        toast.success(data.message);
        completeAuth(data);
      }
    } catch (error: any) {
      if (error?.response?.data?.needsVerification) {
        toast("OTP sent to your email. Please verify.");
        setShowOtp(true);
      } else {
        toast.error(error?.response?.data?.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${authService}/api/auth/verify-otp`, {
        email,
        otp,
      });
      toast.success(data.message);
      completeAuth(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      const { data } = await axios.post(`${authService}/api/auth/resend-otp`, {
        email,
      });
      toast.success(data.message);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border p-6 shadow-sm">
        <h1 className="text-center text-3xl font-bold text-[#E23774]">Tomato</h1>

        <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1 text-sm">
          <button
            onClick={() => {
              setMode("login");
              setShowOtp(false);
            }}
            className={`rounded-md py-2 ${mode === "login" ? "bg-white shadow" : ""}`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode("signup");
              setShowOtp(false);
            }}
            className={`rounded-md py-2 ${mode === "signup" ? "bg-white shadow" : ""}`}
          >
            Sign up
          </button>
        </div>

        {!showOtp && (
          <>
            {mode === "signup" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              />
            )}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            />

            <button
              onClick={handleEmailSubmit}
              disabled={loading}
              className="w-full rounded-lg bg-[#E23744] py-2 text-white"
            >
              {loading ? "Please wait..." : mode === "signup" ? "Sign up with email" : "Login with email"}
            </button>
          </>
        )}

        {showOtp && (
          <div className="space-y-2">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            />
            <button onClick={verifyOtp} disabled={loading} className="w-full rounded-lg bg-[#E23744] py-2 text-white">
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button onClick={resendOtp} className="w-full text-xs text-[#E23744]">
              Resend OTP
            </button>
          </div>
        )}

        <div className="relative py-1 text-center text-xs text-gray-400">or continue with</div>

        <button
          onClick={googleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3"
        >
          <FcGoogle size={20} />
          Continue with Google
        </button>

        
      </div>
    </div>
  );
};

export default Login;
