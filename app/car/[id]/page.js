"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Headers from "@/Components/HeaderISO";
import Footer from "@/Components/Footer";
import Image from "next/image";
import Link from "next/link";

/* ===== Helpers ===== */
const IMG_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "https://demo.erpeazy.com";

const slugify = (v) =>
  String(v ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

function normalizeImage(u) {
  if (!u) return "/noimage.jpg";
  let s = String(u).trim();
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("/")) s = IMG_BASE.replace(/\/+$/, "") + s;
  if (!/^https?:\/\//i.test(s))
    s = IMG_BASE.replace(/\/+$/, "") + "/" + s.replace(/^\/+/, "");
  return encodeURI(s);
}

const fmtBaht = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toLocaleString() : "-";
};

function fmtRange(pickupISO, returnISO) {
  if (!pickupISO || !returnISO) return "—";
  try {
    const p = new Date(pickupISO);
    const r = new Date(returnISO);
    const d = { year: "numeric", month: "short", day: "numeric" };
    const t = { hour: "2-digit", minute: "2-digit" };
    return `${p.toLocaleDateString(undefined, d)} ${p.toLocaleTimeString(
      undefined,
      t
    )} → ${r.toLocaleDateString(undefined, d)} ${r.toLocaleTimeString(
      undefined,
      t
    )}`;
  } catch {
    return "—";
  }
}

