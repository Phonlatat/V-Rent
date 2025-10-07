// app/payment/choose/ChoosePaymentClient.js
"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCarById } from "@/data/cars";

/* ---------- helpers ---------- */
const getBool = (v) => String(v ?? "").toLowerCase() === "true";
const fmt = (n) => Number(n || 0).toLocaleString();
const pick = (sp, k, fb = "") => sp.get(k) ?? fb;

// แปลงวันที่เป็นรูปแบบที่ ERP ต้องการ: "YYYY-MM-DD HH:mm:ss"
function toErpDateTime(s) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:00`;
}

// เลือกวันที่แบบปลอดภัย: ให้ความสำคัญ ISO ก่อน ตกมาใช้ local input
function chooseDateStrings(sp) {
  const isoPick = pick(sp, "pickup_at", "");
  const isoDrop = pick(sp, "return_at", "");
  const localPick = pick(sp, "pickupAt", "");
  const localDrop = pick(sp, "dropoffAt", "");

  const toLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return {
    displayPick: localPick || toLocal(isoPick),
    displayDrop: localDrop || toLocal(isoDrop),
    calcPick: isoPick || localPick || "",
    calcDrop: isoDrop || localDrop || "",
  };
}

const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "https://demo.erpeazy.com";

export default function ChoosePaymentClient() {
  const sp = useSearchParams();
  const router = useRouter();

  // ===== auth guard (frontend only) =====
  const [userId, setUserId] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  useEffect(() => {
    try {
      const uid = localStorage.getItem("vrent_user_id") || "";
      if (uid) {
        setUserId(uid);
        return;
      }
      // ถ้า localStorage ว่าง แต่คุกกี้ ERP อาจยังล็อกอินอยู่ → ขอชื่อผู้ใช้จาก ERP
      (async () => {
        try {
          const r = await fetch(
            `${ERP_BASE}/api/method/frappe.auth.get_logged_user`,
            {
              method: "GET",
              credentials: "include",
            }
          );
          const j = await r.json().catch(() => ({}));
          const who = j?.message || "";
          if (who && who !== "Guest") {
            localStorage.setItem("vrent_user_id", who);
            setUserId(who);
            setShowLoginModal(false);
            return;
          }
          setShowLoginModal(true);
        } catch {
          setShowLoginModal(true);
        }
      })();
    } catch {}
  }, []);

  /* ---------- รับพารามิเตอร์ทั้งหมด ---------- */
  const carId = pick(sp, "carId");
  const carName = pick(sp, "carName");
  const carBrand = pick(sp, "carBrand");
  const carType = pick(sp, "carType");
  const carYear = pick(sp, "carYear");
  const carTransmission = pick(sp, "carTransmission");
  const carSeats = pick(sp, "carSeats");
  const carFuel = pick(sp, "carFuel");
  const pricePerDay = Number(pick(sp, "pricePerDay") || 0);
  const companyName = pick(sp, "companyName");
  const companySlug = pick(sp, "companySlug");
  const carImage = pick(sp, "carImage");

  const pickupLocation = pick(sp, "pickupLocation");
  const dropoffLocation = pick(sp, "dropoffLocation");
  const { displayPick, displayDrop, calcPick, calcDrop } =
    chooseDateStrings(sp);
  const name = pick(sp, "name");
  const phone = pick(sp, "phone");
  const email = pick(sp, "email"); // จะไม่ใช้เป็นตัวตนจริง (แค่โชว์ในสรุปเท่านั้น)
  const note = pick(sp, "note");

  const extras = {
    childSeat: getBool(pick(sp, "childSeat")),
    gps: getBool(pick(sp, "gps")),
    fullInsurance: getBool(pick(sp, "fullInsurance")),
  };

  const passengers = pick(sp, "passengers");
  const promo = pick(sp, "promo");
  const ftype = pick(sp, "ftype");
  const key = pick(sp, "key");
  const isAdmin = getBool(pick(sp, "isAdmin"));

  const carFallback = useMemo(() => getCarById(String(carId || "")), [carId]);
  const car = useMemo(() => {
    const fromQueryHasCar =
      carName || carBrand || carType || pricePerDay || carImage || companyName;
    if (fromQueryHasCar) {
      return {
        id: carId,
        name: carName || carFallback?.name || "Vehicle",
        brand: carBrand || carFallback?.brand || "",
        type: carType || carFallback?.type || "",
        year: carYear || carFallback?.year || "",
        transmission: carTransmission || carFallback?.transmission || "",
        seats: carSeats || carFallback?.seats || "",
        fuel: carFuel || carFallback?.fuel || "",
        pricePerDay: Number(pricePerDay || carFallback?.pricePerDay || 0),
        company: {
          name: companyName || carFallback?.company?.name || "V-Rent Partner",
          slug:
            companySlug ||
            carFallback?.company?.slug ||
            (companyName || "partner").toLowerCase().replace(/\s+/g, "-"),
        },
        image: carImage || carFallback?.image || "/noimage.jpg",
        description: carFallback?.description || "",
      };
    }
    return (
      carFallback || {
        id: carId,
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
  }, [
    carId,
    carName,
    carBrand,
    carType,
    carYear,
    carTransmission,
    carSeats,
    carFuel,
    pricePerDay,
    companyName,
    companySlug,
    carImage,
    carFallback,
  ]);

  const dayCount = useMemo(() => {
    if (!calcPick || !calcDrop) return 1;
    const A = new Date(calcPick);
    const B = new Date(calcDrop);
    const diff = Math.ceil((B.getTime() - A.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  }, [calcPick, calcDrop]);

  // ---------- ราคา ----------
  const unitPrice = Number(car?.pricePerDay || 0); // ราคาต่อวัน
  const baseTotal = unitPrice * dayCount; // ราคารถรวม (ก่อน option)
  const extrasSum =
    (extras.childSeat ? 120 : 0) * dayCount +
    (extras.gps ? 80 : 0) * dayCount +
    (extras.fullInsurance ? 300 : 0) * dayCount;
  const total = baseTotal + extrasSum; // ยอดสุทธิ

  const [method, setMethod] = useState("promptpay");
  const [card, setCard] = useState({
    number: "",
    nameOnCard: "",
    exp: "",
    cvc: "",
  });
  const [slip, setSlip] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const tailQS = useMemo(() => {
    const qs = sp.toString();
    return qs ? `?${qs}` : "";
  }, [sp]);

  async function handlePay() {
    if (submitting) return;
    // 0) ต้องล็อกอินก่อน (กันซ้ำอีกชั้น)
    if (!userId) {
      // เด้งป๊อปอัปแทน
      setShowLoginModal(true);
      return;
    }

    // ---- VALIDATION ก่อนส่ง ERP ----

    // 0.5) กันเพจถูกเปิดด้วยลิงก์ที่ไม่ครบ
    if (!carId) {
      alert("ลิงก์ไม่ถูกต้อง: ไม่พบรหัสรถ");
      return;
    }
    // 1) ต้องมีวัน-เวลารับ/คืน
    if (!calcPick || !calcDrop) {
      alert("กรุณาระบุวัน-เวลารับรถและคืนรถให้ครบ");
      return;
    }
    // 2) รูปแบบวันที่ต้องถูกต้อง
    const pick = new Date(calcPick || displayPick);
    const drop = new Date(calcDrop || displayDrop);
    if (Number.isNaN(pick.getTime()) || Number.isNaN(drop.getTime())) {
      alert("รูปแบบวัน-เวลาไม่ถูกต้อง");
      return;
    }
    // 3) คืนรถต้อง 'ช้ากว่า' รับรถ
    if (drop <= pick) {
      alert("วัน-เวลาคืนรถต้องช้ากว่าวัน-เวลารับรถ");
      return;
    }
    // 4) ราคาต่อวันต้องมากกว่า 0
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      alert("ราคาต่อวันไม่ถูกต้อง");
      return;
    }
    // 5) ถ้า PromptPay ต้องแนบสลิป
    if (method === "promptpay" && !slip) {
      alert("กรุณาอัปโหลดสลิปการชำระเงิน");
      return;
    }
    // ✅ อนุโลม email ที่ไม่มี @ เมื่อไม่ได้จ่ายด้วยบัตร
    const emailVal = (email ?? "").trim();
    // บังคับตรวจ format เฉพาะกรณีจ่ายด้วยบัตร และกรอกอีเมลมา
    if (method === "visa" && emailVal) {
      const emailRe = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRe.test(emailVal)) {
        alert("กรุณากรอกอีเมลให้ถูกต้อง");
        return;
      }
    }

    setSubmitting(true);
    try {
      const extrasList = [
        extras.childSeat ? "childSeat" : null,
        extras.gps ? "gps" : null,
        extras.fullInsurance ? "fullInsurance" : null,
      ].filter(Boolean);
      const additional_options = extrasList.join(", ");

      const fd = new FormData();
      fd.append("confirmation_document", key || `WEB-${Date.now()}`);
      // ✅ ส่ง “ข้อมูลผู้เช่าจริง” ตามที่กรอกในฟอร์ม
      fd.append("customer_name", name || "");
      fd.append("customer_phone", phone || "");
      fd.append("customer_email", (email || "").trim());

      // ✅ ส่งผู้ที่ทำรายการ (บัญชีที่ล็อกอิน) แยกต่างหาก เพื่อให้ ERP บันทึกว่าใครเป็นคนจอง
      fd.append("booked_by_user", userId || "");
      fd.append(
        "vehicle",
        car?.name || [carBrand, carName].filter(Boolean).join(" ") || "Vehicle"
      );

      // ✅ ราคา
      fd.append("base_price", String(unitPrice)); // ราคาต่อวัน
      fd.append("base_total", String(baseTotal)); // ราคารวม (ยังไม่รวม option)
      fd.append("price_per_day", String(unitPrice));
      fd.append("price", String(unitPrice));
      fd.append("total_price", String(total)); // ยอดสุทธิ
      fd.append("down_payment", String(total)); // ชำระเต็ม

      // ✅ อื่นๆ
      fd.append("pickup_place", pickupLocation || "");
      fd.append("return_place", dropoffLocation || "");
      fd.append("pickup_date", toErpDateTime(calcPick || displayPick));
      fd.append("return_date", toErpDateTime(calcDrop || displayDrop));
      fd.append("discount", "0");
      fd.append("contact_platform", "website");
      fd.append("additional_options", additional_options);
      fd.append("remark", note || "");

      if (slip) fd.append("receipt", slip, slip.name || "receipt.jpg");

      const res = await fetch(
        "https://demo.erpeazy.com/api/method/erpnext.api.create_rental",
        { method: "POST", body: fd, credentials: "include", redirect: "follow" }
      );

      const text = await res.text();
      let j;
      try {
        j = JSON.parse(text);
      } catch {
        j = { raw: text };
      }

      if (!res.ok) {
        console.error("ERP create_rental failed:", j);
        alert("ไม่สามารถบันทึกข้อมูลการชำระเงินได้ กรุณาลองใหม่อีกครั้ง");
        setSubmitting(false);
        return;
      }

      alert("ชำระเงินเสร็จสิ้น ขอบคุณค่ะ 🙌");
      window.location.href = "/";
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดระหว่างบันทึกการชำระเงิน");
      setSubmitting(false);
    }
  }

  const debugAllParams = useMemo(() => {
    const o = {};
    for (const [k, v] of sp.entries()) o[k] = v;
    o.__derived__ = {
      dayCount,
      unitPrice,
      baseTotal,
      extrasSum,
      total,
      displayPick,
      displayDrop,
      isAdmin,
    };
    return o;
  }, [
    sp,
    dayCount,
    unitPrice,
    baseTotal,
    extrasSum,
    total,
    displayPick,
    displayDrop,
    isAdmin,
  ]);

  return (
    <>
      {/* ====== Login Required Modal ====== */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowLoginModal(false)}
          />
          {/* dialog */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              กรุณาเข้าสู่ระบบ
            </h3>
            <p className="mt-1 text-sm text-slate-700">
              คุณต้องล็อกอินก่อนจึงจะดำเนินการชำระเงินได้
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
                onClick={() => setShowLoginModal(false)}
              >
                ปิด
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-black"
                onClick={() => {
                  const next = encodeURIComponent(
                    location.pathname + location.search
                  );
                  router.push(`/Login?next=${next}`);
                }}
              >
                ไปหน้าล็อกอิน
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[2fr_1fr] gap-6 items-start min-w-0">
        <section className="bg-white rounded-2xl shadow-lg border border-slate-300 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            เลือกวิธีการชำระเงิน
          </h1>
          <p className="text-slate-700 mt-1">
            โปรดเลือกวิธีชำระเงินเพื่อดำเนินการจองให้เสร็จสมบูรณ์
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMethod("promptpay")}
              className={`text-left rounded-xl border p-4 transition hover:shadow-sm ${
                method === "promptpay"
                  ? "border-slate-900 ring-2 ring-slate-900"
                  : "border-slate-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white font-bold">
                  ฿
                </span>
                <div>
                  <div className="font-semibold text-slate-900">PromptPay</div>
                  <div className="text-sm text-slate-700">
                    โอนผ่าน QR พร้อมเพย์ (อัปโหลดสลิป)
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMethod("visa")}
              className={`text-left rounded-xl border p-4 transition hover:shadow-sm ${
                method === "visa"
                  ? "border-slate-900 ring-2 ring-slate-900"
                  : "border-slate-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-600 font-bold text-slate-900">
                  VISA
                </span>
                <div>
                  <div className="font-semibold text-slate-900">
                    บัตรเครดิต / เดบิต
                  </div>
                  <div className="text-sm text-slate-700">
                    รองรับ Visa / Mastercard
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-8">
            {method === "promptpay" ? (
              <div className="rounded-xl border border-slate-300 p-5">
                <h3 className="font-bold text-lg text-slate-900">
                  ชำระเงินด้วย PromptPay
                </h3>
                <p className="text-sm text-slate-700 mt-1">
                  สแกน QR เพื่อชำระยอดรวม จากนั้นอัปโหลดสลิปเพื่อยืนยัน
                </p>

                <div className="mt-5 flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-44 w-44 rounded-lg border border-slate-300 grid place-items-center overflow-hidden bg-white">
                    <img
                      src="https://commons.wikimedia.org/wiki/Special:FilePath/Rickrolling_QR_code.png"
                      alt="PromptPay QR"
                      className="h-44 w-44 object-contain"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <div className="text-sm text-slate-700">ยอดที่ต้องชำระ</div>
                    <div className="text-4xl font-extrabold tracking-tight text-slate-900">
                      ฿{fmt(total)}
                    </div>

                    <div className="mt-4">
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-400 hover:bg-slate-50 cursor-pointer text-slate-900">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            setSlip(f);
                          }}
                        />
                        <span>อัปโหลดสลิป</span>
                      </label>
                      <p className="text-xs text-slate-700 mt-1">
                        รองรับ .jpg, .png (สูงสุด ~5MB)
                        {slip ? ` • ไฟล์: ${slip.name}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-300 p-5">
                <h3 className="font-bold text-lg text-slate-900">
                  ชำระเงินด้วยบัตร
                </h3>
                <p className="text-sm text-slate-700 mt-1">
                  กรอกข้อมูลบัตรเครดิต/เดบิตของคุณให้ครบถ้วน
                </p>

                <div className="mt-4 grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-900">
                        เลขที่บัตร
                      </label>
                      <input
                        inputMode="numeric"
                        placeholder="4242 4242 4242 4242"
                        className="w-full rounded-lg border border-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        value={card.number}
                        onChange={(e) =>
                          setCard((c) => ({ ...c, number: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-900">
                        ชื่อบนบัตร
                      </label>
                      <input
                        placeholder="NAME SURNAME"
                        className="w-full rounded-lg border border-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        value={card.nameOnCard}
                        onChange={(e) =>
                          setCard((c) => ({
                            ...c,
                            nameOnCard: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-900">
                        วันหมดอายุ (MM/YY)
                      </label>
                      <input
                        placeholder="12/27"
                        className="w-full rounded-lg border border-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        value={card.exp}
                        onChange={(e) =>
                          setCard((c) => ({ ...c, exp: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-900">
                        CVC
                      </label>
                      <input
                        inputMode="numeric"
                        placeholder="123"
                        className="w-full rounded-lg border border-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        value={card.cvc}
                        onChange={(e) =>
                          setCard((c) => ({ ...c, cvc: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/booking/${encodeURIComponent(carId || "")}${tailQS}`}
                className="px-4 py-2 rounded-lg border border-slate-400 bg-white hover:bg-slate-50 text-center"
              >
                กลับไปแก้ไขข้อมูลการจอง
              </Link>
              <button
                type="button"
                onClick={handlePay}
                disabled={submitting}
                className={`px-5 py-2.5 rounded-lg text-white font-semibold ${
                  submitting
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-black"
                }`}
              >
                {submitting ? "กำลังบันทึก..." : "ดำเนินการชำระเงิน"}
              </button>
            </div>

            {/* Debug panel */}
            {/* <details className="mt-6 rounded-lg border border-slate-300 p-4 bg-slate-50">
            <summary className="cursor-pointer font-semibold text-slate-900">
              Debug: ข้อมูลที่ส่งมาหน้านี้ทั้งหมด
            </summary>
            <pre className="mt-3 text-xs overflow-auto whitespace-pre-wrap">
              {JSON.stringify(debugAllParams, null, 2)}
            </pre>
          </details> */}
          </div>
        </section>

        {/* สรุปรายการจอง */}
        <aside className="bg-white rounded-2xl shadow-lg border border-slate-300 p-6 md:p-8 h-fit md:sticky md:top-4 min-w-0">
          <h3 className="text-lg font-bold text-slate-900">สรุปรายการจอง</h3>
          <div className="mt-4 text-sm space-y-3 break-words">
            <div className="flex justify-between gap-4">
              <span>รถ</span>
              <span className="font-medium text-right max-w-[65%] break-all">
                {car?.name || "-"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>รับรถ</span>
              <span className="text-right max-w-[65%] break-all">
                {pickupLocation || "-"}
                <br className="hidden sm:block" />
                <span className="text-slate-700">{displayPick || "-"}</span>
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>คืนรถ</span>
              <span className="text-right max-w-[65%] break-all">
                {dropoffLocation || "-"}
                <br className="hidden sm:block" />
                <span className="text-slate-700">{displayDrop || "-"}</span>
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>ชื่อผู้จอง</span>
              <span className="font-medium text-right max-w-[65%] break-all">
                {name || "-"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>ติดต่อ</span>
              <span className="text-right max-w-[65%] break-all">
                {phone || "-"}
                <br className="hidden sm:block" />
                <span className="text-slate-700">{email || "-"}</span>
              </span>
            </div>

            <hr className="my-2 border-slate-300" />

            <div className="flex justify-between gap-4">
              <span>ราคาต่อวัน</span>
              <span>฿{fmt(unitPrice)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>ราคารถรวม (x{dayCount})</span>
              <span>฿{fmt(baseTotal)}</span>
            </div>

            <div className="flex justify-between text-lg font-extrabold mt-2 gap-4">
              <span>รวมทั้งหมด</span>
              <span>฿{fmt(total)}</span>
            </div>

            <hr className="my-2 border-slate-300" />

            <div className="text-xs text-slate-800 whitespace-pre-wrap break-all">
              หมายเหตุ: {note || "-"}
            </div>

            {isAdmin ? (
              <div className="mt-2 text-xs font-semibold text-green-700">
                (Admin mode)
              </div>
            ) : null}

            {(passengers || promo || ftype || key) && (
              <div className="mt-2 text-xs text-slate-700 space-y-1 break-all">
                {passengers ? <div>ผู้โดยสาร: {passengers}</div> : null}
                {ftype ? <div>ประเภทรถ: {ftype}</div> : null}
                {promo ? <div>โค้ดส่วนลด: {promo}</div> : null}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

// AllSet
