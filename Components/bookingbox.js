// Components/BookingBox.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { carTypes } from "@/data/carTypes";

/* map ประเภทรถ -> ftype ของ ERP */
const carTypeToFType = {
  any: undefined,
  eco: "ECO",
  sedan: "SEDAN",
  suv: "SUV",
  pickup: "PICKUP",
  van: "VAN",
};

// รวม date + time เป็น ISO (ตามโซนเวลาเครื่อง) → คืน ISO (UTC)
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

// แปลงข้อมูลจาก URL parameters กลับเป็นรูปแบบฟอร์ม
function fromURLParams(searchParams) {
  const pickupAt = searchParams.get("pickupAt") || searchParams.get("pickup_at");
  const returnAt = searchParams.get("dropoffAt") || searchParams.get("return_at");
  
  // แปลง ISO string เป็น date และ time
  const parseDateTime = (isoString) => {
    if (!isoString) return { date: "", time: "01:00" };
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return { date: "", time: "01:00" };
      
      const pad = (n) => String(n).padStart(2, "0");
      const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      return { date, time };
    } catch {
      return { date: "", time: "01:00" };
    }
  };

  const pickupDateTime = parseDateTime(pickupAt);
  const returnDateTime = parseDateTime(returnAt);

  // แปลง ftype กลับเป็น carType
  const ftypeToCarType = {
    "ECO": "eco",
    "SEDAN": "sedan", 
    "SUV": "suv",
    "PICKUP": "pickup",
    "VAN": "van"
  };

  return {
    pickupLocation: searchParams.get("pickupLocation") || searchParams.get("pickup_location") || "",
    dropoffLocation: searchParams.get("dropoffLocation") || searchParams.get("dropoff_location") || "",
    returnSame: searchParams.get("returnSame") !== "false" && searchParams.get("return_same") !== "false",
    pickupDate: pickupDateTime.date,
    pickupTime: pickupDateTime.time,
    returnDate: returnDateTime.date,
    returnTime: returnDateTime.time,
    carType: ftypeToCarType[searchParams.get("ftype")] || "any",
    passengers: Number(searchParams.get("passengers")) || 1,
    promo: searchParams.get("promo") || "",
  };
}

/**
 * BookingBox (Reusable)
 * props:
 *  - onSearch(payload)         : callback (optional)
 *  - pickupLocation            : string (optional, พรีฟิล)
 *  - setPickupLocation(v)      : fn (optional, bubble ค่ากลับขึ้น parent)
 *  - pushToCars                : boolean (default true) จะ router.push ไป /cars ให้เลย
 *  - defaultShowMore           : boolean (optional) เปิดส่วนเสริมไว้ก่อน
 */
