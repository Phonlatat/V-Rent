import { Suspense } from "react";
import Headers from "@/Components/HeaderISO";
import Footer from "@/Components/FooterMinimal";
import SummaryClient from "./SummaryClient";
import EntryNoticeClient from "./EntryNoticeClient";

export default function ChoosePaymentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white overflow-hidden">
      <title>Summary - V-Rent</title>
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
      `}</style>
      <Headers />

      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div
          className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 blur-3xl transition-all duration-1000"
          style={{
            left: "10%",
            top: "20%",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-400/20 blur-3xl transition-all duration-1000"
          style={{
            right: "10%",
            bottom: "20%",
            animation: "float 8s ease-in-out infinite reverse",
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
          <div className="relative p-3 sm:p-6 lg:p-8 xl:p-10">
            <div className="max-w-6xl mx-auto">
              {/* Header Section */}
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
                  <span className="text-white">สรุปการ</span>
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    จอง
                  </span>
                </h1>
                <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 mx-auto rounded-full"></div>
              </div>

              {/* ห่อหุ้ม Client Components ด้วย Suspense (ต้องครอบเพราะใช้ useSearchParams) */}
              <Suspense
                fallback={
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                  </div>
                }
              >
                <EntryNoticeClient />
                <SummaryClient />
              </Suspense>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
