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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <title>Payment Summary - V-Rent</title>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Success banner */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-gradient-to-br from-emerald-50 to-slate-50">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 bg-white/60 backdrop-blur">
            <div className="h-8 w-8 rounded-full grid place-items-center bg-emerald-600 text-white">
              ✓
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold">
              การชำระเงินเสร็จสิ้น
            </h1>
            <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1">
              สถานะ {status}
            </span>
          </div>

          <div className="p-5 md:p-7">
            <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6">
              {/* LEFT: detail */}
              <section className="space-y-6">
                {/* Booking + payer */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-sm text-slate-600">เลขอ้างอิง</span>
                    <span className="inline-flex items-center rounded-md bg-slate-900 text-white text-xs font-semibold px-2.5 py-1">
                      {rentalId || confirmation || "—"}
                    </span>
                    <span className="ml-2 inline-flex items-center rounded-md bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1">
                      วิธีชำระ: {method}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h3 className="font-bold text-slate-900">ผู้จอง</h3>
                      <div className="mt-1 space-y-0.5 text-slate-700">
                        <div>ชื่อ: {name}</div>
                        <div>โทร: {phone}</div>
                        <div>อีเมล: {email}</div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        สถานที่ / เวลา
                      </h3>
                      <div className="mt-1 space-y-0.5 text-slate-700">
                        <div>รับรถ: {pickupLocation}</div>
                        <div>คืนรถ: {dropoffLocation}</div>
                        <div>วัน–เวลารับ: {pickup_at}</div>
                        <div>วัน–เวลาคืน: {return_at}</div>
                      </div>
                    </div>
                  </div>

                  {note && note !== "-" ? (
                    <>
                      <hr className="my-4 border-slate-200" />
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">หมายเหตุ:</span>{" "}
                        <span className="whitespace-pre-wrap break-words">
                          {note}
                        </span>
                      </p>
                    </>
                  ) : null}
                </div>

                {/* Price card */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-3">การชำระเงิน</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">ราคาต่อวัน</span>
                      <span className="font-medium">฿{n(pricePerDay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">
                        ราคารถรวม (x{dayCount})
                      </span>
                      <span className="font-medium">฿{n(baseTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">ราคามัดจำ</span>
                      <span className="font-medium">฿500</span>
                    </div>

                    <div className="flex justify-between pt-2">
                      <span className="text-base font-bold">ยอดรวมทั้งหมด</span>
                      <span className="text-base font-extrabold">
                        ฿{n(total)}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-slate-200 pt-3">
                      <span className="text-slate-700">ชำระมัดจำแล้ว</span>
                      <span className="font-semibold text-emerald-700">
                        ฿{n(deposit)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* RIGHT: car card (full spec) */}
              <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                {/* รูปภาพรถ */}
                <div className="relative w-full overflow-hidden rounded-lg aspect-video bg-slate-100 grid place-items-center">
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
                      className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                      onClick={(e) => e.stopPropagation()} // กันคลิกโดนพื้นหลัง
                      onError={(e) => {
                        e.currentTarget.src = "/noimage.jpg";
                      }}
                    />
                    <button
                      onClick={() => setShowImage(false)}
                      className="absolute top-4 right-4 bg-white/80 hover:bg-white text-slate-900 font-bold rounded-full w-8 h-8 grid place-items-center shadow-md"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Lightbox แสดงรูปเต็มจอ */}
                {showImage && (
                  <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setShowImage(false)}
                  >
                    <img
                      src={carImage}
                      alt={carName}
                      className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                      onError={(e) => {
                        e.currentTarget.src = "/noimage.jpg";
                      }}
                    />
                    <button
                      onClick={() => setShowImage(false)}
                      className="absolute top-4 right-4 bg-white/80 hover:bg-white text-slate-900 font-bold rounded-full w-8 h-8 grid place-items-center shadow-md"
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
                  href="/"
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
                >
                  กลับหน้าแรก
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
