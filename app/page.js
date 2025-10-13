"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsLoaded(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 overflow-hidden">
      <title>V-Rent</title>
      
      {/* Enhanced Background Pattern */}
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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Enhanced Logo with Animation */}
        <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-center mb-8">
            <span className="text-white">V</span>
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent animate-pulse">
              -
            </span>
            <span className="text-white">Rent</span>
          </h1>
          
          {/* Enhanced Subtitle */}
          <p className="text-xl sm:text-2xl text-slate-300 text-center mb-16 font-light tracking-wide">
            เช่ารถยนต์คุณภาพสูง พร้อมบริการครบครัน
          </p>
        </div>

        {/* Enhanced Feature Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {[
            { icon: "🚗", title: "รถคุณภาพ", desc: "ตรวจสภาพทุกคัน" },
            { icon: "💰", title: "ราคาโปร่งใส", desc: "ไม่มีค่าใช้จ่ายแอบแฝง" },
            { icon: "🛡️", title: "ปลอดภัย", desc: "ประกันครบถ้วน" }
          ].map((feature, index) => (
            <div
              key={index}
              className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:scale-105"
            >
              <div className="text-4xl mb-4 text-center group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2 text-center">{feature.title}</h3>
              <p className="text-slate-300 text-sm text-center">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Enhanced CTA Button */}
        <div className={`transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Link
            href="/mainpage"
            className="group relative px-12 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-lg font-semibold rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25 hover:from-amber-500 hover:to-yellow-400"
          >
            <span className="relative z-10">เริ่มต้นเช่ารถ</span>
          </Link>
        </div>
      </div>

      {/* Enhanced Bottom Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />
      
      {/* Enhanced Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
