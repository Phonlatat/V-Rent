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
      return_same: form.returnSame, // เผื่อฝั่งรับเป็น snake_case
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
    console.log("Booking search payload:", payload);
  };

  return (
    <section className="w-full text-black pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
      <div className="mx-auto w-full max-w-full sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        <div className="rounded-2xl shadow-lg border border-gray-200 bg-white/95 backdrop-blur">
          <div className="overflow-hidden rounded-2xl">
            <form
              onSubmit={handleSubmit}
              className="w-full box-border p-4 sm:p-5 md:p-6 lg:p-8"
            >
              <div className="mb-4 md:mb-6 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight">
                  ค้นหายานพาหนะ
                </h2>
              </div>

              {/* กริดหลัก: มือถือ 1 คอลัมน์ / md=มือถือแนวนอน+ไอแพด 6 / xl เดสก์ท็อป 12 */}
              <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-4 md:gap-5 min-w-0">
                {/* Pickup Location */}
                <div className="md:col-span-6 xl:col-span-4 min-w-0">
                  <label className="block text-sm font-medium mb-1">
                    จุดรับรถ *
                  </label>
                  <div className="relative focus-within:z-10">
                    <input
                      type="text"
                      name="pickupLocation"
                      placeholder="เช่น สนามบินหาดใหญ่"
                      value={form.pickupLocation}
                      onChange={handleChange}
                      autoComplete="off"
                      className="w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2 h-11 appearance-none"
                      required
                    />
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="returnSame"
                      checked={form.returnSame}
                      onChange={handleChange}
                      className="rounded border-gray-500 text-black focus:ring-black"
                    />
                    คืนรถที่จุดเดิม
                  </label>
                </div>

                {/* Drop-off Location */}
                <div className="md:col-span-6 xl:col-span-4 min-w-0">
                  <label className="block text-sm font-medium mb-1">
                    จุดคืนรถ {form.returnSame ? "(ล็อกเป็นจุดรับรถ)" : ""}
                  </label>
                  <div className="relative focus-within:z-10">
                    <input
                      type="text"
                      name="dropoffLocation"
                      placeholder="เช่น สาขาหาดใหญ่"
                      value={
                        form.returnSame
                          ? form.pickupLocation
                          : form.dropoffLocation
                      }
                      onChange={handleChange}
                      disabled={form.returnSame}
                      autoComplete="off"
                      className={`w-full rounded-lg md:rounded-xl px-3 py-2 h-11 appearance-none border ${
                        form.returnSame
                          ? "bg-gray-100 border-gray-300 text-gray-500"
                          : "border-gray-500 focus:border-black focus:ring-black"
                      }`}
                    />
                  </div>
                </div>

                {/* Car Type */}
                <div className="md:col-span-6 xl:col-span-4 min-w-0">
                  <label className="block text-sm font-medium mb-1">
                    ประเภทรถ
                  </label>
                  <div className="relative focus-within:z-10">
                    <select
                      name="carType"
                      value={form.carType}
                      onChange={handleChange}
                      className="w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2 h-11 appearance-none"
                    >
                      {carTypes.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ===== กลุ่ม วันที่/เวลา รับรถ : กริดย่อย 2 ช่อง ===== */}
                <div className="md:col-span-6 xl:col-span-6 min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="relative focus-within:z-10">
                      <label className="block text-sm font-medium mb-1">
                        วันที่รับรถ *
                      </label>
                      <input
                        type="date"
                        name="pickupDate"
                        value={form.pickupDate}
                        onChange={handleChange}
                        className="w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2 h-11 appearance-none"
                        required
                      />
                    </div>
                    <div className="relative focus-within:z-10">
                      <label className="block text-sm font-medium mb-1">
                        เวลารับรถ *
                      </label>
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
                        className="w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2 h-11 appearance-none text-[16px]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* ===== กลุ่ม วันที่/เวลา คืนรถ : กริดย่อย 2 ช่อง ===== */}
                <div className="md:col-span-6 xl:col-span-6 min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="relative focus-within:z-10">
                      <label className="block text-sm font-medium mb-1">
                        วันที่คืนรถ *
                      </label>
                      <input
                        type="date"
                        name="returnDate"
                        value={form.returnDate}
                        onChange={handleChange}
                        className="w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2 h-11 appearance-none"
                        required
                      />
                    </div>
                    <div className="relative focus-within:z-10">
                      <label className="block text-sm font-medium mb-1">
                        เวลาคืนรถ *
                      </label>
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
                        className="w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2 h-11 appearance-none text-[16px]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Passengers */}
                <div className="md:col-span-3 xl:col-span-3 min-w-0">
                  <label className="block text-sm font-medium mb-1">
                    ผู้โดยสาร
                  </label>
                  <div className="relative focus-within:z-10">
                    <select
                      name="passengers"
                      value={form.passengers}
                      onChange={handleChange}
                      className="w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2 h-11 appearance-none"
                    >
                      {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <div className="md:col-span-6 xl:col-span-12 flex justify-end">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 md:px-6 py-3 rounded-xl md:rounded-2xl bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed active:scale-[.99] transition"
                    title={!canSubmit ? "กรอกข้อมูลที่จำเป็นให้ครบก่อน" : ""}
                  >
                    ค้นหารถว่าง
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M13.5 4.5a.75.75 0 0 1 .75-.75h5.25a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V6.31l-7.22 7.22a.75.75 0 1 1-1.06-1.06l7.22-7.22h-3.44a.75.75 0 0 1-.75-.75Z" />
                      <path d="M3.75 5.25A2.25 2.25 0 0 1 6 3h5.25a.75.75 0 0 1 0 1.5H6A.75.75 0 0 0 5.25 5.25v12A.75.75 0 0 0 6 18h12a.75.75 0 0 0 .75-.75V12a.75.75 0 0 1 1.5 0v5.25A2.25 2.25 0 0 1 18 19.5H6A2.25 2.25 0 0 1 3.75 17.25v-12Z" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs">
                *
                กรุณากรอกข้อมูลที่จำเป็นให้ครบเพื่อค้นหารถว่างตามช่วงเวลาที่คุณต้องการ
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
