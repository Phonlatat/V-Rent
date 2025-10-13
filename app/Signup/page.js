// app/Signup/page.jsx
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
        "http://203.150.243.195/api/method/erpnext.api.sign_up",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        const msg =
          data?.message ||
          data?.exc ||
          data?.raw ||
          "Sign up failed. Please try again.";
        throw new Error(typeof msg === "string" ? msg : "Sign up failed");
      }

      setOkMsg("สมัครสมาชิกสำเร็จ! กำลังพาไปหน้า Login...");
      setForm((p) => ({ ...p, password: "", confirmPassword: "" }));
      router.push("/Login");
    } catch (err) {
      console.error(err);
      setError(err?.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex flex-col bg-black text-white">
      <title>Signup - V-Rent</title>
      <Headers />

      {/* brand glows */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-[-22%] w-[60rem] h-[60rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, #F59E0B 0%, rgba(245,158,11,0) 60%)",
          }}
        />
        {/* white glow เพิ่มความสว่าง */}
        <div
          className="absolute right-[-10%] bottom-[-30%] w-[55rem] h-[55rem] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(255,255,255,0) 65%)",
          }}
        />
      </div>

      <main className="flex flex-1 items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md">
          <div
            className="
            rounded-3xl border border-white/15 
            bg-gradient-to-b from-black/60 via-white/5 to-black/40
            backdrop-blur-xl
            shadow-[0_12px_50px_rgba(255,255,255,0.06),0_10px_40px_rgba(0,0,0,0.6)]
            transition-transform duration-200 will-change-transform active:scale-[.995]
          "
          >
            <div className="px-6 sm:px-8 pt-8 pb-6">
              {/* โลโก้ / แบรนด์ */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-900 shadow-lg ring-2 ring-white/30">
                <span className="text-2xl font-extrabold bg-gradient-to-br from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  V
                </span>
              </div>

              <h1 className="text-center text-2xl font-semibold text-white">
                Create Account
              </h1>
              <p className="mt-1 text-center text-sm text-white/80">
                Join V-Rent • Connect to every road
              </p>

              {/* divider ขาวจาง */}
              <div className="mt-4 mb-2 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <form
                onSubmit={handleSubmit}
                className="mt-4 space-y-4"
                id="signupForm"
              >
                {/* Name */}
                <label className="block">
                  <span className="mb-2 block text-sm text-white">
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
                    enterKeyHint="next"
                    className="
                      w-full rounded-xl border border-white/30 
                      bg-white/[0.06] px-4 py-3 text-sm 
                      placeholder:text-white/60 outline-none 
                      hover:bg-white/[0.08]
                      focus:bg-white/[0.10] focus:border-white 
                      focus:ring-2 focus:ring-white/30
                    "
                  />
                </label>

                {/* Email */}
                <label className="block">
                  <span className="mb-2 block text-sm text-white">
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
                    autoCapitalize="none"
                    inputMode="email"
                    enterKeyHint="next"
                    className="
                      w-full rounded-xl border border-white/30 
                      bg-white/[0.06] px-4 py-3 text-sm 
                      placeholder:text-white/60 outline-none 
                      hover:bg-white/[0.08]
                      focus:bg-white/[0.10] focus:border-white 
                      focus:ring-2 focus:ring-white/30
                    "
                  />
                </label>

                {/* Phone */}
                <label className="block">
                  <span className="mb-2 block text-sm text-white">
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
                    enterKeyHint="next"
                    className="
                      w-full rounded-xl border border-white/30 
                      bg-white/[0.06] px-4 py-3 text-sm 
                      placeholder:text-white/60 outline-none 
                      hover:bg-white/[0.08]
                      focus:bg-white/[0.10] focus:border-white 
                      focus:ring-2 focus:ring-white/30
                    "
                  />
                </label>

                {/* Password */}
                <label className="block">
                  <span className="mb-2 block text-sm text-white">
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
                      enterKeyHint="next"
                      className="
                        w-full rounded-xl border border-white/30 
                        bg-white/[0.06] px-4 py-3 pr-10 text-sm 
                        placeholder:text-white/60 outline-none 
                        hover:bg-white/[0.08]
                        focus:bg-white/[0.10] focus:border-white 
                        focus:ring-2 focus:ring-white/30
                      "
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/70 hover:text-white active:scale-95 transition"
                      aria-label={showPw ? "Hide password" : "Show password"}
                      aria-pressed={showPw}
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
                  <span className="mb-2 block text-sm text-white">
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
                      enterKeyHint="done"
                      className="
                        w-full rounded-xl border border-white/30 
                        bg-white/[0.06] px-4 py-3 pr-10 text-sm 
                        placeholder:text-white/60 outline-none 
                        hover:bg-white/[0.08]
                        focus:bg-white/[0.10] focus:border-white 
                        focus:ring-2 focus:ring-white/30
                      "
                      onFocus={() => {
                        setTimeout(() => {
                          document
                            .getElementById("signupForm")
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                        }, 120);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw2((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/70 hover:text-white active:scale-95 transition"
                      aria-label={showPw2 ? "Hide password" : "Show password"}
                      aria-pressed={showPw2}
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
                {error && (
                  <div
                    className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white"
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </div>
                )}
                {okMsg && (
                  <div
                    className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200"
                    role="status"
                    aria-live="polite"
                  >
                    {okMsg}
                  </div>
                )}

                {/* CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-900/30 transition hover:from-yellow-300 hover:to-amber-400 active:scale-[.985] focus:outline-none focus:ring-2 focus:ring-yellow-400/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-20"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-90"
                        d="M22 12a10 10 0 0 1-10 10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                    </svg>
                  )}
                  <span>{loading ? "Signing up..." : "Sign Up"}</span>
                </button>

                {/* secondary - ขาวเพิ่มความสว่างและ UX */}
                <button
                  type="button"
                  onClick={() => router.push("/Login")}
                  className="w-full rounded-xl border border-white/50 text-white/90 py-3 text-sm mt-2 hover:bg-white/10 active:scale-[.985] transition"
                >
                  Already have an account?{" "}
                  <span className="underline underline-offset-4">Login</span>
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
