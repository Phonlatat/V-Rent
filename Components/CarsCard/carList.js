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
  process.env.NEXT_PUBLIC_ERP_BASE || "http://203.154.83.160"
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
  }, [
    apiBody,
    query?.priceMax,
    query?.priceMin,
    query?.search,
    query?.seatBucket,
    query?.trans,
  ]);

  return (
    <div className="space-y-4">
      {/* Enhanced Status Display */}
      <div className="text-sm text-slate-300 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <span>กำลังโหลดรถว่าง...</span>
          </div>
        ) : err ? (
          <span className="text-red-400 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            เกิดข้อผิดพลาด: {err}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-yellow-400"
              fill="currentColor"
            >
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
            <span>
              พบรถ{" "}
              <span className="text-yellow-400 font-semibold">
                {cars.length}
              </span>{" "}
              คัน
            </span>
          </div>
        )}
      </div>

      {cars.length === 0 && !loading ? (
        <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-8 text-center text-slate-300 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <svg
              viewBox="0 0 24 24"
              className="w-12 h-12 text-slate-400"
              fill="currentColor"
            >
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
            <div>
              <div className="text-lg font-semibold text-white mb-1">
                ไม่พบรถตามเงื่อนไขที่เลือก
              </div>
              <div className="text-sm">ลองปรับเงื่อนไขการค้นหาใหม่</div>
            </div>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cars.map((car) => {
            // ชื่อรถ: ใช้ vehicle_name ก่อน
            const title = car.vehicle_name || car.model || car.name || "รถเช่า";
            const img = pickImage(car);
            return (
              <li
                key={car.license_plate || car.name || title}
                className="group rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl hover:shadow-3xl hover:bg-white/15 hover:border-yellow-400/30 transition-all duration-300 overflow-hidden transform hover:scale-105"
              >
                {/* Enhanced Image Container */}
                <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                  <Image
                    src={img || noImg}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Availability Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/90 text-white backdrop-blur-sm">
                      <div className="w-2 h-2 bg-green-300 rounded-full mr-1"></div>
                      ว่าง
                    </span>
                  </div>
                </div>

                {/* Enhanced Content */}
                <div className="p-5 space-y-3">
                  {/* Title */}
                  <div className="font-bold text-white text-lg group-hover:text-yellow-400 transition-colors duration-300">
                    {title}
                  </div>

                  {/* Car Details */}
                  <div className="flex items-center gap-4 text-sm text-slate-300">
                    <div className="flex items-center gap-1">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      <span>{takeSeats(car) || "-"} ที่นั่ง</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      <span>{takeTrans(car) || "-"}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-yellow-400">
                      ฿{nthai(takePrice(car))}
                    </span>
                    <span className="text-sm text-slate-400">/วัน</span>
                  </div>

                  {/* Enhanced Book Button */}
                  <Link
                    href={`/car/${encodeURIComponent(
                      car.license_plate ||
                        car.vehicle_name ||
                        car.name ||
                        "unknown"
                    )}?${new URLSearchParams({
                      key:
                        car.license_plate || car.vehicle_name || car.name || "",
                      pickup_at: query?.pickup_at || "",
                      return_at: query?.return_at || "",
                      passengers: query?.passengers || 1,
                      promo: query?.promo || "",
                      ftype: query?.ftype || "",
                      pickupLocation: query?.pickupLocation || "",
                      dropoffLocation: query?.dropoffLocation || "",
                      returnSame: query?.returnSame || "true",
                    }).toString()}`}
                    className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-3 text-black font-semibold hover:from-amber-500 hover:to-yellow-400 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                      fill="currentColor"
                    >
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                    </svg>
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
