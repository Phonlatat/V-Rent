"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { carTypes } from "@/data/carTypes";

const carTypeToFType = {
  any: undefined,
  eco: "ECO",
  sedan: "SEDAN",
  suv: "SUV",
  pickup: "PICKUP",
  van: "VAN",
};

// รวม date + time เป็น ISO (เวลาเครื่องผู้ใช้) → คืน ISO (UTC)
function toLocalISO(dateStr, timeStr) {
  const [y, m, d] = (dateStr || "").split("-").map(Number);
  const [hh = 0, mm = 0] = (timeStr || "00:00").split(":").map(Number);
  if (!y || !m || !d) return "";
  const dt = new Date(y, (m || 1) - 1, d, hh, mm, 0, 0);
  return Number.isNaN(dt.getTime()) ? "" : dt.toISOString();
}

function clampTime(t = "") {
  if (!/^\d{2}:\d{2}$/.test(t)) return "01:00";
  return t < "01:00" ? "01:00" : t > "23:59" ? "23:59" : t;
}

export default function BookingBox({ onSearch }) {
  const router = useRouter();

  const [form, setForm] = useState({
    pickupLocation: "",
    returnSame: true,
    dropoffLocation: "",
    pickupDate: "",
    pickupTime: "01:00",
    returnDate: "",
    returnTime: "23:59",
    carType: "any",
    passengers: 1,
    promo: "",
  });
  const [showMore, setShowMore] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const canSubmit = useMemo(() => {
    const required = [
      "pickupLocation",
      "pickupDate",
      "pickupTime",
      "returnDate",
      "returnTime",
    ];
    return required.every((k) => !!form[k]);
  }, [form]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1) เช็คฟิลด์จำเป็น
    const required = [
      "pickupLocation",
      "pickupDate",
      "pickupTime",
      "returnDate",
      "returnTime",
    ];
    const missing = required.filter((k) => !form[k]);
    if (missing.length) {
      alert("กรุณากรอกข้อมูลให้ครบ: " + missing.join(", "));
      return;
    }

    // 2) เช็คช่วงเวลา
    const pickupISO = toLocalISO(form.pickupDate, clampTime(form.pickupTime));
    const returnISO = toLocalISO(form.returnDate, clampTime(form.returnTime));
    if (
      !pickupISO ||
      !returnISO ||
      new Date(returnISO) <= new Date(pickupISO)
    ) {
      alert("เวลาคืนรถต้องช้ากว่าเวลารับรถ");
      return;
    }

    // 3) เตรียม payload
    const payload = {
      pickup_location: form.pickupLocation,
      dropoff_location: form.returnSame
        ? form.pickupLocation
        : form.dropoffLocation || "",
      pickup_at: pickupISO,
      return_at: returnISO,
      passengers: Number(form.passengers) || 1,
      promo: form.promo?.trim() || "",
      ...(carTypeToFType[form.carType]
        ? { ftype: carTypeToFType[form.carType] }
        : {}),
      _raw: { ...form },
      return_same: form.returnSame,
    };

    // 4) query ไป /cars
    const q = new URLSearchParams();
    if (payload.pickup_at) q.set("pickup_at", payload.pickup_at);
    if (payload.return_at) q.set("return_at", payload.return_at);
    if (payload.passengers) q.set("passengers", String(payload.passengers));
    if (payload.promo) q.set("promo", payload.promo);
    if (payload.ftype) q.set("ftype", payload.ftype);

    q.set("pickupLocation", form.pickupLocation);
    if (!form.returnSame && form.dropoffLocation) {
      q.set("dropoffLocation", form.dropoffLocation);
    }
    q.set("returnSame", String(form.returnSame));

    try {
      onSearch?.(payload);
    } catch (err) {
      console.error("onSearch error:", err);
    }

    router.push(`/cars?${q.toString()}`);
  };

  return (
    <section className="w-full text-black">
      <div className="mx-auto w-full max-w-6xl">
        {/* แถบค้นหาแบบบรรทัดเดียว */}
        <form
          onSubmit={handleSubmit}
          className="
            rounded-2xl bg-white shadow-xl/30 shadow-black/5 border border-slate-200
            backdrop-blur px-3 sm:px-4 py-2
          "
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 items-stretch">
            {/* สถานที่ */}
            <div className="lg:col-span-5">
              <label className="sr-only">สถานที่รับรถ</label>
              <div className="h-14 w-full rounded-xl border border-slate-300 focus-within:border-black bg-white px-3 sm:px-4 flex items-center gap-3">
                {/* icon pin */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-slate-500 shrink-0"
                  fill="currentColor"
                >
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5Z" />
                </svg>
                <input
                  type="text"
                  name="pickupLocation"
                  placeholder="สถานที่รับรถ (เช่น ท่าอากาศยานเชียงใหม่)"
                  value={form.pickupLocation}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full h-full outline-none bg-transparent text-[15px]"
                />
              </div>

              {/* toggle คืนรถคนละที่ */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="returnSame"
                  type="checkbox"
                  name="returnSame"
                  checked={form.returnSame}
                  onChange={handleChange}
                  className="rounded border-slate-400 text-black focus:ring-black"
                />
                <label htmlFor="returnSame" className="text-sm">
                  คืนรถจุดเดิม
                </label>
                {!form.returnSame && (
                  <input
                    type="text"
                    name="dropoffLocation"
                    placeholder="จุดคืนรถ"
                    value={form.dropoffLocation}
                    onChange={handleChange}
                    className="ml-2 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                )}
              </div>
            </div>

            {/* รับรถ (วัน/เวลา) */}
            <div className="lg:col-span-3">
              <div className="h-14 w-full rounded-xl border border-slate-300 bg-white px-3 sm:px-4 flex items-center">
                <div className="w-full grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">วันรับรถ</span>
                    <input
                      type="date"
                      name="pickupDate"
                      value={form.pickupDate}
                      onChange={handleChange}
                      className="outline-none bg-transparent text-[15px]"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">เวลา</span>
                    <input
                      type="time"
                      name="pickupTime"
                      value={form.pickupTime}
                      onChange={handleChange}
                      step="60"
                      min="01:00"
                      max="23:59"
                      lang="en-GB"
                      inputMode="numeric"
                      className="outline-none bg-transparent text-[15px]"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* คืนรถ (วัน/เวลา) */}
            <div className="lg:col-span-3">
              <div className="h-14 w-full rounded-xl border border-slate-300 bg-white px-3 sm:px-4 flex items-center">
                <div className="w-full grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">วันคืนรถ</span>
                    <input
                      type="date"
                      name="returnDate"
                      value={form.returnDate}
                      onChange={handleChange}
                      className="outline-none bg-transparent text-[15px]"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">เวลา</span>
                    <input
                      type="time"
                      name="returnTime"
                      value={form.returnTime}
                      onChange={handleChange}
                      step="60"
                      min="01:00"
                      max="23:59"
                      lang="en-GB"
                      inputMode="numeric"
                      className="outline-none bg-transparent text-[15px]"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ปุ่มค้นหา */}
            <div className="lg:col-span-1 flex">
              <button
                type="submit"
                disabled={!canSubmit}
                className="
                  w-full h-14 rounded-xl font-semibold
                  bg-[#2563eb] text-white
                  hover:bg-[#1d4ed8] disabled:bg-slate-300
                  inline-flex items-center justify-center gap-2
                "
                title={!canSubmit ? "กรอกข้อมูลที่จำเป็นให้ครบก่อน" : ""}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="currentColor"
                >
                  <path d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4a1 1 0 0 0 1.4-1.4l-4.4-4.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z" />
                </svg>
                ค้นหา
              </button>
            </div>
          </div>

          {/* ตัวเลือกเพิ่มเติม (พับเก็บ) */}
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowMore((s) => !s)}
              className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
            >
              ตัวเลือกเพิ่มเติม
              <svg
                viewBox="0 0 24 24"
                className={`w-4 h-4 transition ${showMore ? "rotate-180" : ""}`}
                fill="currentColor"
              >
                <path d="M12 15.5 5 8.5h14l-7 7Z" />
              </svg>
            </button>

            {/* แสดงสรุประยะเวลาเบาๆ */}
            <div className="text-xs text-slate-500">
              * โปรดเลือกวัน-เวลาให้ครบเพื่อค้นหารถว่าง
            </div>
          </div>

          {showMore && (
            <div className="pt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm mb-1">ประเภทรถ</label>
                <select
                  name="carType"
                  value={form.carType}
                  onChange={handleChange}
                  className="w-full h-11 rounded-lg border border-slate-300 px-3"
                >
                  {carTypes.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">ผู้โดยสาร</label>
                <select
                  name="passengers"
                  value={form.passengers}
                  onChange={handleChange}
                  className="w-full h-11 rounded-lg border border-slate-300 px-3"
                >
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">โค้ดโปรโมชัน</label>
                <input
                  type="text"
                  name="promo"
                  value={form.promo}
                  onChange={handleChange}
                  placeholder="กรอกถ้ามี"
                  className="w-full h-11 rounded-lg border border-slate-300 px-3"
                />
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
