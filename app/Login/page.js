// app/Login/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value ?? "" }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }

      // เก็บข้อมูลผู้ใช้ใน localStorage
      localStorage.setItem("vrent_user_id", data.full_name || form.email);
      localStorage.setItem("vrent_full_name", data.full_name || form.email);
      localStorage.setItem("vrent_is_admin", data.is_admin ? "true" : "false");

      // ตรวจสอบสิทธิ์ admin
      if (data.is_admin) {
        router.push("/adminpageT");
      } else {
        router.push("/mainpage");
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white overflow-hidden relative">
      <title>Login - V-Rent</title>

      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-yellow-400/30 to-amber-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Additional floating gradients */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-rose-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-blue-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Enhanced Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/20 rounded-full animate-pulse"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <main className="flex items-center justify-center min-h-screen p-3 sm:p-4 relative z-10">
        <div className="w-full max-w-sm sm:max-w-md">
          <div
            className={`
              rounded-2xl sm:rounded-3xl border border-white/20 
              bg-gradient-to-b from-white/15 via-white/8 to-white/15
              backdrop-blur-2xl
              shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1)]
              transition-all duration-1000 ease-out
              hover:shadow-[0_30px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.2)]
              hover:scale-[1.01] sm:hover:scale-[1.02]
              ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
            `}
          >
            <div className="px-5 sm:px-8 pt-6 sm:pt-10 pb-6 sm:pb-8">
              {/* Enhanced Brand Logo */}
              <div className={`
                mx-auto mb-6 sm:mb-8 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center 
                rounded-2xl sm:rounded-3xl bg-gradient-to-br from-yellow-400/30 to-amber-500/30 
                border border-yellow-400/40 shadow-xl sm:shadow-2xl shadow-yellow-500/30
                transition-all duration-1000 ease-out
                ${isLoaded ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-12'}
              `} style={{ transitionDelay: '0.2s' }}>
                <span className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-yellow-400 to-amber-500 bg-clip-text text-transparent animate-pulse">
                  V
                </span>
              </div>

              {/* Enhanced Title */}
              <div className={`
                text-center transition-all duration-1000 ease-out
                ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
              `} style={{ transitionDelay: '0.4s' }}>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 bg-clip-text text-transparent">
                    V-Rent
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-white/90 font-medium">
                  เช่ารถยนต์คุณภาพสูง พร้อมบริการครบครัน
                </p>
                <p className="text-xs sm:text-sm text-white/70 mt-1">
                  Connect to every road
                </p>
              </div>

              {/* Enhanced Divider */}
              <div className={`
                mt-6 sm:mt-8 mb-4 sm:mb-6 h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent
                transition-all duration-1000 ease-out
                ${isLoaded ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}
              `} style={{ transitionDelay: '0.6s' }} />

              <form
                onSubmit={handleSubmit}
                className={`
                  space-y-4 sm:space-y-5 transition-all duration-1000 ease-out
                  ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
                `}
                style={{ transitionDelay: '0.8s' }}
              >
                {/* Enhanced Email Address / Username */}
                <div className="group">
                  <label className="block mb-2 sm:mb-3 text-sm font-semibold text-white/95">
                    Email Address / Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white/60 group-focus-within:text-yellow-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email or username"
                      autoComplete="username"
                      required
                      autoCapitalize="none"
                      inputMode="email"
                      enterKeyHint="next"
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-white/30 bg-white/[0.10] text-white placeholder:text-white/60 outline-none hover:bg-white/[0.15] hover:border-white/50 focus:bg-white/[0.20] focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 transition-all duration-300 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Enhanced Password */}
                <div className="group">
                  <label className="block mb-2 sm:mb-3 text-sm font-semibold text-white/95">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white/60 group-focus-within:text-yellow-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPw ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      enterKeyHint="done"
                      className="w-full pl-10 sm:pl-12 pr-12 sm:pr-14 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-white/30 bg-white/[0.10] text-white placeholder:text-white/60 outline-none hover:bg-white/[0.15] hover:border-white/50 focus:bg-white/[0.20] focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 transition-all duration-300 text-sm sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 sm:p-2 text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300"
                      aria-label={showPw ? "Hide password" : "Show password"}
                      aria-pressed={showPw}
                    >
                      {showPw ? (
                        <svg width="16" height="16" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none">
                          <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M21 12s-3.5 6-9 6-9-6-9-6 3.5-6 9-6c2.3 0 4.3.9 5.8 2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none">
                          <path d="M21 12s-3.5 6-9 6-9-6-9-6 3.5-6 9-6 9 6 9 6Z" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Enhanced Error Message */}
                {error && (
                  <div className="rounded-xl sm:rounded-2xl border border-red-400/40 bg-gradient-to-r from-red-500/15 to-red-600/15 px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-red-200 flex items-center gap-2 sm:gap-3 animate-pulse shadow-lg shadow-red-500/20">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Enhanced Remember this session */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/85 hover:text-white transition-colors duration-300 cursor-pointer">
                    <input type="checkbox" className="rounded border-white/40 bg-white/10 text-yellow-400 focus:ring-yellow-400/40 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="font-medium">Remember this session</span>
                  </label>
                  <button
                    type="button"
                    className="text-xs sm:text-sm text-yellow-400 hover:text-yellow-300 underline underline-offset-4 hover:underline-offset-2 transition-all duration-300 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Enhanced Primary CTA Button */}
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="w-full rounded-xl sm:rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 py-3 sm:py-4 text-sm sm:text-base font-bold text-black shadow-xl shadow-yellow-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/40 hover:from-amber-500 hover:to-yellow-400 active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-yellow-400/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 sm:gap-3"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-90" d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                  )}
                  <span>{loading ? "Signing in..." : "Sign In"}</span>
                </button>

                {/* Enhanced Secondary Action Button */}
                <button
                  type="button"
                  onClick={() => router.push("/Signup")}
                  className="w-full rounded-xl sm:rounded-2xl border border-white/40 text-white/95 py-3 sm:py-4 text-sm sm:text-base hover:bg-white/15 hover:border-white/60 active:scale-[.98] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/40 font-medium"
                >
                  Don't have an account?{" "}
                  <span className="text-yellow-400 hover:text-yellow-300 underline underline-offset-4 hover:underline-offset-2 transition-all duration-300 font-semibold">
                    Sign up
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}