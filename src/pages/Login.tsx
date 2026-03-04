import axios from "axios";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../main";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useAppData } from "../context/AppContext";

type AuthMode = "signin" | "signup";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { setUser, setIsAuth } = useAppData();

   const completeLogin = (payload: {
    token: string;
    message?: string;
    user: {
      _id: string;
      name: string;
      email: string;
      image: string;
      role: string;
    };
  }) => {
    localStorage.setItem("token", payload.token);
    toast.success(payload.message || "Authentication successful");
    setUser(payload.user);
    setIsAuth(true);
    navigate("/");
  };

  const responseGoogle = async (authResult: { code?: string }) => {
    setLoading(true);
    try {
      const result = await axios.post(`${authService}/api/auth/login`, {
        code: authResult.code,
      });

      completeLogin(result.data);
    } catch (error) {
      console.log(error);
      toast.error("Problem while login");
       } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
     onError: () => {
      toast.error("Google login failed");
    },
    flow: "auth-code",
  });

  const handleEmailAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === "signup") {
        const signupPayload = { name, email, password };

        const signupEndpoints = [
          `${authService}/api/auth/signup`,
          `${authService}/api/auth/register`,
        ];

        let signupResult;

        for (const endpoint of signupEndpoints) {
          try {
            signupResult = await axios.post(endpoint, signupPayload);
            break;
          } catch (error) {
            continue;
          }
        }

        if (!signupResult) {
          throw new Error("Signup route unavailable");
        }

        completeLogin(signupResult.data);
        return;
      }

      const signInResult = await axios.post(`${authService}/api/auth/login`, {
        email,
        password,
      });
      completeLogin(signInResult.data);
    } catch (error) {
      console.log(error);
      toast.error(
        authMode === "signup"
          ? "Unable to sign up with email/password"
          : "Unable to sign in with email/password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-5 rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h1 className="text-center text-3xl font-bold text-[#E23774]">Tomato</h1>

        <p className="text-center text-sm text-gray-500">
        Continue with Google or use email/password
        </p>

        <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1 text-sm">
          <button
            onClick={() => setAuthMode("signin")}
            className={`rounded-md py-2 font-medium ${
              authMode === "signin" ? "bg-white text-[#E23744] shadow" : "text-gray-600"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setAuthMode("signup")}
            className={`rounded-md py-2 font-medium ${
              authMode === "signup" ? "bg-white text-[#E23744] shadow" : "text-gray-600"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          {authMode === "signup" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#E23744]"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#E23744]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#E23744]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#E23744] px-4 py-3 text-sm font-semibold text-white hover:bg-[#ca2f3c] disabled:opacity-70"
          >
            {loading
              ? "Please wait..."
              : authMode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">OR</span>
          </div>
        </div>

        <button
           onClick={() => googleLogin()}
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
