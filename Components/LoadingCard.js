import { useState, useEffect } from "react";

export default function LoadingCard({
  title = "กำลังตรวจสอบสิทธิ์...",
  subtitle = "กรุณารอสักครู่ ระบบกำลังตรวจสอบสิทธิ์ผู้ใช้งาน",
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
          {/* Loading Icon Container */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-2xl mb-6 group animate-pulse">
              <svg
                className="w-12 h-12 text-black animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
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

            {/* Loading Animation */}
            <div className="flex justify-center mb-6">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full animate-bounce"></div>
                <div
                  className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                กรุณาอย่าปิดหน้าต่างนี้ระหว่างการตรวจสอบ
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
