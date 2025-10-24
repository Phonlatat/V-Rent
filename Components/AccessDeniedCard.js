import Link from "next/link";
import { useState, useEffect } from "react";

export default function AccessDeniedCard({
  title = "เข้าถึงไม่ได้",
  subtitle = "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
  showLoginButton = true,
  showHomeButton = true,
  customActions = null,
  className = "",
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsLoaded(true);

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className={`relative min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 overflow-hidden ${className}`}
    >
      {/* Enhanced Background Pattern - ตามธีมของเว็บไซต์ */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div
          className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 blur-3xl transition-all duration-1000"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
      </div>

      {/* Floating Elements - ตามธีมของเว็บไซต์ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full opacity-60 animate-pulse`}
            style={{
              left: `${10 + i * 8}%`,
              top: `${20 + i * 6}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div
          className={`w-full max-w-lg transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Icon Container - ปรับให้เข้ากับธีม */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-2xl mb-6 group hover:scale-110 transition-transform duration-300">
              <svg
                className="w-12 h-12 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          {/* Content Card - ปรับให้เข้ากับธีม Glass Morphism */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 text-center group hover:bg-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:scale-105">
            {/* Title */}
            <h1 className="text-3xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors duration-300">
              {title}
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-slate-300 mb-8 leading-relaxed group-hover:text-white transition-colors duration-300">
              {subtitle}
            </p>

            {/* Action Buttons */}
            <div className="space-y-4">
              {customActions ? (
                customActions
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {showLoginButton && (
                    <Link
                      href="/Login"
                      className="group relative px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-lg font-semibold rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25 hover:from-amber-500 hover:to-yellow-400"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                          />
                        </svg>
                        เข้าสู่ระบบ
                      </span>
                    </Link>
                  )}

                  {showHomeButton && (
                    <Link
                      href="/"
                      className="group relative px-8 py-3 bg-white/10 backdrop-blur-md text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                        กลับหน้าหลัก
                      </span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Bottom Decoration - ตามธีมของเว็บไซต์ */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />

      {/* Enhanced Scroll Indicator - ตามธีมของเว็บไซต์ */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
