// app/cars/CarsPageContent.js
"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const IMG_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "https://demo.erpeazy.com";
const PLACEHOLDER = "/noimage.jpg";

function normalizeImage(u) {
  if (!u) return PLACEHOLDER;
  let s = String(u).trim();
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("/")) s = IMG_BASE.replace(/\/+$/, "") + s;
  if (!/^https?:\/\//i.test(s))
    s = IMG_BASE.replace(/\/+$/, "") + "/" + s.replace(/^\/+/, "");
  return encodeURI(s);
}
const slugify = (v) =>
  String(v ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

// คืน true เฉพาะรถที่ "ว่าง"
const isCarAvailable = (car) => {
  // ธง boolean ที่บาง API ชอบส่งมา
  if (typeof car.available === "boolean") return car.available;
  if (typeof car.is_available === "boolean") return car.is_available;
  if (typeof car.is_free === "boolean") return car.is_free;
  if (typeof car.rented === "boolean") return !car.rented; // ถ้า rented = false → ว่าง
  if (typeof car.is_busy === "boolean") return !car.is_busy;

  // สถานะเป็นข้อความ
  const raw =
    car.status ??
    car.vehicle_status ??
    car.stage ??
    car.state ??
    car.stage_code ??
    car.availability ??
    "";
  const s = String(raw).trim().toLowerCase();

  // รองรับทั้ง EN/TH
  if (["available", "ว่าง"].includes(s)) return true;
  if (
    [
      "in use",
      "borrowed",
      "maintenance",
      "busy",
      "unavailable",
      "ถูกยืมอยู่",
      "ซ่อมแซม",
    ].includes(s)
  )
    return false;

  // ถ้าไม่รู้จริง ๆ ว่าสถานะอะไร → ไม่แสดง (เข้มงวดตามที่ขอ)
  return false;
};

export default function CarsPageContent() {
  const search = useSearchParams();

  const payload = useMemo(() => {
    const pickup_at = search.get("pickup_at") || "";
    const return_at = search.get("return_at") || "";
    const passengers = Number(search.get("passengers") || 1);
    const promo = search.get("promo") || "";
    const ftype = search.get("ftype") || "";
    return { pickup_at, return_at, passengers, promo, ftype };
  }, [search]);

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // helper: ทำให้ type เป็นตัวพิมพ์ใหญ่/ตัดช่องว่าง
  const norm = (s) =>
    String(s ?? "")
      .trim()
      .toUpperCase();
  const selectedFtype = norm(payload.ftype); // เช่น "SEDAN" | "" (ไม่เลือก)

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: ac.signal,
        });
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
        if (!res.ok)
          throw new Error(`HTTP ${res.status} ${text?.slice?.(0, 200) || ""}`);

        const rawCars = Array.isArray(data?.message)
          ? data.message
          : Array.isArray(data)
          ? data
          : [];

        // 1) กรองเฉพาะรถที่ว่าง
        const onlyAvailable = rawCars.filter(isCarAvailable);
        // 2) ถ้ามีเลือกประเภท เพิ่มกรองซ้ำ
        const filtered = !selectedFtype
          ? onlyAvailable
          : onlyAvailable.filter((car) => {
              const carType = norm(car.ftype ?? car.type ?? car.v_type);
              return carType === selectedFtype;
            });
        setCars(filtered);
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
  }, [payload]);

  // (ทางเลือกเสริมปลอดภัย) ถ้าต้องการกรองซ้ำตอน render ก็ทำผ่าน useMemo นี้ได้
  // const carsToShow = useMemo(() => {
  //   if (!selectedFtype) return cars;
  //   return cars.filter((car) => norm(car.ftype ?? car.type ?? car.v_type) === selectedFtype);
  // }, [cars, selectedFtype]);
  // แล้วเปลี่ยนด้านล่างจาก cars เป็น carsToShow

  return (
    <>
      <div className="mb-6 rounded-xl border border-gray-600 bg-gray-900/60 p-4 text-sm">
        <div>รับ: {payload.pickup_at || "-"}</div>
        <div>คืน: {payload.return_at || "-"}</div>
        <div>ผู้โดยสาร: {payload.passengers}</div>
        {payload.ftype && <div>ประเภทรถ: {payload.ftype}</div>}
        {payload.promo && <div>โค้ดส่วนลด: {payload.promo}</div>}
      </div>

      {loading && <div className="text-gray-300">กำลังโหลดข้อมูล...</div>}
      {err && (
        <div className="text-red-400 mb-4 break-all">โหลดล้มเหลว: {err}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
        {cars.length > 0 ? (
          cars.map((car, i) => {
            const rawKey =
              car.name ??
              car.id ??
              car.vehicle_id ??
              car.vehicle_name ??
              String(i);

            const q = new URLSearchParams();
            for (const [k, v] of [
              ["pickup_at", payload.pickup_at],
              ["return_at", payload.return_at],
              ["passengers", payload.passengers],
              ["promo", payload.promo],
              ["ftype", payload.ftype],
            ]) {
              if (v !== undefined && v !== null && String(v).trim() !== "")
                q.set(k, String(v));
            }
            const pickupLoc =
              search.get("pickupLocation") || search.get("pickup_location");
            const dropoffLoc =
              search.get("dropoffLocation") || search.get("dropoff_location");
            const returnSame =
              search.get("returnSame") ?? search.get("return_same");
            if (pickupLoc) q.set("pickupLocation", pickupLoc);
            if (dropoffLoc) q.set("dropoffLocation", dropoffLoc);
            if (returnSame != null) q.set("returnSame", String(returnSame));

            const href = `/car/${slugify(rawKey)}?${q.toString()}`;
            const img = normalizeImage(car.vehicle_image || car.image);

            return (
              <Link key={rawKey} href={href} className="block">
                <div className="bg-white text-black rounded-xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-t-xl">
                    <Image
                      src={img}
                      alt={car.vehicle_name || car.name || "รถ"}
                      fill
                      className="object-cover"
                      sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                    />
                  </div>
                  <div className="p-3 space-y-1.5">
                    <h3 className="text-base font-semibold leading-snug">
                      {car.vehicle_name || car.name || "Vehicle"}
                    </h3>
                    <p className="text-sm leading-tight">
                      {(car.brand || "").toString()} •{" "}
                      {(car.ftype || car.type || "-").toString()}
                    </p>
                    <p className="text-sm font-bold mt-1">
                      {car.price_per_day ?? car.price ?? car.rate_per_day
                        ? `${Number(
                            car.price_per_day ?? car.price ?? car.rate_per_day
                          ).toLocaleString("th-TH")} บาท/วัน`
                        : "-"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        ) : !loading ? (
          <div className="text-gray-300">ไม่พบรถว่าง</div>
        ) : null}
      </div>
    </>
  );
}
