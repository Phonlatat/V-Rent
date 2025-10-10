// app/cars/CarsPageContent.js
"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import BookingBox from "@/Components/bookingbox";
import CarsFilter from "@/Components/CarsCard/carsfilter";
import CarList from "@/Components/CarsCard/carList";

/* ===== utilities (เฉพาะที่จำเป็น) ===== */
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
function fromISOToInputs(iso) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (isNaN(d)) return { date: "", time: "" };
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function CarsPageContent() {
  const search = useSearchParams();

  /* ------ ดึงค่าจาก URL (payload คงค่า form ของผู้ใช้) ------ */
  const payload = useMemo(() => {
    const pickup_at = search.get("pickup_at") || "";
    const return_at = search.get("return_at") || "";
    const passengers = Number(search.get("passengers") || 1);
    const promo = search.get("promo") || "";
    const ftype = search.get("ftype") || "";
    const pickupLocation =
      search.get("pickupLocation") || search.get("pickup_location") || "";
    const dropoffLocation =
      search.get("dropoffLocation") || search.get("dropoff_location") || "";
    const returnSameRaw =
      search.get("returnSame") ?? search.get("return_same") ?? "true";

    return {
      pickup_at,
      return_at,
      passengers,
      promo,
      ftype,
      pickupLocation,
      dropoffLocation,
      returnSame: String(returnSameRaw) !== "false",
    };
  }, [search]);

  /* ------ ตัวกรองฝั่งซ้าย ------ */
  const [flt, setFlt] = useState({
    type: payload.ftype || "", // SEDAN | SUV | ...
    seatBucket: "", // "5-" | "6-7" | "8+"
    trans: "", // "auto" | "manual"
    priceMin: "",
    priceMax: "",
    popular: {
      freeCancel: false,
      instantConfirm: false,
      delivery: false,
    },
  });

  /* ------ รวม query ส่งเข้า CarList ------ */
  // ถ้าจะใช้ค่าจากฟอร์มวัน-เวลา (กรณีหน้าอื่น) ให้ประกอบด้วย toLocalISO + clampTime ได้ตามต้องการ
  const listQuery = useMemo(() => {
    return {
      // ค่าหลักจาก URL
      pickup_at: payload.pickup_at,
      return_at: payload.return_at,
      passengers: payload.passengers,
      promo: payload.promo,
      ftype: payload.ftype,
      // ตัวกรองเสริม
      seatBucket: flt.seatBucket,
      trans: flt.trans,
      priceMin: flt.priceMin,
      priceMax: flt.priceMax,
      popular: flt.popular,
    };
  }, [payload, flt]);

  /* ------ UI ------ */
  return (
    <div className="w-full min-h-[1px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* การ์ด BookingBox (กรอบอยู่ฝั่งหน้าครอบไว้) */}
        <div className="rounded-2xl border border-slate-300 shadow-lg p-3 sm:p-4 bg-white">
          <BookingBox />
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* ซ้าย: ฟิลเตอร์ */}
          <div>
            <CarsFilter
              value={flt}
              onChange={setFlt}
              onReset={() =>
                setFlt({
                  type: payload.ftype || "",
                  seatBucket: "",
                  trans: "",
                  priceMin: "",
                  priceMax: "",
                  popular: {
                    freeCancel: false,
                    instantConfirm: false,
                    delivery: false,
                  },
                })
              }
              className=""
            />
          </div>

          {/* ขวา: รายการรถ */}
          <div className="col-span-4 lg:col-span-3 rounded-2xl border border-slate-200 shadow-sm p-4 bg-white">
            <CarList
              query={listQuery}
              onSelect={(car) => console.log("select car:", car)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
