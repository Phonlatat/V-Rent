// app/Login/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Headers from "@/Components/HeaderISO";
import Footer from "@/Components/FooterMinimal";

const USER_PATH = "/mainpage";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("vrent_login_email") || "";
      const savedRemember = localStorage.getItem("vrent_remember") === "1";
      if (savedEmail) setEmail(savedEmail);
      if (savedRemember) setRemember(true);
    } catch {}
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrMsg("");
    setLoading(true);

    try {
      const res = await fetch("http://203.150.243.195/api/method/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        redirect: "follow",
        body: JSON.stringify({ usr: email, pwd: password }),
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { raw: rawText };
      }

      if (!res.ok) {
        const msg = data?.message || data?.exc || data?.raw || "Login failed.";
        throw new Error(typeof msg === "string" ? msg : "Login failed.");
      }

      try {
        if (remember) {
          localStorage.setItem("vrent_login_email", email);
          localStorage.setItem("vrent_remember", "1");
        } else {
          localStorage.removeItem("vrent_login_email");
          localStorage.removeItem("vrent_remember");
        }
        localStorage.setItem("vrent_user_id", String(email || ""));
        localStorage.setItem("vrent_is_admin", "0");
      } catch {}

      router.push(USER_PATH);
    } catch (err) {
      console.error(err);
      setErrMsg(err?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex flex-col bg-black text-white">
      <title>Login - V-Rent</title>
      <Headers />

      {/* brand glows (same vibe as Signup) */}
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
        {/* white glow เพิ่มความสว่างด้านล่างเหมือนหน้า Signup */}
        <div
          className="absolute right-[-10%] bottom-[-30%] w-[55rem] h-[55rem] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(255,255,255,0) 65%)",
          }}
        />
      </div>

      {/* main */}
      <main className="flex flex-1 items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md">
          {/* Card: โทน/เงา/ไล่สีเหมือน Signup */}
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
              {/* Brand */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-900 shadow-lg ring-2 ring-white/30">
                <span className="text-2xl font-extrabold bg-gradient-to-br from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  V
                </span>
              </div>

              <h1 className="text-center text-2xl font-semibold text-white">
                V-Rent
              </h1>
              <p className="mt-1 text-center text-sm text-white/80">
                Connected You to Every Road.
              </p>

              {/* divider ขาวจาง ให้ mood เหมือน Signup */}
              <div className="mt-4 mb-2 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <form
                id="loginForm"
                onSubmit={handleSubmit}
                className="mt-4 space-y-4"
              >
                {/* Email */}
                <label className="block">
                  <span className="mb-2 block text-sm text-white">
                    Email Address / Username
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 7.5 12 13l9-5.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      autoComplete="username"
                      autoCapitalize="none"
                      inputMode="email"
                      enterKeyHint="next"
                      className="
                        w-full rounded-xl border border-white/30
                        bg-white/[0.06] px-10 py-3 text-sm
                        placeholder:text-white/60 outline-none
                        hover:bg-white/[0.08]
                        focus:bg-white/[0.10] focus:border-white
                        focus:ring-2 focus:ring-white/30
                      "
                    />
                  </div>
                </label>

                {/* Password */}
                <label className="block">
                  <span className="mb-2 block text-sm text-white">
                    Password
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <rect
                          x="4"
                          y="10"
                          width="16"
                          height="10"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M8 10V7a4 4 0 1 1 8 0v3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <input
                      type={show ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      autoCapitalize="none"
                      enterKeyHint="done"
                      className="
                        w-full rounded-xl border border-white/30
                        bg-white/[0.06] px-10 py-3 pr-10 text-sm
                        placeholder:text-white/60 outline-none
                        hover:bg-white/[0.08]
                        focus:bg-white/[0.10] focus:border-white
                        focus:ring-2 focus:ring-white/30
                      "
                      onFocus={() => {
                        // iPhone: อย่าให้คีย์บอร์ดทับฟอร์ม
                        setTimeout(() => {
                          document.getElementById("loginForm")?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }, 120);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/80 hover:text-white active:scale-95 transition"
                      aria-label={show ? "Hide password" : "Show password"}
                      aria-pressed={show}
                    >
                      {show ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
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
                          aria-hidden="true"
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

                {/* error */}
                {errMsg && (
                  <div
                    className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white"
                    role="alert"
                    aria-live="polite"
                  >
                    {errMsg}
                  </div>
                )}

                {/* remember + link signup */}
                <div className="mt-1 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-white/90 active:scale-[.98] transition">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/30 bg-transparent text-yellow-500 focus:ring-white/30"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Remember this session
                  </label>
                  <a
                    href="/Signup"
                    className="text-sm text-white hover:opacity-90 active:scale-[.98] transition"
                  >
                    Create account
                  </a>
                </div>

                {/* CTA primary */}
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="
                    mt-2 w-full rounded-xl
                    bg-gradient-to-r from-yellow-400 to-amber-500
                    py-3 text-sm font-semibold text-black
                    shadow-lg shadow-amber-900/30
                    transition hover:from-yellow-300 hover:to-amber-400
                    active:scale-[.985]
                    focus:outline-none focus:ring-2 focus:ring-yellow-400/40
                    disabled:cursor-not-allowed disabled:opacity-60
                    flex items-center justify-center gap-2
                  "
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
                  <span>{loading ? "Logging in..." : "Login"}</span>
                </button>

                {/* secondary action ให้โทนขาวเหมือน Signup */}
                <button
                  type="button"
                  onClick={() => router.push("/Signup")}
                  className="w-full rounded-xl border border-white/50 text-white/90 py-3 text-sm mt-2 hover:bg-white/10 active:scale-[.985] transition"
                >
                  Don’t have an account?{" "}
                  <span className="underline underline-offset-4">Sign up</span>
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