export default function BookingBox({
  onSearch,
  pickupLocation = "",
  setPickupLocation,
  pushToCars = true,
  defaultShowMore = false,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ดึงข้อมูลจาก URL parameters มาใส่ในฟอร์ม
  const urlData = fromURLParams(searchParams);
  
  const [form, setForm] = useState({
    pickupLocation: pickupLocation || urlData.pickupLocation,
    returnSame: urlData.returnSame,
    dropoffLocation: urlData.dropoffLocation,
    pickupDate: urlData.pickupDate,
    pickupTime: urlData.pickupTime,
    returnDate: urlData.returnDate,
    returnTime: urlData.returnTime,
    carType: urlData.carType,
    passengers: urlData.passengers,
    promo: urlData.promo,
  });

  // ✅ sync ค่า pickupLocation จาก prop แบบถูกต้อง (เลี่ยง setState ระหว่าง render)
  useEffect(() => {
    setForm((prev) =>
      prev.pickupLocation === (pickupLocation || "")
        ? prev
        : { ...prev, pickupLocation: pickupLocation || "" }
    );
  }, [pickupLocation]);

  // ✅ อัปเดตฟอร์มเมื่อ URL parameters เปลี่ยน
  useEffect(() => {
    const newUrlData = fromURLParams(searchParams);
    setForm((prev) => ({
      ...prev,
      pickupLocation: pickupLocation || newUrlData.pickupLocation,
      returnSame: newUrlData.returnSame,
      dropoffLocation: newUrlData.dropoffLocation,
      pickupDate: newUrlData.pickupDate,
      pickupTime: newUrlData.pickupTime,
      returnDate: newUrlData.returnDate,
      returnTime: newUrlData.returnTime,
      carType: newUrlData.carType,
      passengers: newUrlData.passengers,
      promo: newUrlData.promo,
    }));
  }, [searchParams, pickupLocation]);

  // ✅ state สำหรับเปิด–ปิด "ตัวเลือกเพิ่มเติม"
  const [showMore, setShowMore] = useState(!!defaultShowMore);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const v = type === "checkbox" ? checked : value;
    setForm((prev) => ({ ...prev, [name]: v }));
    if (name === "pickupLocation") setPickupLocation?.(v);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

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

    onSearch?.(payload);

    if (pushToCars) {
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
      router.push(`/cars?${q.toString()}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white/95 shadow-xl/30 shadow-black/5 border border-white/40 backdrop-blur px-3 sm:px-4 py-2 text-slate-900"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 items-stretch">
        {/* สถานที่ */}
        <div className="lg:col-span-5">
          <label className="sr-only">สถานที่รับรถ</label>
          <div className="h-14 w-full rounded-xl border border-slate-300 focus-within:ring-2 focus-within:ring-blue-500/40 bg-white px-3 sm:px-4 flex items-center gap-3">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-slate-600"
              fill="currentColor"
            >
              <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5Z" />
            </svg>
            <input
              type="text"
              placeholder="สถานที่รับรถ (เช่น สนามบินเชียงใหม่)"
              className="w-full bg-transparent outline-none placeholder:text-slate-500"
              name="pickupLocation"
              value={form.pickupLocation}
              onChange={handleChange}
            />
          </div>

          {/* toggle คืนรถคนละที่ */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2">
              <input
                id="returnSame"
                type="checkbox"
                name="returnSame"
                checked={form.returnSame}
                onChange={handleChange}
                className="rounded border-slate-400 text-black focus:ring-black"
              />
              <span className="text-sm text-slate-800">คืนรถจุดเดิม</span>
            </label>

            <div
              className={[
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                form.returnSame
                  ? "grid-rows-[0fr] opacity-0 pointer-events-none"
                  : "grid-rows-[1fr] opacity-100",
                "w-full sm:flex-1",
              ].join(" ")}
            >
              <div className="overflow-hidden">
                <input
                  type="text"
                  name="dropoffLocation"
                  placeholder="จุดคืนรถ"
                  value={form.dropoffLocation}
                  onChange={handleChange}
                  className="mt-2 sm:mt-0 w-full sm:min-w-[220px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* รับรถ (วัน/เวลา) */}
        <div className="lg:col-span-3">
          <div className="h-14 w-full rounded-xl border border-slate-300 bg-white px-3 sm:px-4 flex items-center">
            <div className="w-full grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <span className="text-xs text-slate-700">วันรับรถ</span>
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
                <span className="text-xs text-slate-700">เวลา</span>
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
                <span className="text-xs text-slate-700">วันคืนรถ</span>
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
                <span className="text-xs text-slate-700">เวลา</span>
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
            className="w-full h-14 rounded-xl font-semibold bg-[#000000] text-white hover:bg-[#494949] disabled:bg-slate-300 inline-flex items-center justify-center gap-2"
            title={!canSubmit ? "กรอกข้อมูลที่จำเป็นให้ครบก่อน" : ""}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4a1 1 0 0 0 1.4-1.4l-4.4-4.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z" />
            </svg>
            ค้นหา
          </button>
        </div>
      </div>

      {/* แถวปุ่ม toggle + hint */}
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          aria-expanded={showMore}
          className="text-sm text-slate-800 hover:text-slate-900 inline-flex items-center gap-1"
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

        <div className="text-xs text-slate-700">
          * โปรดเลือกวัน-เวลาให้ครบเพื่อค้นหารถว่าง
        </div>
      </div>

      {/* ส่วน “ตัวเลือกเพิ่มเติม” พร้อมแอนิเมชันลื่น ๆ */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          showMore ? "max-h-[420px] opacity-100 pt-3" : "max-h-0 opacity-0 pt-0"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1 text-slate-800">
              ประเภทรถ
            </label>
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
            <label className="block text-sm mb-1 text-slate-800">
              ผู้โดยสาร
            </label>
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
            <label className="block text-sm mb-1 text-slate-800">
              โค้ดโปรโมชัน
            </label>
            <input
              type="text"
              name="promo"
              value={form.promo}
              onChange={handleChange}
              placeholder="กรอกถ้ามี"
              className="w-full h-11 rounded-lg border border-slate-300 px-3 placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
