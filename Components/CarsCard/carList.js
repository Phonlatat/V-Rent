// Components/CarsCard/carList.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const noImg = "/noimage.jpg"; // ชี้ไปที่ public/noimage.jpg

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .trim();
/* ====== helpersที่อ่านคีย์จาก API ชุดใหม่ก่อน ====== */
const nthai = (v) =>
  Number(v ?? 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });

const takeSeats = (car) =>
  Number(
    // API ใหม่
    car.seat ??
      // เผื่อคีย์เก่า
      car.seats ??
      car.seat_count ??
      car.passengers ??
      car.capacity
  ) || 0;

const takeTrans = (car) =>
  String(
    // API ใหม่
    car.gear_system ??
      // เผื่อคีย์เก่า
      car.transmission ??
      car.gear ??
      car.gear_type ??
      ""
  )
    .trim()
    .toLowerCase();

const takePrice = (car) =>
  Number(
    // API ใหม่
    car.price ??
      // เผื่อคีย์เก่า
      car.price_per_day ??
      car.rate_per_day ??
      0
  );

const isCarAvailable = (car) => {
  // API ใหม่: "status": "Available"
  const s = String(
    car.status ?? car.vehicle_status ?? car.stage ?? car.state ?? ""
  )
    .trim()
    .toLowerCase();
  if (s) return s === "available" || s === "ว่าง";
  // เผื่อคีย์ boolean เก่า
  if (typeof car.available === "boolean") return car.available;
  if (typeof car.is_available === "boolean") return car.is_available;
  if (typeof car.is_free === "boolean") return car.is_free;
  if (typeof car.rented === "boolean") return !car.rented;
  if (typeof car.is_busy === "boolean") return !car.is_busy;
  return true; // ไม่รู้สถานะ ถือว่าไม่ตัดทิ้ง
};

/* ====== image helpers ====== */
const ERP_BASE = (
  process.env.NEXT_PUBLIC_ERP_BASE || "http://203.150.243.195"
).replace(/\/+$/, "");

/** รวม path เป็น URL พร้อมใช้
 * - ถ้าเป็น http/https อยู่แล้ว -> ใช้เลย
 * - ถ้าเป็น path /files/xxx -> เติม ERP_BASE
 * - ถ้าหาไม่ได้ -> ใช้ noImg
 */
