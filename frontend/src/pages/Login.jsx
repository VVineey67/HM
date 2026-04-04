import React, { useState } from "react";
import { User, Lock, Globe, Linkedin, Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import api from "../utils/api";

const Login = ({ onLogin }) => {
  const [view, setView] = useState("login"); // "login" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      // Preserve avatar from previous session if backend doesn't return one
      const prevUser = JSON.parse(localStorage.getItem("bms_user") || "{}");
      const userToStore = { ...data.user, avatar: data.user.avatar || prevUser.avatar || null };
      localStorage.setItem("bms_token", data.token);
      localStorage.setItem("bms_user", JSON.stringify(userToStore));
      onLogin(userToStore);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email: forgotEmail });
      setForgotSent(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-blue-900 p-6 font-sans relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#2d3748_1px,transparent_1px)] [background-size:40px_40px] opacity-10"></div>
      </div>

      <div className="flex flex-col lg:flex-row w-full max-w-4xl min-h-[480px] overflow-hidden rounded-[2rem] lg:rounded-[2.5rem] bg-white/90 backdrop-blur-xl shadow-2xl shadow-blue-500/20 border border-white/30 relative z-10">

        {/* Left Side */}
        <div className="relative hidden w-full lg:w-[42%] flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 p-8 lg:flex overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/10 rounded-full"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/10 rounded-full"></div>
          </div>
          <div className="relative z-10 mb-8 flex h-56 w-56 items-center justify-center rounded-[3rem] bg-gradient-to-br from-white to-blue-100 shadow-2xl shadow-blue-500/30 overflow-hidden border-2 border-white/40">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
            <img src="/logo.png" alt="Bootes Logo" className="h-48 w-48 object-contain relative z-10 filter drop-shadow-lg" />
          </div>
          <div className="relative z-10 text-center px-4">
            <p className="text-xs font-bold tracking-[0.3em] text-white/60 uppercase mb-6">ANET-ZERO ENGINEERING COMPANY</p>
            <h2 className="text-3xl font-black italic tracking-[0.2em] text-white uppercase leading-tight drop-shadow-2xl">
              WELCOME TO <br /> BOOTES
            </h2>
            <div className="mt-6 mb-4">
              <p className="text-xs font-bold tracking-[0.5em] text-white/70 uppercase">SECURE PORTAL</p>
            </div>
            <div className="mt-4 h-1.5 w-32 bg-gradient-to-r from-transparent via-white/60 to-transparent mx-auto rounded-full"></div>
            <div className="mt-8">
              <p className="text-xs font-bold tracking-[0.5em] text-white/50 uppercase">OFFICIAL PORTAL</p>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </div>

        {/* Right Side */}
        <div className="flex flex-1 flex-col justify-center bg-gradient-to-b from-white/95 to-blue-50/30 px-6 py-10 sm:px-10 md:px-14 lg:px-20 backdrop-blur-sm">

          {view === "login" ? (
            <>
              <div className="mb-8">
                <h2 className="text-4xl font-black text-gray-900 leading-none">Login</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Access your secure dashboard</p>
                <div className="mt-3 h-1 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
              </div>

              <form className="w-full space-y-5" onSubmit={handleLogin}>
                <div className="space-y-1">
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.3em] text-gray-500 block text-left">EMAIL ADDRESS</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl bg-white/80 py-3.5 pl-12 pr-4 text-sm font-medium text-gray-800 outline-none border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                      placeholder="you@bootes.in"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.3em] text-gray-500 block text-left">PASSWORD</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl bg-white/80 py-3.5 pl-12 pr-12 text-sm font-medium text-gray-800 outline-none border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium">
                    {error}
                  </div>
                )}

                <div className="flex justify-end pr-1 pt-1">
                  <button type="button" onClick={() => { setView("forgot"); setError(""); }}
                    className="text-[11px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">
                    FORGOT PASSWORD?
                  </button>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={loading}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/50 hover:from-blue-700 hover:to-purple-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "LOGGING IN..." : "LOGIN NOW"}
                  </button>
                </div>
              </form>

              <div className="mt-8 flex flex-col items-center gap-3 w-full">
                <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400 text-center w-full">CONNECT WITH US</p>
                <div className="flex items-center justify-center gap-6 w-full">
                  <a href="https://www.linkedin.com/company/bootes-impex-tech-ltd/" target="_blank" rel="noreferrer"
                    className="p-2.5 rounded-full bg-gradient-to-br from-white to-blue-50 text-[#0077b5] shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300">
                    <Linkedin size={22} />
                  </a>
                  <a href="https://bootes.in/" target="_blank" rel="noreferrer"
                    className="p-2.5 rounded-full bg-gradient-to-br from-white to-gray-50 text-blue-600 shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300">
                    <Globe size={22} />
                  </a>
                </div>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => { setView("login"); setError(""); setForgotSent(false); }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-8 w-fit">
                <ArrowLeft size={16} /> Back to Login
              </button>

              <div className="mb-8">
                <h2 className="text-4xl font-black text-gray-900 leading-none">Forgot Password</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  {forgotSent ? "Check your email for the reset link." : "Enter your registered email address."}
                </p>
                <div className="mt-3 h-1 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
              </div>

              {forgotSent ? (
                <div className="rounded-2xl bg-green-50 border border-green-200 px-6 py-5 text-center">
                  <div className="text-4xl mb-3">📧</div>
                  <p className="text-sm font-semibold text-green-700">Reset link sent!</p>
                  <p className="text-xs text-green-600 mt-1">Check your inbox and click the link to set a new password.</p>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-5">
                  <div className="space-y-1">
                    <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.3em] text-gray-500 block">EMAIL ADDRESS</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full rounded-2xl bg-white/80 py-3.5 pl-12 pr-4 text-sm font-medium text-gray-800 outline-none border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                        placeholder="you@bootes.in"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "SENDING..." : "SEND RESET LINK"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
