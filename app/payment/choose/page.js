// app/payment/choose/page.js
// ไฟล์นี้เป็น Server Component โดยค่าเริ่มต้น

import { Suspense } from "react";
import Headers from "@/Components/HeaderISO";
import Footer from "@/Components/FooterMinimal";
import ChoosePaymentClient from "./ChoosePaymentClient"; // Import Client Component ที่สร้างใหม่

export default function ChoosePaymentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white overflow-hidden">
      <title>PaymentPage - V-Rent</title>
      <Headers />

      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div
          className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 blur-3xl transition-all duration-1000 animate-pulse"
          style={{
            left: "10%",
            top: "20%",
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-400/20 blur-3xl transition-all duration-1000 animate-pulse"
          style={{
            right: "10%",
            bottom: "20%",
            animationDelay: "1s",
          }}
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <main className="flex-grow relative z-10">
        <section className="relative">
          {/* เนื้อหาจริง */}
          <div className="relative px-2 py-3 sm:px-3 sm:py-4 md:px-4 md:py-6 lg:px-6 lg:py-8 xl:px-8 xl:py-10">
            <div className="w-full">
              {/* Header Section */}
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
                  <span className="text-white">เลือก</span>
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    วิธีการชำระเงิน
                  </span>
                </h1>
                <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 mx-auto rounded-full"></div>
              </div>

              {/* ห่อหุ้ม Client Component ด้วย Suspense */}
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-white">
                          กำลังโหลดข้อมูลการจอง...
                        </span>
                      </div>
                    </div>
                  </div>
                }
              >
                <ChoosePaymentClient />
              </Suspense>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
