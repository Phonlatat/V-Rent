"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Headers from "@/Components/HeaderISO";
import Footer from "@/Components/FooterMinimal";

export default function Signup() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [error, setError] = useState(null);
  const [okMsg, setOkMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value ?? "" }));
    setError(null);
    setOkMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOkMsg("");

    // validation เบื้องต้น
    const phoneOk = /^[0-9]{9,15}$/.test(form.phone.trim());
    if (!phoneOk) {
      setError("กรุณากรอกเบอร์โทรเป็นตัวเลข 9–15 หลัก");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        "https://demo.erpeazy.com/api/method/erpnext.api.sign_up",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // ไม่ต้องแนบคุกกี้พิเศษ แต่ใส่ include ได้เผื่อมีการตั้งค่า session ฝั่งเซิร์ฟเวอร์
          credentials: "include",
          body: JSON.stringify({
            email: form.email,
            full_name: form.name,
            password: form.password,
            phone: form.phone,
          }),
          redirect: "follow",
        }
      );

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { raw };
      }

      if (!res.ok) {
        // พยายามดึงข้อความจาก response
        const msg =
          data?.message ||
          data?.exc ||
          data?.raw ||
          "Sign up failed. Please try again.";
        throw new Error(typeof msg === "string" ? msg : "Sign up failed");
      }

      // ส่วนใหญ่ ERPNext จะส่ง message success กลับมา
      setOkMsg("สมัครสมาชิกสำเร็จ! กำลังพาไปหน้า Login...");
      // เคลียร์ฟอร์มเล็กน้อย
      setForm((p) => ({
        ...p,
        password: "",
        confirmPassword: "",
      }));

      // ไปหน้า Login
      router.push("/Login");
    } catch (err) {
      console.error(err);
      setError(err?.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-slate-200">
      <title>Signup - V-Rent</title>
      <Headers />
      {/* background aurora / glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-[-10%] w-[60rem] h-[60rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, #7C5CFF 0%, rgba(124,92,255,0.0) 60%)",
          }}
        />
        <div
          className="absolute left-[10%] bottom-[-20%] w-[50rem] h-[50rem] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, #34D399 0%, rgba(52,211,153,0.0) 60%)",
          }}
        />
      </div>

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">
            <div className="px-8 pt-8 pb-6">
              {/* โลโก้ */}
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#1B1B2F] to-[#0A0A12] shadow-2xl ring-2 ring-indigo-500/60">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="56"
                  height="56"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M3 4L12 20L21 4"
                    stroke="white"
                    strokeWidth="3.5"
                    strokeLinejoin="miter"
                  />
                  <path
                    d="M6 4L12 15L18 4"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinejoin="miter"
                    opacity="0.85"
                  />
                </svg>
              </div>

              <h1 className="text-center text-2xl font-semibold">
                Create Account
              </h1>
              <p className="mt-1 text-center text-sm text-slate-400">
                Join V-Rent • Connect to every road
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Name */}
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Full Name
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#0F1530]/60 px-4 py-3 text-sm placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  />
                </label>

                {/* Email */}
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Email Address
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@domain.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#0F1530]/60 px-4 py-3 text-sm placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  />
                </label>

                {/* Phone */}
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Phone Number
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="0812345678"
                    inputMode="numeric"
                    pattern="[0-9]{9,15}"
                    autoComplete="tel"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#0F1530]/60 px-4 py-3 text-sm placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  />
                </label>

                {/* Password */}
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Password
                  </span>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#0F1530]/60 px-4 py-3 pr-10 text-sm placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-200"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M3 3l18 18"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M21 12s-3.5 6-9 6-9-6-9-6 3.5-6 9-6c2.3 0 4.3.9 5.8 2.1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M21 12s-3.5 6-9 6-9-6-9-6 3.5-6 9-6 9 6 9 6Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>

                {/* Confirm Password */}
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Confirm Password
                  </span>
                  <div className="relative">
                    <input
                      type={showPw2 ? "text" : "password"}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#0F1530]/60 px-4 py-3 pr-10 text-sm placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw2((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-200"
                      aria-label={showPw2 ? "Hide password" : "Show password"}
                    >
                      {showPw2 ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M3 3l18 18"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M21 12s-3.5 6-9 6-9-6-9-6 3.5-6 9-6c2.3 0 4.3.9 5.8 2.1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M21 12s-3.5 6-9 6-9-6-9-6 3.5-6 9-6 9 6 9 6Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>

                {/* error / success */}
                {error && <p className="text-red-300 text-sm -mt-2">{error}</p>}
                {okMsg && (
                  <p className="text-emerald-300 text-sm -mt-2">{okMsg}</p>
                )}

                {/* CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-400 hover:to-violet-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing up..." : "Sign Up"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
