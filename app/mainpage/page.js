"use client";

import CardAddOn from "@/Components/CardAddOn";
import Footer from "@/Components/FooterMinimal";
import Header from "@/Components/Headnsearch";
import Slidemodal from "@/Components/Slidemodal";
import { useState, useEffect } from "react";

export default function Home() {
  const [pickupLocation, setPickupLocation] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      <title>MainPage - V-Rent</title>
      
      {/* Subtle Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-400/10 to-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-yellow-400/20 rounded-full animate-pulse"
              style={{
                width: `${1 + Math.random() * 3}px`,
                height: `${1 + Math.random() * 3}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <div className={`
          transition-all duration-1000 ease-out
          ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        `}>
          <Header
            pickupLocation={pickupLocation}
            setPickupLocation={setPickupLocation}
          />
        </div>
        {/* BODY: กล่องสีขาวขอบมน ว่างเปล่า */}
        <main className="flex-1 bg-transparent">
          <div className="pt-0">
            {/* ดึงกล่องขึ้นมาทับ */}
            <div className={`
              w-full -mt-16 sm:-mt-24 md:-mt-32 lg:-mt-36 relative z-20
              transition-all duration-1000 ease-out
              ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `} style={{ transitionDelay: '0.1s' }}>
              <section
                className={`
                  rounded-4xl bg-white shadow-xl ring-1 ring-black/5
                  min-h-[55vh] p-4 sm:p-6
                  transition-all duration-1000 ease-out
                  hover:shadow-2xl hover:shadow-black/10 hover:scale-[1.01]
                  hover:ring-black/10
                  ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}
                `}
              >
                {/* เว้นว่างไว้ตามต้องการ ใส่คอนเทนต์ภายหลัง */}
                <div className={`
                  transition-all duration-1000 ease-out
                  hover:scale-[1.02] hover:shadow-lg
                  ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `} style={{ transitionDelay: '0.2s' }}>
                  <CardAddOn />
                </div>
                <div className={`
                  transition-all duration-1000 ease-out
                  hover:scale-[1.01] hover:shadow-md
                  ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `} style={{ transitionDelay: '0.4s' }}>
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

        {/* FOOTER */}
        <div className={`
          transition-all duration-1000 ease-out
          hover:scale-[1.01] hover:shadow-lg
          ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `} style={{ transitionDelay: '0.6s' }}>
          <Footer />
        </div>
      </div>
    </div>
  );
}
