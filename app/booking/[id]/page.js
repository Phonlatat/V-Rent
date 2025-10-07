// app/booking/[id]/page.js  (หรือไฟล์ BookingPage ของคุณ)
"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Headers from "@/Components/Header";
import Footer from "@/Components/Footer";
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
  const labelCls = "text-sm font-semibold text-slate-800";
  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black";
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
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <title>BookingPage - V-Rent</title>
      <Headers />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          {/* Summary */}
          <div className="lg:col-span-2 -mt-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm flex flex-wrap gap-x-6 gap-y-2">
              <span>
                รับ: <b>{pickupDisplay}</b>
              </span>
              <span>
                คืน: <b>{returnDisplay}</b>
              </span>
              {passengers ? (
                <span>
                  ผู้โดยสาร: <b>{passengers}</b>
                </span>
              ) : null}
              {ftype ? (
                <span>
                  ประเภทรถ: <b>{ftype}</b>
                </span>
              ) : null}
              {promo ? (
                <span>
                  โค้ดส่วนลด: <b>{promo}</b>
                </span>
              ) : null}
              {key ? (
                <span>
                  key: <b>{key}</b>
                </span>
              ) : null}
            </div>
          </div>

          {/* ซ้าย: ฟอร์ม */}
          <section className={`${cardCls} p-6 md:p-8`}>
            <div className="flex items-start gap-4">
              <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <Image
                  src={car.image || "/noimage.jpg"}
                  alt={car.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {car.name}
                </h1>
                <p className="text-sm md:text-base text-slate-700">
                  {car.brand} {car.brand && car.type ? "•" : ""} {car.type}
                  {car.year ? ` • ${car.year}` : ""}{" "}
                  {car.transmission ? ` • ${car.transmission}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-6 md:mt-8 grid gap-6">
              {/* สถานที่ */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelCls}>สถานที่รับรถ</label>
                  <input
                    name="pickupLocation"
                    value={form.pickupLocation}
                    onChange={handleChange}
                    placeholder="เช่น สนามบินเชียงใหม่ (CNX)"
                    className={inputCls}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>สถานที่คืนรถ</label>
                  <input
                    name="dropoffLocation"
                    value={form.dropoffLocation}
                    onChange={handleChange}
                    placeholder="เช่น ตัวเมืองเชียงใหม่"
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              {/* เวลา */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelCls}>วัน–เวลารับรถ</label>
                  <input
                    type="datetime-local"
                    name="pickupAt"
                    value={form.pickupAt}
                    onChange={handleChange}
                    min={minDateTime}
                    className={inputCls}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>วัน–เวลาคืนรถ</label>
                  <input
                    type="datetime-local"
                    name="dropoffAt"
                    value={form.dropoffAt}
                    onChange={handleChange}
                    min={form.pickupAt || minDateTime}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              {/* ผู้ติดต่อ */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className={labelCls}>ชื่อ–นามสกุล</label>
                  <input
                    name="name"
                    value={form.name || ""}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="ชื่อผู้จอง"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>เบอร์โทร</label>
                  <input
                    name="phone"
                    value={form.phone || ""}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="091-234-5678"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>อีเมล</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email || ""}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* หมายเหตุ */}
              <div className="space-y-2">
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
                  className={inputCls}
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href={`/cars/${encodeURIComponent(id)}${
                    passthroughQS ? `?${passthroughQS}` : ""
                  }`}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-center"
                >
                  กลับไปหน้ารถ
                </Link>

                <button
                  type="button"
                  onClick={goToPayment}
                  className="px-5 py-2.5 rounded-lg bg-black text-white font-semibold hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black text-center"
                >
                  ไปหน้า Choose payment →
                </button>
              </div>
            </div>
          </section>

          {/* ขวา: สรุป */}
          <aside className={`${cardCls} p-6 md:p-8 h-fit`}>
            <h3 className="text-lg font-bold">สรุปรายการจอง</h3>
            <div className="mt-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span>รถ</span>
                <span className="font-medium">{car.name}</span>
              </div>
              <div className="flex justify-between">
                <span>ระยะเวลา</span>
                <span className="font-medium">{dayCount} วัน</span>
              </div>
              <div className="flex justify-between">
                <span>ราคา/วัน</span>
                <span>฿{Number(car.pricePerDay || 0).toLocaleString()}</span>
              </div>
              <hr className="my-3 border-slate-200" />
              <div className="flex justify-between">
                <span>ราคารถ (x{dayCount})</span>
                <span>฿{Number(basePrice).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>ราคาตัวเลือก (รวม)</span>
                <span>฿{Number(extrasPrice).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold mt-2">
                <span>รวมทั้งหมด</span>
                <span>฿{Number(total).toLocaleString()}</span>
              </div>
            </div>
          </aside>
        </div>
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
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNoteLimit(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              ข้อความยาวเกินกำหนด
            </h3>
            <p className="mt-1 text-sm text-slate-700">
              หมายเหตุสามารถใส่ได้ไม่เกิน {NOTE_MAX} ตัวอักษร
              ระบบได้ตัดให้พอดีแล้วค่ะ
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-black"
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
