// app/booking/[id]/page.js  (หรือไฟล์ BookingPage ของคุณ)
"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Headers from "@/Components/HeaderISO";
import Footer from "@/Components/FooterMinimal";
import Image from "next/image";
import Link from "next/link";
import { getCarById } from "@/data/cars";

/* ---------- Helpers ---------- */
function toLocalDateTimeInputValue(d = new Date()) {
  const pad = (n) => String(n).toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
function isoToLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : toLocalDateTimeInputValue(d);
}
function diffDays(a, b) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return Math.max(days, 1);
}
const toBool = (v) => String(v ?? "").toLowerCase() === "true";
const get = (sp, key, fallback = "") => sp.get(key) ?? fallback;

/* ---------- Const ---------- */
const NOTE_MAX = 140;

/* ---------- Page ---------- */
export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  // ---------- รถจาก query/fallback ----------
  const carFromQuery = {
    id,
    name: get(search, "carName"),
    brand: get(search, "carBrand"),
    type: get(search, "carType"),
    year: get(search, "carYear"),
    transmission: get(search, "carTransmission"),
    seats: get(search, "carSeats"),
    fuel: get(search, "carFuel"),
    pricePerDay: Number(get(search, "pricePerDay") || 0),
    company: {
      name: get(search, "companyName"),
      slug: get(search, "companySlug"),
    },
    image: get(search, "carImage"),
  };

  const carFallback = useMemo(() => getCarById(String(id)), [id]);

  const car = useMemo(() => {
    const c = carFromQuery;
    const hasQueryCar =
      c.name ||
      c.brand ||
      c.type ||
      c.pricePerDay ||
      c.image ||
      c.company?.name;
    if (hasQueryCar) {
      return {
        id,
        name: c.name || carFallback?.name || "Vehicle",
        brand: c.brand || carFallback?.brand || "",
        type: c.type || carFallback?.type || "",
        year: c.year || carFallback?.year || "",
        transmission: c.transmission || carFallback?.transmission || "",
        seats: c.seats || carFallback?.seats || "",
        fuel: c.fuel || carFallback?.fuel || "",
        pricePerDay: Number(c.pricePerDay || carFallback?.pricePerDay || 0),
        company: {
          name:
            c.company?.name || carFallback?.company?.name || "V-Rent Partner",
          slug:
            c.company?.slug ||
            carFallback?.company?.slug ||
            (c.company?.name || "partner").toLowerCase().replace(/\s+/g, "-"),
        },
        image: c.image || carFallback?.image || "/noimage.jpg",
        description: carFallback?.description || "",
      };
    }
    return (
      carFallback || {
        id,
        name: "Vehicle",
        brand: "",
        type: "",
        year: "",
        transmission: "",
        seats: "",
        fuel: "",
        pricePerDay: 0,
        company: { name: "V-Rent Partner", slug: "partner" },
        image: "/noimage.jpg",
        description: "",
      }
    );
  }, [carFromQuery, carFallback, id]);

  // ---------- เงื่อนไขจาก search ----------
  const pickup_at_iso = get(search, "pickup_at");
  const return_at_iso = get(search, "return_at");
  const pickupAt_q = get(search, "pickupAt");
  const dropoffAt_q = get(search, "dropoffAt");
  const key = get(search, "key");

  const passengers = Number(get(search, "passengers") || 1);
  const promo = get(search, "promo");
  const ftype = get(search, "ftype");
  const pickupLocation_q = get(search, "pickupLocation");
  const dropoffLocation_q = get(search, "dropoffLocation");

  const now = useMemo(() => new Date(), []);
  const defaultPick = useMemo(
    () => new Date(now.getTime() + 2 * 60 * 60 * 1000),
    [now]
  );
  const defaultDrop = useMemo(
    () => new Date(defaultPick.getTime() + 24 * 60 * 60 * 1000),
    [defaultPick]
  );

  // ---------- form ----------
  const [showNoteLimit, setShowNoteLimit] = useState(false);

  const [form, setForm] = useState({
    pickupLocation: pickupLocation_q || "",
    dropoffLocation: dropoffLocation_q || "",
    pickupAt:
      isoToLocalInput(pickup_at_iso) ||
      pickupAt_q ||
      toLocalDateTimeInputValue(defaultPick),
    dropoffAt:
      isoToLocalInput(return_at_iso) ||
      dropoffAt_q ||
      toLocalDateTimeInputValue(defaultDrop),
    name: get(search, "name") || "",
    phone: get(search, "phone") || "",
    email: get(search, "email") || "",
    extras: {
      childSeat: toBool(get(search, "childSeat")),
      gps: toBool(get(search, "gps")),
      fullInsurance: toBool(get(search, "fullInsurance")),
    },
    // ตัดให้ไม่เกินตั้งแต่รับค่าจาก URL
    note: (get(search, "note") || "").slice(0, NOTE_MAX),
  });

  const [isAdmin] = useState(false);

  /* === Autofill จาก user_id === */
  useEffect(() => {
    const uidFromQuery = get(search, "user_id");
    let uid = uidFromQuery;
    if (!uid) {
      try {
        uid =
          localStorage.getItem("vrent_user_id") ||
          localStorage.getItem("vrent_login_email") ||
          "";
      } catch {
        uid = "";
      }
    }
    uid = (uid || "").trim();
    if (!uid) return;

    setForm((prev) => ({ ...prev, email: prev.email || uid }));

    (async () => {
      try {
        const r = await fetch(
          `http://203.150.243.195/api/method/frappe.api.api.get_user_information`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ user_id: uid }),
          }
        );
        if (!r.ok) return;
        const j = await r.json();
        const userInfo = j?.message || {};

        setForm((prev) => ({
          ...prev,
          name: userInfo.full_name || userInfo.name || prev.name,
          phone: userInfo.phone || userInfo.mobile_no || prev.phone,
          email: userInfo.email || userInfo.user_id || prev.email,
        }));
      } catch {}
    })();
  }, [search]);

  // ---------- คำนวณราคา ----------
  const dayCount = useMemo(
    () => diffDays(form.pickupAt, form.dropoffAt),
    [form.pickupAt, form.dropoffAt]
  );
  const extrasPrice = useMemo(() => {
    let sum = 0;
    if (form.extras.childSeat) sum += 120;
    if (form.extras.gps) sum += 80;
    if (form.extras.fullInsurance) sum += 300;
    return sum * dayCount;
  }, [form.extras, dayCount]);
  const basePrice = (car?.pricePerDay || 0) * dayCount;
  const total = basePrice + extrasPrice;

  // บังคับ dropoffAt > pickupAt
  useEffect(() => {
    if (new Date(form.dropoffAt) <= new Date(form.pickupAt)) {
      const next = new Date(
        new Date(form.pickupAt).getTime() + 24 * 60 * 60 * 1000
      );
      setForm((f) => ({ ...f, dropoffAt: toLocalDateTimeInputValue(next) }));
    }
  }, [form.pickupAt, form.dropoffAt]);

  // เปลี่ยนค่าแบบคุมความยาวหมายเหตุ
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "note") {
      if (value.length > NOTE_MAX) {
        setShowNoteLimit(true);
      }
      const clipped = value.slice(0, NOTE_MAX);
      setForm((f) => ({ ...f, note: clipped }));
      return;
    }

    if (name.startsWith("extras.")) {
      const k = name.split(".")[1];
      setForm((f) => ({ ...f, extras: { ...f.extras, [k]: checked } }));
    } else {
      setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const minDateTime = useMemo(() => toLocalDateTimeInputValue(new Date()), []);
  const labelCls = "text-sm font-semibold text-white";
  const inputCls =
    "w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:bg-white/20";
  const cardCls =
    "bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20";
  const passthroughQS = search.toString();

  const pickupDisplay = isoToLocalInput(pickup_at_iso) || form.pickupAt;
  const returnDisplay = isoToLocalInput(return_at_iso) || form.dropoffAt;

  // ---------- ไปหน้า Choose Payment ----------
  const goToPayment = () => {
    const qp = new URLSearchParams({
      pickupAt: form.pickupAt,
      dropoffAt: form.dropoffAt,
      pickupLocation: form.pickupLocation,
      dropoffLocation: form.dropoffLocation,
      name: form.name || "",
      phone: form.phone || "",
      email: form.email || "",
      childSeat: String(form.extras.childSeat),
      gps: String(form.extras.gps),
      fullInsurance: String(form.extras.fullInsurance),
      // ส่งค่าที่ถูก clip แล้วแน่นอน
      note: (form.note || "").slice(0, NOTE_MAX),

      carId: String(car.id || ""),
      carName: car.name || "",
      carBrand: car.brand || "",
      carType: car.type || "",
      carYear: String(car.year || ""),
      carTransmission: car.transmission || "",
      carSeats: String(car.seats || ""),
      carFuel: car.fuel || "",
      pricePerDay: String(car.pricePerDay || 0),
      companyName: car.company?.name || "",
      companySlug: car.company?.slug || "",
      carImage: car.image || "",

      pickup_at: new Date(form.pickupAt).toISOString(),
      return_at: new Date(form.dropoffAt).toISOString(),

      passengers: String(passengers || ""),
      promo: promo || "",
      ftype: ftype || "",
      key: key || "",
      isAdmin: String(isAdmin),
    }).toString();

    router.push(`/payment/choose?${qp}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white overflow-hidden">
      <title>BookingPage - V-Rent</title>
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
          <div className="relative px-2 py-3 sm:px-3 sm:py-4 md:px-4 md:py-6 lg:px-6 lg:py-8 xl:px-8 xl:py-10">
            <div className="w-full">
              {/* Header Section */}
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
                  <span className="text-white">จอง</span>
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    รถเช่า
                  </span>
                </h1>
                <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 mx-auto rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-2 sm:gap-3 md:gap-4 lg:gap-6 w-full">
                {/* Summary */}
                <div className="lg:col-span-2 -mt-2">
                  <div className="rounded-xl sm:rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-3 sm:p-4 md:p-6 text-xs sm:text-sm flex flex-wrap gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-2 sm:gap-y-3 shadow-lg">
                    <div className="flex items-center text-slate-300">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      <span>
                        รับ: <b className="text-white">{pickupDisplay}</b>
                      </span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      <span>
                        คืน: <b className="text-white">{returnDisplay}</b>
                      </span>
                    </div>
                    {passengers ? (
                      <div className="flex items-center text-slate-300">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-amber-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.5 8h-1c-.8 0-1.5.63-1.5 1.5L15.5 16H18v6h2zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9l-1.5-4.5A1.5 1.5 0 0 0 6 9H5c-.8 0-1.5.63-1.5 1.5L4.5 15H7v7h.5z" />
                        </svg>
                        <span>
                          ผู้โดยสาร: <b className="text-white">{passengers}</b>
                        </span>
                      </div>
                    ) : null}
                    {ftype ? (
                      <div className="flex items-center text-slate-300">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-yellow-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <span>
                          ประเภทรถ: <b className="text-white">{ftype}</b>
                        </span>
                      </div>
                    ) : null}
                    {promo ? (
                      <div className="flex items-center text-slate-300">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <span>
                          โค้ดส่วนลด: <b className="text-white">{promo}</b>
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* ซ้าย: ฟอร์ม */}
                <section
                  className={`${cardCls} p-4 sm:p-6 md:p-8 min-w-0 overflow-hidden transition-all duration-300 hover:shadow-xl group hover:bg-white/15`}
                >
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className="relative w-24 h-18 sm:w-32 sm:h-24 rounded-xl overflow-hidden border border-white/20 shadow-lg transition-transform duration-300 hover:scale-105">
                      <Image
                        src={car.image || "/noimage.jpg"}
                        alt={car.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight group-hover:text-yellow-400 transition-colors duration-300">
                        {car.name}
                      </h1>
                      <p className="text-xs sm:text-sm md:text-base text-slate-300 mt-1 group-hover:text-white transition-colors duration-300">
                        {car.brand} {car.brand && car.type ? "•" : ""}{" "}
                        {car.type}
                        {car.year ? ` • ${car.year}` : ""}{" "}
                        {car.transmission ? ` • ${car.transmission}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6 md:mt-8 grid gap-4 sm:gap-6">
                    {/* สถานที่ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
                      <div className="space-y-2 min-w-0">
                        <label className={labelCls}>สถานที่รับรถ</label>
                        <input
                          name="pickupLocation"
                          value={form.pickupLocation}
                          onChange={handleChange}
                          placeholder="เช่น สนามบินเชียงใหม่ (CNX)"
                          className={`${inputCls} min-w-0 max-w-full`}
                          required
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <label className={labelCls}>สถานที่คืนรถ</label>
                        <input
                          name="dropoffLocation"
                          value={form.dropoffLocation}
                          onChange={handleChange}
                          placeholder="เช่น ตัวเมืองเชียงใหม่"
                          className={`${inputCls} min-w-0 max-w-full`}
                          required
                        />
                      </div>
                    </div>

                    {/* เวลา */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
                      <div className="space-y-2 min-w-0">
                        <label className={labelCls}>วัน–เวลารับรถ</label>
                        <input
                          type="datetime-local"
                          name="pickupAt"
                          value={form.pickupAt}
                          onChange={handleChange}
                          min={minDateTime}
                          className={`${inputCls} min-w-0 max-w-full appearance-none`}
                          required
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <label className={labelCls}>วัน–เวลาคืนรถ</label>
                        <input
                          type="datetime-local"
                          name="dropoffAt"
                          value={form.dropoffAt}
                          onChange={handleChange}
                          min={form.pickupAt || minDateTime}
                          className={`${inputCls} min-w-0 max-w-full appearance-none`}
                          required
                        />
                      </div>
                    </div>

                    {/* ผู้ติดต่อ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="space-y-2 min-w-0">
                        <label className={labelCls}>ชื่อ–นามสกุล</label>
                        <input
                          name="name"
                          value={form.name || ""}
                          onChange={handleChange}
                          className={`${inputCls} min-w-0 max-w-full`}
                          placeholder="ชื่อผู้จอง"
                          required
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <label className={labelCls}>เบอร์โทร</label>
                        <input
                          name="phone"
                          value={form.phone || ""}
                          onChange={handleChange}
                          className={`${inputCls} min-w-0 max-w-full`}
                          placeholder="091-234-5678"
                          required
                        />
                      </div>
                      <div className="space-y-2 min-w-0 sm:col-span-2 lg:col-span-1">
                        <label className={labelCls}>อีเมล</label>
                        <input
                          type="email"
                          name="email"
                          value={form.email || ""}
                          onChange={handleChange}
                          className={`${inputCls} min-w-0 max-w-full`}
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>

                    {/* หมายเหตุ */}
                    <div className="space-y-2 min-w-0">
                      <label className={labelCls}>หมายเหตุเพิ่มเติม</label>
                      <textarea
                        name="note"
                        value={form.note || ""}
                        onChange={handleChange}
                        onPaste={(e) => {
                          const text = e.clipboardData.getData("text");
                          const next = ((form.note || "") + text).slice(
                            0,
                            NOTE_MAX
                          );
                          if (
                            (form.note || "").length + text.length >
                            NOTE_MAX
                          ) {
                            e.preventDefault();
                            setShowNoteLimit(true);
                            setForm((f) => ({ ...f, note: next }));
                          }
                        }}
                        rows={4}
                        maxLength={NOTE_MAX} // ป้องกันการพิมพ์เกินแบบ native
                        className={`${inputCls} min-w-0 max-w-full`}
                        placeholder="เช่น ต้องการที่นั่งเด็ก 1 ตัว รับรถหน้าประตู 3"
                        aria-describedby="note-counter"
                      />
                      <div className="flex items-center justify-between">
                        <p id="note-counter" className="text-xs text-slate-500">
                          {(form.note || "").length}/{NOTE_MAX}
                        </p>
                        {(form.note || "").length >= NOTE_MAX && (
                          <span className="text-xs text-red-600">
                            ถึงขีดจำกัด {NOTE_MAX} ตัวอักษร
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ปุ่ม */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:gap-4 pt-3 sm:pt-4 w-full">
                      <Link
                        href={`/cars/${encodeURIComponent(id)}${
                          passthroughQS ? `?${passthroughQS}` : ""
                        }`}
                        className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-center text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 text-sm sm:text-base flex-1 sm:flex-none"
                      >
                        กลับไปหน้ารถ
                      </Link>

                      <button
                        type="button"
                        onClick={goToPayment}
                        className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 text-center shadow-lg hover:shadow-yellow-400/30 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base flex-1 sm:flex-none"
                      >
                        ไปหน้า Choose payment →
                      </button>
                    </div>
                  </div>
                </section>

                {/* ขวา: สรุป */}
                <aside
                  className={`${cardCls} p-4 sm:p-6 md:p-8 h-fit transition-all duration-300 hover:shadow-xl group hover:bg-white/15`}
                >
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center group-hover:text-yellow-400 transition-colors duration-300">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg mr-2 sm:mr-3 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-black"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    สรุปรายการจอง
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors duration-200">
                      <span className="text-xs sm:text-sm text-slate-300">
                        รถ
                      </span>
                      <span className="font-semibold text-white text-sm sm:text-base">
                        {car.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors duration-200">
                      <span className="text-xs sm:text-sm text-slate-300">
                        ระยะเวลา
                      </span>
                      <span className="font-semibold text-white text-sm sm:text-base">
                        {dayCount} วัน
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors duration-200">
                      <span className="text-xs sm:text-sm text-slate-300">
                        ราคา/วัน
                      </span>
                      <span className="text-slate-200 text-sm sm:text-base">
                        ฿{Number(car.pricePerDay || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors duration-200">
                      <span className="text-xs sm:text-sm text-slate-300">
                        ราคามัดจำ
                      </span>
                      <span className="text-slate-200 text-sm sm:text-base">
                        ฿500
                      </span>
                    </div>
                    <hr className="my-3 sm:my-4 border-white/20" />
                    <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors duration-200">
                      <span className="text-xs sm:text-sm text-slate-300">
                        ราคารถ (x{dayCount})
                      </span>
                      <span className="text-slate-200 text-sm sm:text-base">
                        ฿{Number(basePrice).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 backdrop-blur-sm rounded-xl border border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-200">
                      <span className="text-base sm:text-lg font-bold text-white">
                        ยอดรวมทั้งหมด
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-yellow-400">
                        ฿{Number(total).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* ===== Modal: เกิน 140 ตัวอักษร ===== */}
      {showNoteLimit && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNoteLimit(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl sm:rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg mr-3 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-black"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              ข้อความยาวเกินกำหนด
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              หมายเหตุสามารถใส่ได้ไม่เกิน {NOTE_MAX} ตัวอักษร
              ระบบได้ตัดให้พอดีแล้วค่ะ
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105"
                onClick={() => setShowNoteLimit(false)}
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