function normalizeImage(u) {
  if (!u) return noImg;
  let s = String(u).trim();
  if (!s) return noImg;
  if (/^https?:\/\//i.test(s)) return s; // absolute url
  if (s.startsWith("//")) return "https:" + s; // //host/path
  if (s.startsWith("/")) return ERP_BASE + s; // /files/... จาก ERP
  // อย่างอื่นถือว่าเป็น relative -> ชี้ไป ERP
  return ERP_BASE + "/" + s.replace(/^\/+/, "");
}

/** เดารูป: API ใหม่ใช้ vehicle_image เป็นหลัก */
function pickImage(car) {
  const cand =
    car?.vehicle_image || // ← API ใหม่
    car?.image ||
    car?.image_url ||
    car?.thumbnail ||
    car?.photo ||
    (Array.isArray(car?.images) ? car.images[0] : "") ||
    car?.picture ||
    car?.file_url ||
    "";
  const url = normalizeImage(cand);
  return url || noImg;
}

/**
 * CarList
 * props:
 *  - query: payload + filters
 */
export default function CarList({ query }) {
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState([]);
  const [err, setErr] = useState("");

  // body สำหรับ API (ส่งเฉพาะที่ backend คาดหวัง + แนบฟิลเตอร์ ถ้ารองรับ)
  const apiBody = useMemo(() => {
    const b = {
      pickup_at: query?.pickup_at || "",
      return_at: query?.return_at || "",
      passengers: query?.passengers || 1,
      promo: query?.promo || "",
      ftype: query?.ftype || "",
    };
    if (query?.seatBucket) b.seat_bucket = query.seatBucket; // "5-" | "6-7" | "8+"
    if (query?.trans) b.trans = query.trans; // "auto" | "manual"
    if (query?.priceMin) b.min_price = Number(query.priceMin);
    if (query?.priceMax) b.max_price = Number(query.priceMax);
    if (query?.popular?.freeCancel) b.free_cancel = true;
    if (query?.popular?.instantConfirm) b.instant_confirm = true;
    if (query?.popular?.delivery) b.delivery = true;
    return b;
  }, [query]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
          signal: ac.signal,
        });
        const text = await res.text();
        const data = (() => {
          try {
            return JSON.parse(text);
          } catch {
            return { raw: text };
          }
        })();
        if (!res.ok)
          throw new Error(`HTTP ${res.status}: ${text?.slice?.(0, 160) || ""}`);

        const rawCars = Array.isArray(data?.message)
          ? data.message
          : Array.isArray(data)
          ? data
          : [];

        // กรองเฉพาะที่ "ว่าง"
        let list = rawCars.filter(isCarAvailable);

        // 2.1 กรองด้วย search (brand / model / ชื่อรถ / คำอธิบาย)
        if (query?.search && norm(query.search)) {
          const kw = norm(query.search);
          list = list.filter((c) => {
            const brand = norm(c.brand || c.make);
            const model = norm(
              c.model || c.vehicle_model || c.vehicle_name || c.name
            );
            const title = norm(c.vehicle_name || c.name || "");
            const desc = norm(c.description || "");
            return (
              brand.includes(kw) ||
              model.includes(kw) ||
              `${brand} ${model}`.includes(kw) || // รองรับพิมพ์ติดกัน
              title.includes(kw) ||
              desc.includes(kw)
            );
          });
        }

        // กรองฝั่ง client เพิ่มเติม
        if (query?.seatBucket) {
          const s = (c) => takeSeats(c);
          if (query.seatBucket === "5-")
            list = list.filter((c) => s(c) > 0 && s(c) <= 5);
          else if (query.seatBucket === "6-7")
            list = list.filter((c) => s(c) >= 6 && s(c) <= 7);
          else if (query.seatBucket === "8+")
            list = list.filter((c) => s(c) >= 8);
        }
        if (query?.trans) {
          list = list.filter((c) => {
            const t = takeTrans(c); // "automatic", "manual"
            if (!t) return true;
            return query.trans === "auto"
              ? /auto/.test(t)
              : /manual|mt/.test(t);
          });
        }
        if (query?.priceMin)
          list = list.filter((c) => takePrice(c) >= Number(query.priceMin));
        if (query?.priceMax)
          list = list.filter((c) => takePrice(c) <= Number(query.priceMax));

        setCars(list);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErr(String(e));
          setCars([]);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [apiBody]);

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600">
        {loading ? (
          "กำลังโหลดรถว่าง..."
        ) : err ? (
          <span className="text-rose-600">เกิดข้อผิดพลาด: {err}</span>
        ) : (
          `พบรถ ${cars.length} คัน`
        )}
      </div>

      {cars.length === 0 && !loading ? (
        <div className="rounded-xl border border-slate-200 p-6 text-center text-slate-600">
          ไม่พบรถตามเงื่อนไขที่เลือก
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cars.map((car) => {
            // ชื่อรถ: ใช้ vehicle_name ก่อน
            const title = car.vehicle_name || car.model || car.name || "รถเช่า";
            const img = pickImage(car);
            return (
              <li
                key={car.license_plate || car.name || title}
                className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="relative aspect-[16/9] bg-slate-100">
                  <Image
                    src={img || noImg}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>

                <div className="p-4 space-y-2">
                  <div className="font-semibold text-slate-900">{title}</div>
                  <div className="text-sm text-slate-600">
                    ที่นั่ง: {takeSeats(car) || "-"} • เกียร์:{" "}
                    {takeTrans(car) || "-"}
                  </div>
                  <div className="text-[15px] font-semibold">
                    ฿{nthai(takePrice(car))}{" "}
                    <span className="text-sm text-slate-500">/วัน</span>
                  </div>
                  <Link
                    href={`/car/${encodeURIComponent(car.license_plate || car.vehicle_name || car.name || 'unknown')}?${new URLSearchParams({
                      key: car.license_plate || car.vehicle_name || car.name || '',
                      pickup_at: query?.pickup_at || '',
                      return_at: query?.return_at || '',
                      passengers: query?.passengers || 1,
                      promo: query?.promo || '',
                      ftype: query?.ftype || '',
                      pickupLocation: query?.pickupLocation || '',
                      dropoffLocation: query?.dropoffLocation || '',
                      returnSame: query?.returnSame || 'true'
                    }).toString()}`}
                    className="mt-2 inline-flex items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-white hover:bg-amber-600"
                  >
                    จองเลย
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
