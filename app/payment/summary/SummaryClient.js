// app/payment/summary/page.js
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const n = (v) => Number(v || 0).toLocaleString();

export default function PaymentSummaryPage() {
  const sp = useSearchParams();
  const [showImage, setShowImage] = useState(false);
  // (ไม่บังคับ) ปิดด้วยปุ่ม ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setShowImage(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const status = sp.get("paymentStatus") || "success";
  const method = sp.get("method") || "-";
  const deposit = sp.get("deposit") || "0";
  const total = sp.get("total") || "0";
  const baseTotal = sp.get("baseTotal") || "0";
  const extrasSum = sp.get("extrasSum") || "0";
  const dayCount = sp.get("dayCount") || "1";

  const name = sp.get("name") || "-";
  const phone = sp.get("phone") || "-";
  const email = sp.get("email") || "-";
  const note = sp.get("note") || "-";

  const pickupLocation = sp.get("pickupLocation") || "-";
  const dropoffLocation = sp.get("dropoffLocation") || "-";
  const pickup_at = sp.get("pickup_at") || "-";
  const return_at = sp.get("return_at") || "-";

  const carName = sp.get("carName") || "-";
  const carImage = sp.get("carImage") || "/noimage.jpg";
  const pricePerDay = sp.get("pricePerDay") || "0";
  const carBrand = sp.get("carBrand") || "-";
  const carType = sp.get("carType") || "-";
  const carYear = sp.get("carYear") || "-";
  const carTransmission = sp.get("carTransmission") || "-";
  const carSeats = sp.get("carSeats") || "-";
  const carFuel = sp.get("carFuel") || "-";
  const carId = sp.get("carId") || "";

  const rentalId = sp.get("rental_id") || "";
  const confirmation = sp.get("confirmation") || "";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Success banner */}
      <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl bg-gradient-to-br from-green-500/10 to-slate-500/10 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-6 border-b border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full grid place-items-center bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-sm sm:text-lg">
            ✓
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center sm:text-left">
            การชำระเงินเสร็จสิ้น
          </h1>
          <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-green-500/20 text-green-300 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 border border-green-400/30">
            สถานะ {status}
          </span>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-4 sm:gap-6 lg:gap-8">
            {/* LEFT: detail */}
            <section className="space-y-4 sm:space-y-6">
              {/* Booking + payer */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-6 shadow-2xl group hover:bg-white/15 transition-all duration-300">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm text-slate-300">
                    เลขอ้างอิง
                  </span>
                  <span className="inline-flex items-center rounded-lg bg-slate-800/50 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 sm:py-1.5 border border-white/20">
                    {rentalId || confirmation || "—"}
                  </span>
                  <span className="inline-flex items-center rounded-lg bg-white/10 text-white text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 sm:py-1.5 border border-white/20">
                    วิธีชำระ: {method}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm">
                  <div>
                    <h3 className="font-bold text-white mb-2 flex items-center">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg mr-2 flex items-center justify-center">
                        <svg
                          className="w-2 h-2 sm:w-3 sm:h-3 text-black"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      ผู้จอง
                    </h3>
                    <div className="space-y-1 text-slate-300">
                      <div>
                        ชื่อ:{" "}
                        <span className="font-medium text-white">{name}</span>
                      </div>
                      <div>
                        โทร:{" "}
                        <span className="font-medium text-white">{phone}</span>
                      </div>
                      <div>
                        อีเมล:{" "}
                        <span className="font-medium text-white">{email}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-2 flex items-center">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg mr-2 flex items-center justify-center">
                        <svg
                          className="w-2 h-2 sm:w-3 sm:h-3 text-black"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                      </div>
                      สถานที่ / เวลา
                    </h3>
                    <div className="space-y-1 text-slate-300">
                      <div>
                        รับรถ:{" "}
                        <span className="font-medium text-white">
                          {pickupLocation}
                        </span>
                      </div>
                      <div>
                        คืนรถ:{" "}
                        <span className="font-medium text-white">
                          {dropoffLocation}
                        </span>
                      </div>
                      <div>
                        วัน–เวลารับ:{" "}
                        <span className="font-medium text-white">
                          {pickup_at}
                        </span>
                      </div>
                      <div>
                        วัน–เวลาคืน:{" "}
                        <span className="font-medium text-white">
                          {return_at}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {note && note !== "-" ? (
                  <>
                    <hr className="my-3 sm:my-4 border-white/10" />
                    <p className="text-xs sm:text-sm text-slate-300">
                      <span className="font-semibold">หมายเหตุ:</span>{" "}
                      <span className="whitespace-pre-wrap break-words">
                        {note}
                      </span>
                    </p>
                  </>
                ) : null}
              </div>

              {/* Price card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-6 shadow-2xl group hover:bg-white/15 transition-all duration-300">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg mr-2 sm:mr-3 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4 text-black"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  การชำระเงิน
                </h3>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
                    <span className="text-slate-300">ราคาต่อวัน</span>
                    <span className="font-medium text-white">
                      ฿{n(pricePerDay)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
                    <span className="text-slate-300">
                      ราคารถรวม (x{dayCount})
                    </span>
                    <span className="font-medium text-white">
                      ฿{n(baseTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
                    <span className="text-slate-300">ราคามัดจำ</span>
                    <span className="font-medium text-white">฿500</span>
                  </div>

                  <div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-xl sm:rounded-2xl border border-yellow-400/30">
                    <span className="text-base sm:text-lg font-bold text-white">
                      ยอดรวมทั้งหมด
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-yellow-400">
                      ฿{n(total)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 sm:p-3 bg-green-500/10 backdrop-blur-sm rounded-lg sm:rounded-xl border border-green-500/30">
                    <span className="text-slate-300">ชำระมัดจำแล้ว</span>
                    <span className="font-semibold text-green-400">
                      ฿{n(deposit)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT: car card (full spec) */}
            <aside className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-6 shadow-2xl group hover:bg-white/15 transition-all duration-300">
              {/* รูปภาพรถ */}
              <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl aspect-video bg-slate-800/50 grid place-items-center">
                <Image
                  src={carImage}
                  alt={carName}
                  fill
                  className="object-cover cursor-zoom-in transition-transform hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={(e) => {
                    e.currentTarget.src = "/noimage.jpg";
                  }}
                  onClick={() => setShowImage(true)}
                />
              </div>

              {/* Lightbox */}
              {showImage && (
                <div
                  className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                  onClick={() => setShowImage(false)}
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="relative max-h-[90vh] max-w-[90vw]">
                    <Image
                      src={carImage}
                      alt={carName}
                      width={800}
                      height={600}
                      className="object-contain rounded-xl sm:rounded-2xl shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                      onError={(e) => {
                        e.currentTarget.src = "/noimage.jpg";
                      }}
                    />
                  </div>
                  <button
                    onClick={() => setShowImage(false)}
                    className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white/20 hover:bg-white/30 text-white font-bold rounded-full w-10 h-10 sm:w-12 sm:h-12 grid place-items-center shadow-lg transition-all duration-300 hover:scale-110 border border-white/30"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* ชื่อรถ + ราคา/วัน + จำนวนวัน */}
              <div className="mt-3 sm:mt-4">
                <div className="font-semibold text-sm sm:text-base break-words text-white">
                  {carBrand !== "-" ? `${carBrand} ` : ""}
                  {carName}
                  {carYear !== "-" ? ` (${carYear})` : ""}
                </div>

                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                  <span className="px-2 sm:px-2.5 py-1 rounded-full bg-white/10 text-white text-xs border border-white/20">
                    ราคา/วัน ฿{n(pricePerDay)}
                  </span>
                  <span className="px-2 sm:px-2.5 py-1 rounded-full bg-white/10 text-white text-xs border border-white/20">
                    รวม {dayCount} วัน
                  </span>
                  {method !== "-" && (
                    <span className="px-2 sm:px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 text-xs border border-green-400/30">
                      {method}
                    </span>
                  )}
                </div>
              </div>

              {/* สเปครถ */}
              <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="rounded-lg sm:rounded-xl border border-white/20 p-2 sm:p-3 bg-white/5 backdrop-blur-sm">
                  <div className="text-xs text-slate-400">ประเภทรถ</div>
                  <div className="font-medium text-white">{carType}</div>
                </div>
                <div className="rounded-lg sm:rounded-xl border border-white/20 p-2 sm:p-3 bg-white/5 backdrop-blur-sm">
                  <div className="text-xs text-slate-400">ระบบเกียร์</div>
                  <div className="font-medium text-white">
                    {carTransmission}
                  </div>
                </div>
                <div className="rounded-lg sm:rounded-xl border border-white/20 p-2 sm:p-3 bg-white/5 backdrop-blur-sm">
                  <div className="text-xs text-slate-400">เชื้อเพลิง</div>
                  <div className="font-medium text-white">{carFuel}</div>
                </div>
                <div className="rounded-lg sm:rounded-xl border border-white/20 p-2 sm:p-3 bg-white/5 backdrop-blur-sm">
                  <div className="text-xs text-slate-400">จำนวนที่นั่ง</div>
                  <div className="font-medium text-white">
                    {carSeats === "-" ? "—" : `${carSeats} ที่นั่ง`}
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link
                href="/mainpage"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 hover:border-white/30 text-sm sm:text-base"
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                กลับหน้าหลัก
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