/* ===== Page ===== */
export default function CarInfo() {
  const [open, setOpen] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const params = useParams();
  const idSlug = useMemo(
    () => (Array.isArray(params?.id) ? params.id[0] : params?.id),
    [params]
  );

  const search = useSearchParams();
  const rawKey = search.get("key") || "";

  // เวลา/เงื่อนไข
  const pickup_at = search.get("pickup_at") || "";
  const return_at = search.get("return_at") || "";
  const passengers = Number(search.get("passengers") || 1);
  const promo = search.get("promo") || "";
  const ftype = search.get("ftype") || "";

  // สถานที่รับ-คืน (รองรับทั้ง camelCase และ snake_case)
  const returnSameParam = search.get("returnSame") ?? search.get("return_same");
  const returnSame =
    (returnSameParam ?? "true").toString().toLowerCase() === "true";

  const pickupLocation =
    search.get("pickupLocation") || search.get("pickup_location") || "";

  let dropoffLocation =
    search.get("dropoffLocation") || search.get("dropoff_location") || "";

  if (!dropoffLocation && returnSame) {
    dropoffLocation = pickupLocation;
  }

  // โหลดข้อมูลคันนี้
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");

      try {
        const payload = {
          ...(rawKey ? { name: rawKey, vehicle_id: rawKey, id: rawKey } : {}),
          ...(pickup_at ? { pickup_at } : {}),
          ...(return_at ? { return_at } : {}),
          ...(passengers ? { passengers } : {}),
          ...(promo ? { promo } : {}),
          ...(ftype ? { ftype } : {}),
        };

        const res = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: ac.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const list = Array.isArray(data?.message)
          ? data.message
          : Array.isArray(data)
          ? data
          : data
          ? [data]
          : [];

        const wantSlug = slugify(idSlug);
        const wantRaw = String(rawKey || idSlug);

        const match = list.find((x) => {
          const cand = [x.id, x.name, x.vehicle_id, x.vehicle_name, x.plate_no]
            .filter(Boolean)
            .map(String);
          if (cand.some((v) => v === wantRaw)) return true;
          if (cand.some((v) => slugify(v) === wantSlug)) return true;
          return false;
        });

        if (!match) {
          setVehicle(null);
          setErr("NOT_FOUND");
        } else {
          setVehicle(match);
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          setVehicle(null);
          setErr(String(e));
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [idSlug, rawKey, pickup_at, return_at, passengers, promo, ftype]);

  /* ===== Derived fields ===== */
  const rangeText = useMemo(
    () => fmtRange(pickup_at, return_at),
    [pickup_at, return_at]
  );

  const name = vehicle?.vehicle_name || vehicle?.name || "รถเช่า";
  const brand = vehicle?.brand || "";
  const type = vehicle?.ftype || vehicle?.type || "";
  const pricePerDay =
    vehicle?.price_per_day ?? vehicle?.price ?? vehicle?.rate_per_day;
  const companyName =
    vehicle?.company || vehicle?.company_name || "V-Rent Partner";
  const companySlug = slugify(companyName || "partner");
  const imageUrl = normalizeImage(
    vehicle?.vehicle_image || vehicle?.image || vehicle?.cover
  );

  // ✅ normalize เกียร์/เชื้อเพลิงจากหลายคีย์
  const transmission =
    vehicle?.transmission ?? vehicle?.gear_system ?? vehicle?.gear ?? ""; // "อัตโนมัติ" | "ธรรมดา" | อื่น ๆ

  const fuel = vehicle?.fuel ?? vehicle?.fuel_type ?? vehicle?.fueltype ?? ""; // "เบนซิน" | "ดีเซล" | "EV" | อื่น ๆ

  /* เตรียม query ส่งต่อไปหน้า booking (รวมสถานที่รับ-คืน) */
  const forward = new URLSearchParams(search.toString());
  forward.set("key", rawKey || idSlug);
  forward.set("carName", name);
  forward.set("carBrand", brand);
  forward.set("carType", type);
  if (vehicle?.year) forward.set("carYear", String(vehicle.year));
  if (transmission) forward.set("carTransmission", String(transmission)); // ✅
  if (vehicle?.seats) forward.set("carSeats", String(vehicle.seats));
  if (fuel) forward.set("carFuel", String(fuel)); // ✅
  if (pricePerDay != null) forward.set("pricePerDay", String(pricePerDay));
  forward.set("companyName", companyName);
  forward.set("companySlug", companySlug);
  forward.set("carImage", imageUrl);

  // สถานที่
  if (pickupLocation) forward.set("pickupLocation", pickupLocation);
  if (dropoffLocation) forward.set("dropoffLocation", dropoffLocation);
  forward.set("returnSame", String(returnSame));

  const bookHref = `/booking/${encodeURIComponent(
    rawKey || idSlug
  )}?${forward.toString()}`;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <title>CarsInfoPage - V-Rent</title>
      <Headers />

      <main className="flex-grow bg-gray-100 grid content-center">
        <div className="w-full bg-white rounded-none shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* รูปซ้าย */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative w-full h-[42vh] md:h-[70vh] cursor-zoom-in group"
            aria-label="ดูรูปแบบเต็มจอ"
            disabled={loading}
          >
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />

            <span className="absolute right-3 bottom-3 rounded-md bg-black/60 text-white px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition">
              ดูแบบเต็มจอ
            </span>
          </button>

          {/* ข้อมูลขวา */}
          <div className="flex h-full flex-col justify-between p-6 md:p-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black">
                {name}
              </h1>

              {(brand || type) && (
                <p className="text-gray-700">
                  {brand}
                  {brand && type ? " • " : ""}
                  {type}
                </p>
              )}

              {/* ✅ แสดงเกียร์/เชื้อเพลิงเป็น badge */}
              {(transmission || fuel) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {transmission && (
                    <span className="inline-flex items-center rounded-full bg-gray-200 text-gray-800 text-xs px-2.5 py-1">
                      ⚙️ เกียร์:
                      <span className="ml-1 font-medium">{transmission}</span>
                    </span>
                  )}
                  {fuel && (
                    <span className="inline-flex items-center rounded-full bg-gray-200 text-gray-800 text-xs px-2.5 py-1">
                      ⛽ เชื้อเพลิง:
                      <span className="ml-1 font-medium">{fuel}</span>
                    </span>
                  )}
                </div>
              )}

              <p className="text-2xl font-semibold text-black mt-4 mb-6">
                {fmtBaht(pricePerDay)} บาท/วัน
              </p>

              <div className="mb-6 rounded-xl border border-gray-200 p-4 bg-gray-50">
                <div className="text-sm text-gray-600">ช่วงเวลาที่เลือก</div>
                <div className="font-semibold text-black">{rangeText}</div>

                {/* โชว์สถานที่รับ/คืน */}
                {(pickupLocation || dropoffLocation) && (
                  <div className="mt-2 text-xs text-gray-700 space-y-1">
                    {pickupLocation && (
                      <div>
                        จุดรับรถ:{" "}
                        <span className="font-medium">{pickupLocation}</span>
                      </div>
                    )}
                    {dropoffLocation && (
                      <div>
                        จุดคืนรถ:{" "}
                        <span className="font-medium">{dropoffLocation}</span>
                      </div>
                    )}
                  </div>
                )}

                {passengers ? (
                  <div className="text-xs text-gray-600 mt-2">
                    ผู้โดยสาร: {passengers}
                    {ftype ? ` • ประเภท: ${ftype}` : ""}
                  </div>
                ) : null}
              </div>

              <ul className="space-y-2 text-gray-800 mb-6">
                {vehicle?.year && <li>ปี: {vehicle.year}</li>}
                {vehicle?.seats && <li>จำนวนที่นั่ง: {vehicle.seats}</li>}
                {vehicle?.plate_no && <li>ทะเบียน: {vehicle.plate_no}</li>}
              </ul>

              {vehicle?.description && (
                <p className="text-gray-700 whitespace-pre-line">
                  {vehicle.description}
                </p>
              )}

              {err && err !== "NOT_FOUND" && (
                <p className="text-xs text-red-500 mt-2">
                  โหลดข้อมูลไม่สำเร็จ: {err}
                </p>
              )}
              {err === "NOT_FOUND" && (
                <p className="text-xs text-red-500 mt-2">
                  ไม่พบรถคันนี้จากข้อมูลที่ส่งมา
                </p>
              )}
            </div>

            <div className="mt-8">
              <Link
                href={bookHref}
                className="inline-block w-full md:w-auto px-6 py-3 rounded-lg transition text-center bg-black text-white hover:bg-gray-800"
              >
                จองรถคันนี้
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-zoom-out"
          onClick={() => setOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl"
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            ×
          </button>

          <div className="relative w-[92vw] h-[82vh]">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain select-none"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
