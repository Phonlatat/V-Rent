// app/payment/summary/page.js
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
    <div className="min-h-screen bg-white text-slate-900">
      <title>Payment Summary - V-Rent</title>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Success banner */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 shadow-lg bg-gradient-to-br from-green-50 to-slate-50">
          <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 bg-white/60 backdrop-blur">
            <div className="h-10 w-10 rounded-full grid place-items-center bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg">
              ✓
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              การชำระเงินเสร็จสิ้น
            </h1>
            <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold px-4 py-2">
              สถานะ {status}
            </span>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-8">
              {/* LEFT: detail */}
              <section className="space-y-6">
                {/* Booking + payer */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-sm text-slate-600">เลขอ้างอิง</span>
                    <span className="inline-flex items-center rounded-lg bg-slate-800 text-white text-sm font-semibold px-3 py-1.5">
                      {rentalId || confirmation || "—"}
                    </span>
                    <span className="inline-flex items-center rounded-lg bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1.5">
                      วิธีชำระ: {method}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <h3 className="font-bold text-slate-800 mb-2">ผู้จอง</h3>
                      <div className="space-y-1 text-slate-600">
                        <div>ชื่อ: <span className="font-medium text-slate-800">{name}</span></div>
                        <div>โทร: <span className="font-medium text-slate-800">{phone}</span></div>
                        <div>อีเมล: <span className="font-medium text-slate-800">{email}</span></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 mb-2">
                        สถานที่ / เวลา
                      </h3>
                      <div className="space-y-1 text-slate-600">
                        <div>รับรถ: <span className="font-medium text-slate-800">{pickupLocation}</span></div>
                        <div>คืนรถ: <span className="font-medium text-slate-800">{dropoffLocation}</span></div>
                        <div>วัน–เวลารับ: <span className="font-medium text-slate-800">{pickup_at}</span></div>
                        <div>วัน–เวลาคืน: <span className="font-medium text-slate-800">{return_at}</span></div>
                      </div>
                    </div>
                  </div>

                  {note && note !== "-" ? (
                    <>
                      <hr className="my-4 border-slate-200" />
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">หมายเหตุ:</span>{" "}
                        <span className="whitespace-pre-wrap break-words">
                          {note}
                        </span>
                      </p>
                    </>
                  ) : null}
                </div>

                {/* Price card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">การชำระเงิน</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-600">ราคาต่อวัน</span>
                      <span className="font-medium text-slate-800">฿{n(pricePerDay)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-600">
                        ราคารถรวม (x{dayCount})
                      </span>
                      <span className="font-medium text-slate-800">฿{n(baseTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-600">ราคามัดจำ</span>
                      <span className="font-medium text-slate-800">฿500</span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                      <span className="text-lg font-bold text-slate-800">ยอดรวมทั้งหมด</span>
                      <span className="text-xl font-bold text-yellow-600">
                        ฿{n(total)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-200">
                      <span className="text-slate-700">ชำระมัดจำแล้ว</span>
                      <span className="font-semibold text-green-700">
                        ฿{n(deposit)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* RIGHT: car card (full spec) */}
              <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {/* รูปภาพรถ */}
                <div className="relative w-full overflow-hidden rounded-xl aspect-video bg-slate-100 grid place-items-center">
                  <img
                    src={carImage}
                    alt={carName}
                    className="h-full w-full object-cover cursor-zoom-in transition-transform hover:scale-105"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "/noimage.jpg";
                    }}
                    onClick={() => setShowImage(true)}
                  />
                </div>

                {/* Lightbox */}
                {showImage && (
                  <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setShowImage(false)}
                    role="dialog"
                    aria-modal="true"
                  >
                    <img
                      src={carImage}
                      alt={carName}
                      className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                      onError={(e) => {
                        e.currentTarget.src = "/noimage.jpg";
                      }}
                    />
                    <button
                      onClick={() => setShowImage(false)}
                      className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-800 font-bold rounded-full w-10 h-10 grid place-items-center shadow-lg transition-all duration-300 hover:scale-110"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* ชื่อรถ + ราคา/วัน + จำนวนวัน */}
                <div className="mt-3">
                  <div className="font-semibold text-base break-words">
                    {carBrand !== "-" ? `${carBrand} ` : ""}
                    {carName}
                    {carYear !== "-" ? ` (${carYear})` : ""}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
                      ราคา/วัน ฿{n(pricePerDay)}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
                      รวม {dayCount} วัน
                    </span>
                    {method !== "-" && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">
                        {method}
                      </span>
                    )}
                  </div>
                </div>

                {/* สเปครถ */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">ประเภทรถ</div>
                    <div className="font-medium text-slate-900">{carType}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">ระบบเกียร์</div>
                    <div className="font-medium text-slate-900">
                      {carTransmission}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">เชื้อเพลิง</div>
                    <div className="font-medium text-slate-900">{carFuel}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">จำนวนที่นั่ง</div>
                    <div className="font-medium text-slate-900">
                      {carSeats === "-" ? "—" : `${carSeats} ที่นั่ง`}
                    </div>
                  </div>
                </div>
              </aside>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/mainpage"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all duration-300 hover:border-slate-400"
                >
                  <svg
                    className="w-4 h-4"
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
      </main>
    </div>
  );
}
