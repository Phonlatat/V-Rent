"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { carTypes } from "@/data/carTypes";

const ERP_BASE = (
  process.env.NEXT_PUBLIC_ERP_BASE || "https://demo.erpeazy.com"
).replace(/\/+$/, "");

// map ประเภทรถ -> ftype ที่ ERP ใช้
const carTypeToFType = {
  any: undefined,
  eco: "ECO",
  sedan: "SEDAN",
  suv: "SUV",
  pickup: "PICKUP",
  van: "VAN",
};

// รวม date + time เป็น ISO (ใช้โซนเวลาเครื่องผู้ใช้) → คืน ISO (UTC)
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

/**
 * Headnsearch
 * - พื้นหลังรูปภาพ + Header + กล่องค้นหา
 */
export default function Headnsearch({
  bgSrc = "/images/View2.jpg",
  onSearch,
  pickupLocation, // รับมาจากหน้า Home
  setPickupLocation, // (ถ้ามี) ไว้ยิงกลับขึ้นไปเวลาแก้ไขในช่อง
}) {
  const router = useRouter();

  // ====== User session (ส่วนของ Header) ======
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const computeFromStorage = () => {
    const uid = localStorage.getItem("vrent_user_id") || "";
    const nameFromStorage =
      localStorage.getItem("vrent_full_name") ||
      localStorage.getItem("vrent_user_name") ||
      "";
    const fallback = uid && uid.includes("@") ? uid.split("@")[0] : uid;
    return { uid, name: nameFromStorage || fallback };
  };

  async function hydrateFromERP() {
    try {
      let uid = localStorage.getItem("vrent_user_id") || "";
      if (!uid) {
        const whoRes = await fetch(
          `${ERP_BASE}/api/method/frappe.auth.get_logged_user`,
          { method: "GET", credentials: "include", cache: "no-store" }
        );
        const whoJson = await whoRes.json().catch(() => ({}));
        const who = whoJson?.message || "";
        if (who && who !== "Guest") {
          uid = who;
          localStorage.setItem("vrent_user_id", uid);
        }
      }
      if (!uid) return;

      const u = new URL(
        `${ERP_BASE}/api/method/erpnext.api.get_user_information`
      );
      u.searchParams.set("user_id", uid);
      const r = await fetch(u.toString(), {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!r.ok) return;

      const data = await r.json();
      const msg = data?.message ?? data ?? {};

      const first = msg.first_name || msg.given_name || "";
      const last = msg.last_name || msg.surname || "";
      const fullName =
        first || last
          ? [first, last].filter(Boolean).join(" ")
          : msg.full_name || msg.fullname || msg.name || "";
      const email = msg.email || msg.user || msg.user_id || msg.username || uid;

      const rolesRaw = msg.roles || [];
      const roles = Array.isArray(rolesRaw)
        ? rolesRaw
            .map((r) => (typeof r === "string" ? r : r?.role))
            .filter(Boolean)
        : [];
      const isAdmin =
        String(email).toLowerCase() === "administrator" ||
        roles.some((r) => /^(Administrator|System Manager)$/i.test(String(r)));

      if (email) localStorage.setItem("vrent_user_id", email);
      if (fullName) localStorage.setItem("vrent_full_name", fullName);
      localStorage.setItem("vrent_is_admin", String(isAdmin));

      const { uid: sUid, name } = computeFromStorage();
      setUserId(sUid);
      setDisplayName(name);
    } catch {
      // เงียบไว้ถ้าไม่มี session
    }
  }

  useEffect(() => {
    const { uid, name } = computeFromStorage();
    setUserId(uid);
    setDisplayName(name);

    hydrateFromERP();

    const onStorage = () => {
      const { uid: nextUid, name: nextName } = computeFromStorage();
      setUserId(nextUid);
      setDisplayName(nextName);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch(`${ERP_BASE}/api/method/logout`, {
        method: "GET",
        credentials: "include",
      });
    } catch (err) {
      console.error("logout error:", err);
    } finally {
      localStorage.removeItem("vrent_user_id");
      localStorage.removeItem("vrent_full_name");
      localStorage.removeItem("vrent_user_name");
      localStorage.removeItem("vrent_is_admin");
      localStorage.removeItem("vrent_login_email");
      localStorage.removeItem("vrent_phone");
      localStorage.removeItem("vrent_remember");

      setUserId("");
      setDisplayName("");
      setSigningOut(false);
      router.push("/Login");
    }
  };

  // ====== BookingBox (ย้ายมาอยู่ไฟล์เดียวกัน) ======
  const [form, setForm] = useState({
    pickupLocation: pickupLocation || "",
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

  // ถ้า prop pickupLocation เปลี่ยน ให้ดันเข้า form
  useEffect(() => {
    setForm((prev) => ({ ...prev, pickupLocation: pickupLocation || "" }));
  }, [pickupLocation]);
  const [showMore, setShowMore] = useState(false);

  const handleFormChange = (e) => {
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
      return_same: form.returnSame,
    };

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
  };

  return (
    <section className="relative min-h-[40vh] pb-24 sm:pb-28 md:pb-36">
      {/* รูปพื้นหลัง */}
      <Image
        src={bgSrc}
        alt="V-Rent background"
        fill
        priority
        className="object-cover object-center -z-10"
      />
      {/* เลเยอร์ช่วยให้อ่านง่าย */}
      <div className="absolute inset-0 bg-black/35 -z-10" />

      {/* Header บนรูปพื้นหลัง */}
      <header className="w-full bg-transparent text-white px-6 py-4 flex items-center justify-between shadow-none ">
        <div className="text-3xl font-bold">
          <Link href="/mainpage" className="flex items-center gap-1">
            <span>V</span>
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              -
            </span>
            <span>Rent</span>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          {userId ? (
            <>
              <span
                className="px-3 py-1.5 text-sm text-gray-200/90 rounded-md bg-white/10 ring-1 ring-white/15 cursor-default select-none"
                title="ชื่อผู้ใช้"
              >
                {displayName || userId}
              </span>

              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="px-3 py-1.5 text-sm rounded-md bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60 transition-colors"
              >
                {signingOut ? "กำลังออก..." : "Sign out"}
              </button>
            </>
          ) : (
            <Link
              href="/Login"
              className="px-3 py-1.5 text-sm text-white/90 rounded-md hover:bg-white/10 ring-1 ring-white/15 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      {/* BookingBox บนรูปพื้นหลัง */}
      <div className="pt-[max(2rem,env(safe-area-inset-top))] pb-8">
        <div className="px-4 sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <form
              onSubmit={handleSubmit}
              className="
                rounded-2xl bg-white/95 shadow-xl/30 shadow-black/5 border border-white/40
                backdrop-blur px-3 sm:px-4 py-2
                text-slate-900
              "
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 items-stretch">
                {/* สถานที่ */}
                <div className="lg:col-span-5">
                  <label className="sr-only">สถานที่รับรถ</label>
                  <div className="h-14 w-full rounded-xl border border-slate-300 focus-within:ring-2 focus-within:ring-blue-500/40 border-slate-300 bg-white px-3 sm:px-4 flex items-center gap-3 text-slate-900">
                    {/* icon pin */}
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 text-slate-600 shrink-0"
                      fill="currentColor"
                    >
                      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5Z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="สถานที่รับรถ (เช่น สนามบินเชียงใหม่)"
                      className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-500"
                      name="pickupLocation"
                      value={form.pickupLocation}
                      onChange={(e) => {
                        handleFormChange(e);
                        setPickupLocation?.(e.target.value);
                      }}
                    />
                  </div>

                  {/* toggle คืนรถคนละที่ */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {/* checkbox + label */}
                    <label className="inline-flex items-center gap-2">
                      <input
                        id="returnSame"
                        type="checkbox"
                        name="returnSame"
                        checked={form.returnSame}
                        onChange={handleFormChange}
                        className="rounded border-slate-400 text-black focus:ring-black"
                        aria-controls="dropoffWrap"
                        aria-expanded={!form.returnSame}
                      />
                      <span className="text-sm text-slate-800">
                        คืนรถจุดเดิม
                      </span>
                    </label>

                    {/* ช่อง “จุดคืนรถ” พร้อมอนิเมชัน สูง/จาง อย่างนุ่ม */}
                    <div
                      id="dropoffWrap"
                      className={[
                        // ใช้ grid-rows เพื่อ animate ความสูงแบบไม่พัง margin ภายใน
                        "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                        form.returnSame
                          ? "grid-rows-[0fr] opacity-0 pointer-events-none"
                          : "grid-rows-[1fr] opacity-100",
                        // layout: กว้างพอดีบรรทัดบนมือถือ และยืดได้เมื่อมีที่ว่าง
                        "w-full sm:flex-1",
                      ].join(" ")}
                    >
                      {/* ตัวห่อภายในต้อง overflow-hidden เพื่อกันเนื้อหาทะลักระหว่าง animate */}
                      <div className="overflow-hidden">
                        <input
                          type="text"
                          name="dropoffLocation"
                          placeholder="จุดคืนรถ"
                          value={form.dropoffLocation}
                          onChange={handleFormChange}
                          className="
          mt-2 sm:mt-0 w-full sm:min-w-[220px]
          rounded-lg border border-slate-300
          px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-600
          bg-white
        "
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* รับรถ (วัน/เวลา) */}
                <div className="lg:col-span-3">
                  <div className="h-14 w-full rounded-xl border border-slate-300 bg-white px-3 sm:px-4 flex items-center text-slate-900">
                    <div className="w-full grid grid-cols-2 gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-700">วันรับรถ</span>
                        <input
                          type="date"
                          name="pickupDate"
                          value={form.pickupDate}
                          onChange={handleFormChange}
                          className="outline-none bg-transparent text-[15px] text-slate-900"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-700">เวลา</span>
                        <input
                          type="time"
                          name="pickupTime"
                          value={form.pickupTime}
                          onChange={handleFormChange}
                          step="60"
                          min="01:00"
                          max="23:59"
                          lang="en-GB"
                          inputMode="numeric"
                          className="outline-none bg-transparent text-[15px] text-slate-900"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* คืนรถ (วัน/เวลา) */}
                <div className="lg:col-span-3">
                  <div className="h-14 w-full rounded-xl border border-slate-300 bg-white px-3 sm:px-4 flex items-center text-slate-900">
                    <div className="w-full grid grid-cols-2 gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-700">วันคืนรถ</span>
                        <input
                          type="date"
                          name="returnDate"
                          value={form.returnDate}
                          onChange={handleFormChange}
                          className="outline-none bg-transparent text-[15px] text-slate-900"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-700">เวลา</span>
                        <input
                          type="time"
                          name="returnTime"
                          value={form.returnTime}
                          onChange={handleFormChange}
                          step="60"
                          min="01:00"
                          max="23:59"
                          lang="en-GB"
                          inputMode="numeric"
                          className="outline-none bg-transparent text-[15px] text-slate-900"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ปุ่มค้นหา */}
                <div className="lg:col-span-1 flex">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="
                      w-full h-14 rounded-xl font-semibold
                      bg-[#2563eb] text-white
                      hover:bg-[#1d4ed8] disabled:bg-slate-300
                      inline-flex items-center justify-center gap-2
                    "
                    title={!canSubmit ? "กรอกข้อมูลที่จำเป็นให้ครบก่อน" : ""}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                      fill="currentColor"
                    >
                      <path d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4a1 1 0 0 0 1.4-1.4l-4.4-4.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z" />
                    </svg>
                    ค้นหา
                  </button>
                </div>
              </div>

              {/* ตัวเลือกเพิ่มเติม */}
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowMore((s) => !s)}
                  className="text-sm text-slate-800 hover:text-slate-900 inline-flex items-center gap-1"
                >
                  ตัวเลือกเพิ่มเติม
                  <svg
                    viewBox="0 0 24 24"
                    className={`w-4 h-4 transition ${
                      showMore ? "rotate-180" : ""
                    }`}
                    fill="currentColor"
                  >
                    <path d="M12 15.5 5 8.5h14l-7 7Z" />
                  </svg>
                </button>

                <div className="text-xs text-slate-700">
                  * โปรดเลือกวัน-เวลาให้ครบเพื่อค้นหารถว่าง
                </div>
              </div>

              <div
                className={`
    transition-all duration-500 ease-in-out overflow-hidden
    ${showMore ? "max-h-[400px] opacity-100 pt-3" : "max-h-0 opacity-0 pt-0"}
  `}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm mb-1 text-slate-800">
                      ประเภทรถ
                    </label>
                    <select
                      name="carType"
                      value={form.carType}
                      onChange={handleFormChange}
                      className="w-full h-11 rounded-lg border border-slate-300 px-3 text-slate-900"
                    >
                      {carTypes.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-slate-800">
                      ผู้โดยสาร
                    </label>
                    <select
                      name="passengers"
                      value={form.passengers}
                      onChange={handleFormChange}
                      className="w-full h-11 rounded-lg border border-slate-300 px-3 text-slate-900"
                    >
                      {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-slate-800">
                      โค้ดโปรโมชัน
                    </label>
                    <input
                      type="text"
                      name="promo"
                      value={form.promo}
                      onChange={handleFormChange}
                      placeholder="กรอกถ้ามี"
                      className="w-full h-11 rounded-lg border border-slate-300 px-3 text-slate-900 placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
