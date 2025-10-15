"use client";

import CardAddOn from "@/Components/CardAddOn";
import Footer from "@/Components/FooterMinimal";
import Header from "@/Components/Headnsearch";
import Slidemodal from "@/Components/Slidemodal";
import { useState, useEffect } from "react";

export default function Home() {
  const [pickupLocation, setPickupLocation] = useState("");
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
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-black to-slate-800">
      <title>MainPage - V-Rent</title>

      {/* Enhanced Background Pattern - matching landing page */}
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

      {/* Enhanced Floating Elements - matching landing page */}
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

      {/* Header */}
      <div
        className={`
        relative z-10
        transition-all duration-1000 ease-out
        ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
      `}
      >
        <Header
          pickupLocation={pickupLocation}
          setPickupLocation={setPickupLocation}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        <div className="pt-0 px-4 sm:px-6 lg:px-8">
          {/* Content container with dark theme styling */}
          <div
            className={`
            w-full -mt-12 sm:-mt-16 md:-mt-24 lg:-mt-32 relative z-20
            transition-all duration-1000 ease-out
            ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }
          `}
            style={{ transitionDelay: "0.1s" }}
          >
            <section
              className={`
                rounded-2xl sm:rounded-3xl lg:rounded-4xl 
                bg-white/10 backdrop-blur-md border border-white/20
                shadow-2xl shadow-black/20
                min-h-[50vh] sm:min-h-[55vh] p-3 sm:p-4 md:p-6
                transition-all duration-1000 ease-out
                hover:shadow-2xl hover:shadow-yellow-500/10 hover:scale-[1.01]
                hover:bg-white/15 hover:border-yellow-400/30
                ${
                  isLoaded
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-8 scale-95"
                }
              `}
            >
              {/* เว้นว่างไว้ตามต้องการ ใส่คอนเทนต์ภายหลัง */}
              <div
                className={`
                transition-all duration-1000 ease-out
                hover:scale-[1.02] hover:shadow-lg
                ${
                  isLoaded
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }
              `}
                style={{ transitionDelay: "0.2s" }}
              >
                <CardAddOn />
              </div>
              <div
                className={`
                transition-all duration-1000 ease-out
                hover:scale-[1.01] hover:shadow-md
                ${
                  isLoaded
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }
              `}
                style={{ transitionDelay: "0.4s" }}
              >
                <Slidemodal
                  onSelectCity={(city) => {
                    setPickupLocation(city);

                    // ปิดการ scroll ชั่วคราว แล้วค่อย scroll ขึ้นด้านบน (สำหรับ iOS)
                    setTimeout(() => {
                      // ลองใช้ทั้งสองวิธี เผื่อ Safari บล็อกตัวแรก
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      document.documentElement.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }, 150); // รอ 0.15 วิให้ transition ของ modal เสร็จ
                  }}
                />
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* FOOTER - Always at bottom */}
      <div
        className={`
        mt-auto
        transition-all duration-1000 ease-out
        hover:scale-[1.01] hover:shadow-lg
        ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
        style={{ transitionDelay: "0.6s" }}
      >
        <Footer />
      </div>
    </div>
  );
}
