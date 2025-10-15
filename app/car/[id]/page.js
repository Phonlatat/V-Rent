"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Headers from "@/Components/HeaderISO";
import FooterMinimal from "@/Components/FooterMinimal";
import Image from "next/image";
import Link from "next/link";

/* ===== Helpers ===== */
const IMG_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.150.243.195";

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

        console.log("🔍 Fetching vehicle with payload:", payload);

        const res = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: ac.signal,
          cache: "no-store",
        });

        console.log("📡 API response status:", res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ API error:", errorText);
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        console.log("📦 API response data:", data);
        const list = Array.isArray(data?.message)
          ? data.message
          : Array.isArray(data)
          ? data
          : data
          ? [data]
          : [];

        console.log("🚗 Vehicle list:", list);

        const wantSlug = slugify(idSlug);
        const wantRaw = String(rawKey || idSlug);

        console.log(
          "🎯 Looking for vehicle with slug:",
          wantSlug,
          "raw:",
          wantRaw
        );

        // แสดงรายการรถที่มีอยู่เพื่อ debug
        console.log("📋 Available vehicles:");
        list.forEach((car, index) => {
          console.log(
            `${index + 1}. ${car.vehicle_name || car.name || "Unknown"}`,
            {
              id: car.id,
              name: car.name,
              vehicle_id: car.vehicle_id,
              vehicle_name: car.vehicle_name,
              plate_no: car.plate_no,
              license_plate: car.license_plate,
            }
          );
        });

        const match = list.find((x) => {
          const cand = [
            x.id,
            x.name,
            x.vehicle_id,
            x.vehicle_name,
            x.plate_no,
            x.license_plate,
            x.plate_number,
          ]
            .filter(Boolean)
            .map(String);

          console.log(`🔍 Checking vehicle: ${x.vehicle_name || x.name}`, {
            candidates: cand,
            wantRaw: wantRaw,
            wantSlug: wantSlug,
          });

          // ค้นหาแบบ exact match
          if (cand.some((v) => v === wantRaw)) {
            console.log("✅ Found exact match!");
            return true;
          }

          // ค้นหาแบบ slug match
          if (cand.some((v) => slugify(v) === wantSlug)) {
            console.log("✅ Found slug match!");
            return true;
          }

          // ค้นหาแบบ partial match (เผื่อมี space หรือ special character)
          if (
            cand.some(
              (v) => v.replace(/\s+/g, "") === wantRaw.replace(/\s+/g, "")
            )
          ) {
            console.log("✅ Found partial match!");
            return true;
          }

          return false;
        });

        console.log("🎉 Found match:", match);

        if (!match) {
          console.log("❌ No match found");
          setVehicle(null);
          setErr("NOT_FOUND");
        } else {
          console.log("✅ Vehicle found:", match);
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white overflow-hidden">
      <title>CarsInfoPage - V-Rent</title>
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
      `}</style>
      <Headers />

      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div
          className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 blur-3xl transition-all duration-1000"
          style={{
            left: "10%",
            top: "20%",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-400/20 blur-3xl transition-all duration-1000"
          style={{
            right: "10%",
            bottom: "20%",
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <main className="flex-grow relative z-10">
        <section className="relative">
          {/* เนื้อหาจริง */}
          <div className="relative p-3 sm:p-6 lg:p-8 xl:p-10">
            <div className="max-w-6xl mx-auto">
              {/* Header Section */}
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
                  <span className="text-white">รายละเอียด</span>
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    รถเช่า
                  </span>
                </h1>
                <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 mx-auto rounded-full"></div>
              </div>

              {/* Main Content Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:bg-white/15 group">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Image Section */}
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => setOpen(true)}
                      className="relative w-full h-48 sm:h-64 md:h-80 lg:h-full min-h-[300px] sm:min-h-[400px] cursor-zoom-in overflow-hidden"
                      aria-label="ดูรูปแบบเต็มจอ"
                      disabled={loading}
                    >
                      <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        className="object-cover transition-all duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

                      {/* Zoom Icon */}
                      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hover:scale-110 border border-white/30">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </div>

                      {/* Loading State */}
                      {loading && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-yellow-400"></div>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Info Section */}
                  <div className="p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-between">
                    <div>
                      {/* Car Title */}
                      <div className="mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white group-hover:text-yellow-400 transition-colors duration-300 mb-2">
                          {name}
                        </h2>
                        {(brand || type) && (
                          <p className="text-sm sm:text-base lg:text-lg text-slate-300 group-hover:text-white transition-colors duration-300">
                            {brand}
                            {brand && type ? " • " : ""}
                            {type}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="mb-4 sm:mb-6">
                        <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                          <span className="text-xl sm:text-2xl md:text-3xl font-bold">
                            ฿{fmtBaht(pricePerDay)}
                          </span>
                          <span className="text-xs sm:text-sm ml-2 opacity-90">
                            /วัน
                          </span>
                        </div>
                      </div>

                      {/* Features */}
                      {(transmission || fuel) && (
                        <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-3">
                          {transmission && (
                            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-white/20 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105">
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-yellow-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                              <span className="text-xs sm:text-sm font-medium">
                                {transmission}
                              </span>
                            </div>
                          )}
                          {fuel && (
                            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-white/20 hover:border-amber-400/50 transition-all duration-300 hover:scale-105">
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-amber-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                              <span className="text-xs sm:text-sm font-medium">
                                {fuel}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Booking Details */}
                      <div className="mb-4 sm:mb-6 bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg mr-2 sm:mr-3 flex items-center justify-center">
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 text-black"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                            </svg>
                          </div>
                          รายละเอียดการจอง
                        </h3>
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center text-slate-300">
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-yellow-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            <span className="text-sm sm:text-base font-medium">
                              {rangeText}
                            </span>
                          </div>

                          {(pickupLocation || dropoffLocation) && (
                            <div className="space-y-2">
                              {pickupLocation && (
                                <div className="flex items-center text-slate-400">
                                  <svg
                                    className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-green-400"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                  </svg>
                                  <span className="text-xs sm:text-sm">
                                    รับรถ:{" "}
                                    <span className="font-medium text-white">
                                      {pickupLocation}
                                    </span>
                                  </span>
                                </div>
                              )}
                              {dropoffLocation && (
                                <div className="flex items-center text-slate-400">
                                  <svg
                                    className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-red-400"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                  </svg>
                                  <span className="text-xs sm:text-sm">
                                    คืนรถ:{" "}
                                    <span className="font-medium text-white">
                                      {dropoffLocation}
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {passengers && (
                            <div className="flex items-center text-slate-400">
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-blue-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.5 8h-1c-.8 0-1.5.63-1.5 1.5L15.5 16H18v6h2zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9l-1.5-4.5A1.5 1.5 0 0 0 6 9H5c-.8 0-1.5.63-1.5 1.5L4.5 15H7v7h.5z" />
                              </svg>
                              <span className="text-xs sm:text-sm">
                                ผู้โดยสาร:{" "}
                                <span className="font-medium text-white">
                                  {passengers} คน
                                </span>
                              </span>
                              {ftype && (
                                <span className="ml-2 text-slate-500">
                                  • ประเภท: {ftype}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Car Details */}
                      <div className="mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg mr-2 sm:mr-3 flex items-center justify-center">
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 text-black"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                            </svg>
                          </div>
                          รายละเอียดรถ
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          {vehicle?.year && (
                            <div className="flex items-center text-slate-300 p-2 sm:p-3 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-yellow-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                              <span className="text-xs sm:text-sm">
                                ปี:{" "}
                                <span className="font-medium text-white">
                                  {vehicle.year}
                                </span>
                              </span>
                            </div>
                          )}
                          {vehicle?.seats && (
                            <div className="flex items-center text-slate-300 p-2 sm:p-3 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-amber-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.5 8h-1c-.8 0-1.5.63-1.5 1.5L15.5 16H18v6h2zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9l-1.5-4.5A1.5 1.5 0 0 0 6 9H5c-.8 0-1.5.63-1.5 1.5L4.5 15H7v7h.5z" />
                              </svg>
                              <span className="text-xs sm:text-sm">
                                ที่นั่ง:{" "}
                                <span className="font-medium text-white">
                                  {vehicle.seats} ที่
                                </span>
                              </span>
                            </div>
                          )}
                          {vehicle?.plate_no && (
                            <div className="flex items-center text-slate-300 p-2 sm:p-3 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10 sm:col-span-2">
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-yellow-500"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                              <span className="text-xs sm:text-sm">
                                ทะเบียน:{" "}
                                <span className="font-medium text-white">
                                  {vehicle.plate_no}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {vehicle?.description && (
                        <div className="mb-4 sm:mb-6">
                          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg mr-2 sm:mr-3 flex items-center justify-center">
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4 text-black"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            </div>
                            คำอธิบาย
                          </h3>
                          <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10">
                            <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                              {vehicle.description}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Error Messages */}
                      {err && err !== "NOT_FOUND" && (
                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl sm:rounded-2xl">
                          <div className="flex items-center">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500/20 rounded-full mr-2 sm:mr-3 flex items-center justify-center">
                              <svg
                                className="w-3 h-3 sm:w-5 sm:h-5 text-red-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            </div>
                            <span className="text-red-300 font-medium text-sm sm:text-base">
                              โหลดข้อมูลไม่สำเร็จ: {err}
                            </span>
                          </div>
                        </div>
                      )}
                      {err === "NOT_FOUND" && (
                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-xl sm:rounded-2xl">
                          <div className="flex items-center">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500/20 rounded-full mr-2 sm:mr-3 flex items-center justify-center">
                              <svg
                                className="w-3 h-3 sm:w-5 sm:h-5 text-yellow-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            </div>
                            <span className="text-yellow-300 font-medium text-sm sm:text-base">
                              ไม่พบรถคันนี้จากข้อมูลที่ส่งมา
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Book Button */}
                    <div className="mt-4 sm:mt-6">
                      <Link
                        href={bookHref}
                        className="w-full inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-lg hover:shadow-yellow-400/30 transition-all duration-300 transform hover:scale-105"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                        </svg>
                        จองรถคันนี้
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterMinimal />

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center cursor-zoom-out"
          onClick={() => setOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <button
            className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white/80 hover:text-white text-xl sm:text-2xl bg-white/20 backdrop-blur-sm rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center transition-all duration-300 hover:bg-white/30 hover:scale-110 border border-white/30"
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            ×
          </button>

          <div className="relative w-[95vw] sm:w-[90vw] h-[70vh] sm:h-[80vh] max-w-6xl">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain select-none rounded-xl sm:rounded-2xl shadow-2xl"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
