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
          `/erpnext.api.get_user_information?user_id=${encodeURIComponent(
            uid
          )}`,
          { method: "GET", cache: "no-store", credentials: "include" }
        );
        if (!r.ok) return;
        const j = await r.json();
        const msg = Array.isArray(j?.message) ? j.message : null;
        if (!msg) return;
        const fullName = msg[0] || "";
        const phone = msg[1] || "";
        setForm((prev) => ({
          ...prev,
          name: fullName || prev.name,
          phone: phone || prev.phone,
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
  const labelCls = "text-sm font-semibold text-slate-700";
  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300 hover:border-slate-400";
  const cardCls = "bg-white rounded-2xl shadow-lg border border-slate-200";
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
    <div className="flex flex-col min-h-screen bg-white text-slate-900">
      <title>BookingPage - V-Rent</title>
      <Headers />

      <main className="flex-grow">
        <section className="relative">
          {/* แถบเหลืองครึ่งบนของโซนเนื้อหา */}
          <div className="absolute inset-x-0 top-0 h-[120px] bg-gradient-to-r from-yellow-400 to-amber-500" />

          {/* เนื้อหาจริง ให้อยู่เหนือแถบเหลือง */}
          <div className="relative p-4 sm:p-8 lg:p-10">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 overflow-x-hidden">
              {/* Summary */}
              <div className="lg:col-span-2 -mt-2">
                <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-sm p-6 text-sm flex flex-wrap gap-x-6 gap-y-3 shadow-lg">
                  <div className="flex items-center text-slate-600">
                    <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span>รับ: <b className="text-slate-800">{pickupDisplay}</b></span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span>คืน: <b className="text-slate-800">{returnDisplay}</b></span>
                  </div>
                  {passengers ? (
                    <div className="flex items-center text-slate-600">
                      <svg className="w-4 h-4 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.5 8h-1c-.8 0-1.5.63-1.5 1.5L15.5 16H18v6h2zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9l-1.5-4.5A1.5 1.5 0 0 0 6 9H5c-.8 0-1.5.63-1.5 1.5L4.5 15H7v7h.5z"/>
                      </svg>
                      <span>ผู้โดยสาร: <b className="text-slate-800">{passengers}</b></span>
                    </div>
                  ) : null}
                  {ftype ? (
                    <div className="flex items-center text-slate-600">
                      <svg className="w-4 h-4 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span>ประเภทรถ: <b className="text-slate-800">{ftype}</b></span>
                    </div>
                  ) : null}
                  {promo ? (
                    <div className="flex items-center text-slate-600">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span>โค้ดส่วนลด: <b className="text-slate-800">{promo}</b></span>
                    </div>
                  ) : null}
                </div>
              </div>

          {/* ซ้าย: ฟอร์ม */}
          <section className={`${cardCls} p-6 md:p-8 min-w-0 overflow-hidden transition-all duration-300 hover:shadow-xl`}>
            <div className="flex items-start gap-6">
              <div className="relative w-32 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-lg transition-transform duration-300 hover:scale-105">
                <Image
                  src={car.image || "/noimage.jpg"}
                  alt={car.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                  {car.name}
                </h1>
                <p className="text-sm md:text-base text-slate-600 mt-1">
                  {car.brand} {car.brand && car.type ? "•" : ""} {car.type}
                  {car.year ? ` • ${car.year}` : ""}{" "}
                  {car.transmission ? ` • ${car.transmission}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-6 md:mt-8 grid gap-6">
              {/* สถานที่ */}
              <div className="grid md:grid-cols-2 gap-4 min-w-0">
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
              <div className="grid md:grid-cols-2 gap-4 min-w-0">
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
              <div className="grid md:grid-cols-3 gap-4">
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
                <div className="space-y-2 min-w-0">
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
                    const next = ((form.note || "") + text).slice(0, NOTE_MAX);
                    if ((form.note || "").length + text.length > NOTE_MAX) {
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <Link
                  href={`/cars/${encodeURIComponent(id)}${
                    passthroughQS ? `?${passthroughQS}` : ""
                  }`}
                  className="px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-center text-slate-700 hover:text-slate-900 transition-all duration-300 hover:border-slate-400"
                >
                  กลับไปหน้ารถ
                </Link>

                <button
                  type="button"
                  onClick={goToPayment}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-white font-semibold hover:from-yellow-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 text-center shadow-lg hover:shadow-yellow-500/30 transition-all duration-300 transform hover:scale-105"
                >
                  ไปหน้า Choose payment →
                </button>
              </div>
            </div>
          </section>

          {/* ขวา: สรุป */}
          <aside className={`${cardCls} p-6 md:p-8 h-fit transition-all duration-300 hover:shadow-xl`}>
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg mr-3 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              สรุปรายการจอง
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200">
                <span className="text-slate-600">รถ</span>
                <span className="font-semibold text-slate-800">{car.name}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200">
                <span className="text-slate-600">ระยะเวลา</span>
                <span className="font-semibold text-slate-800">{dayCount} วัน</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200">
                <span className="text-slate-600">ราคา/วัน</span>
                <span className="text-slate-700">฿{Number(car.pricePerDay || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200">
                <span className="text-slate-600">ราคามัดจำ</span>
                <span className="text-slate-700">฿500</span>
              </div>
              <hr className="my-4 border-slate-200" />
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200">
                <span className="text-slate-600">ราคารถ (x{dayCount})</span>
                <span className="text-slate-700">฿{Number(basePrice).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 hover:border-yellow-300 transition-all duration-200">
                <span className="text-lg font-bold text-slate-800">ยอดรวมทั้งหมด</span>
                <span className="text-xl font-bold text-yellow-600">฿{Number(total).toLocaleString()}</span>
              </div>
            </div>
          </aside>
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNoteLimit(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg mr-3 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              ข้อความยาวเกินกำหนด
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              หมายเหตุสามารถใส่ได้ไม่เกิน {NOTE_MAX} ตัวอักษร
              ระบบได้ตัดให้พอดีแล้วค่ะ
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-white font-semibold hover:from-yellow-600 hover:to-amber-600 transition-all duration-300 transform hover:scale-105"
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
