// app/cars/page.js
"use client";

import { Suspense, useState, useEffect } from "react";
import Headers from "@/Components/HeaderISO";
import Footer from "@/Components/FooterMinimal";
import CarsPageContent from "./CarsPageContent";

export default function CarsPage() {
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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white overflow-hidden">
      <title>CarsBoxPage - V-Rent</title>

      {/* Enhanced Background Pattern - matching other pages */}
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

      {/* Enhanced Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full opacity-60 animate-pulse`}
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + i * 8}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2 + i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <Headers />

      {/* Main Content with dark theme */}
      <main className="flex-1 relative z-10">
        <section className="relative">
          {/* Enhanced gradient accent bar */}
          <div className="absolute inset-x-0 top-0 h-[120px] bg-gradient-to-r from-yellow-400/20 to-amber-500/20 backdrop-blur-sm" />

          {/* Content with dark theme styling */}
          <div className="relative p-4 sm:p-8 lg:p-10">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-300">กำลังโหลดข้อมูล...</p>
                  </div>
                </div>
              }
            >
              <CarsPageContent />
            </Suspense>
          </div>
        </section>
      </main>

      {/* Footer always at bottom */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
