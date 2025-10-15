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

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.150.243.195";
const DEPOSIT_AMOUNT = 500; // ยอดมัดจำ

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
  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const tailQS = useMemo(() => {
    const qs = sp.toString();
    return qs ? `?${qs}` : "";
  }, [sp]);

  // ดึงข้อมูลลูกค้าจาก ERP system
  useEffect(() => {
    if (userId) {
      (async () => {
        try {
          const response = await fetch(
            `${ERP_BASE}/api/method/frappe.api.api.get_user_information`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ user_id: userId }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const userInfo = data?.message || {};

            setCustomerData({
              name: userInfo.full_name || userInfo.name || "",
              phone: userInfo.phone || userInfo.mobile_no || "",
              email: userInfo.email || userInfo.user_id || "",
            });
          }
        } catch (error) {
          console.warn("Failed to fetch customer data:", error);
        }
      })();
    }
  }, [userId]);

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
      const confirmationDoc = key || `WEB-${Date.now()}`;
      fd.append("confirmation_document", confirmationDoc);
      // ✅ ส่ง "ข้อมูลผู้เช่าจริง" ตามที่กรอกในฟอร์ม
      fd.append("customer_name", customerData.name || "");
      fd.append("customer_phone", customerData.phone || "");
      fd.append("customer_email", (customerData.email || "").trim());

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
      // ตอนนี้เปลี่ยนเป็นจ่ายมัดจำ 500
      fd.append("down_payment", String(DEPOSIT_AMOUNT));

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
        "http://203.150.243.195/api/method/frappe.api.api.create_rental",
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

      // ---- ไปหน้า SUMMARY พร้อมพกข้อมูลทั้งหมด ----
      const rentalId =
        j?.message?.name || j?.message?.rental || j?.rental || ""; // เดาช่องจาก ERP
      let slipPreview = "";
      if (slip) {
        try {
          slipPreview = await fileToDataURL(slip); // data:image/...;base64,xxxx
          sessionStorage.setItem("vrent_slip_preview", slipPreview);
        } catch (e) {
          console.warn("Failed to make dataURL from slip:", e);
        }
      }
      const qp = new URLSearchParams({
        paymentStatus: "success",
        method,
        deposit: String(DEPOSIT_AMOUNT),
        total: String(total),
        baseTotal: String(baseTotal),
        extrasSum: String(extrasSum),
        dayCount: String(dayCount),
        has_slip: slip ? "1" : "0",

        // ข้อมูลผู้จอง
        name: customerData.name || "",
        phone: customerData.phone || "",
        email: (customerData.email || "").trim(),
        note: (note || "").slice(0, 140),

        // สถานที่/เวลา
        pickupLocation: pickupLocation || "",
        dropoffLocation: dropoffLocation || "",
        pickup_at: calcPick || displayPick || "",
        return_at: calcDrop || displayDrop || "",

        // รถ
        carId: String(carId || ""),
        carName: car?.name || "",
        carBrand: car?.brand || carBrand || "",
        carType: car?.type || carType || "",
        carYear: String(car?.year || carYear || ""),
        carTransmission: car?.transmission || carTransmission || "",
        carSeats: String(car?.seats || carSeats || ""),
        carFuel: car?.fuel || carFuel || "",
        pricePerDay: String(unitPrice),
        companyName: car?.company?.name || companyName || "",
        companySlug: car?.company?.slug || companySlug || "",
        carImage: car?.image || "",

        // อื่น ๆ
        passengers: passengers || "",
        promo: promo || "",
        ftype: ftype || "",
        confirmation: confirmationDoc,
        rental_id: rentalId,
      }).toString();

      router.push(`/payment/summary?${qp}`);
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          />
          {/* dialog */}
          <div className="relative z-10 w-full max-w-md rounded-2xl sm:rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              กรุณาเข้าสู่ระบบ
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              คุณต้องล็อกอินก่อนจึงจะดำเนินการชำระเงินได้
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300"
                onClick={() => setShowLoginModal(false)}
              >
                ปิด
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105"
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

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-2 sm:gap-3 md:gap-4 lg:gap-6 items-start w-full">
        <section className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300 hover:shadow-xl group hover:bg-white/15">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight group-hover:text-yellow-400 transition-colors duration-300">
            เลือกวิธีการชำระเงิน
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-1 group-hover:text-white transition-colors duration-300">
            โปรดเลือกวิธีชำระเงินเพื่อดำเนินการจองให้เสร็จสมบูรณ์
          </p>

          <div className="mt-3 sm:mt-4 md:mt-6 grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 w-full">
            <button
              type="button"
              onClick={() => setMethod("promptpay")}
              className={`text-left rounded-xl border p-2.5 sm:p-3 md:p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                method === "promptpay"
                  ? "border-yellow-400 ring-2 ring-yellow-400 bg-yellow-400/20 backdrop-blur-sm"
                  : "border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/40"
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold text-sm sm:text-base">
                  ฿
                </span>
                <div>
                  <div className="font-semibold text-white text-sm sm:text-base">
                    PromptPay
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300">
                    โอนผ่าน QR พร้อมเพย์ (อัปโหลดสลิป)
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMethod("visa")}
              className={`text-left rounded-xl border p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                method === "visa"
                  ? "border-yellow-400 ring-2 ring-yellow-400 bg-yellow-400/20 backdrop-blur-sm"
                  : "border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/40 font-bold text-white">
                  VISA
                </span>
                <div>
                  <div className="font-semibold text-white">
                    บัตรเครดิต / เดบิต
                  </div>
                  <div className="text-sm text-slate-300">
                    รองรับ Visa / Mastercard
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-8">
            {method === "promptpay" ? (
              <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm p-6">
                <h3 className="font-bold text-lg text-white mb-2">
                  ชำระเงินด้วย PromptPay
                </h3>
                <p className="text-sm text-slate-300 mb-4">
                  สแกน QR เพื่อชำระยอดมัดจำ จากนั้นอัปโหลดสลิปเพื่อยืนยัน
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-44 w-44 rounded-xl border border-white/20 grid place-items-center overflow-hidden bg-white/10 backdrop-blur-sm shadow-lg">
                    <div className="h-44 w-44 bg-white rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 bg-black rounded-lg grid grid-cols-8 gap-1 p-2">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-full h-full rounded-sm ${
                                Math.random() > 0.5 ? "bg-white" : "bg-black"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-2 font-mono">
                          QR Code
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <div className="text-sm text-slate-300 mb-2">
                      ยอดมัดจำที่ต้องชำระ
                    </div>
                    <div className="text-4xl font-bold text-white mb-4">
                      ฿500
                    </div>

                    <div>
                      <label className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 cursor-pointer text-white transition-all duration-300 hover:border-white/40">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            setSlip(f);
                          }}
                        />
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                        <span>อัปโหลดสลิป</span>
                      </label>
                      <p className="text-xs text-slate-400 mt-2">
                        รองรับ .jpg, .png (สูงสุด ~5MB)
                        {slip ? ` • ไฟล์: ${slip.name}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm p-6">
                <h3 className="font-bold text-lg text-white mb-2">
                  ชำระเงินด้วยบัตร
                </h3>
                <p className="text-sm text-slate-300 mb-4">
                  กรอกข้อมูลบัตรเครดิต/เดบิตของคุณให้ครบถ้วน
                </p>

                <div className="grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white">
                        เลขที่บัตร
                      </label>
                      <input
                        inputMode="numeric"
                        placeholder="4242 4242 4242 4242"
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-slate-200 hover:bg-white/20"
                        value={card.number}
                        onChange={(e) =>
                          setCard((c) => ({ ...c, number: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white">
                        ชื่อบนบัตร
                      </label>
                      <input
                        placeholder="NAME SURNAME"
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-slate-200 hover:bg-white/20"
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
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white">
                        วันหมดอายุ (MM/YY)
                      </label>
                      <input
                        placeholder="12/27"
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-slate-200 hover:bg-white/20"
                        value={card.exp}
                        onChange={(e) =>
                          setCard((c) => ({ ...c, exp: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white">
                        CVC
                      </label>
                      <input
                        inputMode="numeric"
                        placeholder="123"
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-slate-200 hover:bg-white/20"
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

            <div className="mt-4 sm:mt-5 md:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
              <Link
                href={`/booking/${encodeURIComponent(carId || "")}${tailQS}`}
                className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-center text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 text-sm sm:text-base flex-1 sm:flex-none"
              >
                กลับไปแก้ไขข้อมูลการจอง
              </Link>
              <button
                type="button"
                onClick={handlePay}
                disabled={submitting}
                className={`px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-xl text-black font-semibold transition-all duration-300 transform hover:scale-105 flex-1 sm:flex-none ${
                  submitting
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-400 shadow-lg hover:shadow-yellow-400/30"
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
        <aside className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8 h-fit md:sticky md:top-4 min-w-0 transition-all duration-300 hover:shadow-xl group hover:bg-white/15">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center group-hover:text-yellow-400 transition-colors duration-300">
            <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg mr-3 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-black"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            สรุปรายการจอง
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors duration-200">
              <span className="text-slate-300">รถ</span>
              <span className="font-medium text-white text-right max-w-[65%] break-all">
                {car?.name || "-"}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors duration-200">
              <span className="text-slate-300">รับรถ</span>
              <span className="text-white text-right max-w-[65%] break-all">
                {pickupLocation || "-"}
                <br className="hidden sm:block" />
                <span className="text-slate-300 text-xs">
                  {displayPick || "-"}
                </span>
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors duration-200">
              <span className="text-slate-300">คืนรถ</span>
              <span className="text-white text-right max-w-[65%] break-all">
                {dropoffLocation || "-"}
                <br className="hidden sm:block" />
                <span className="text-slate-300 text-xs">
                  {displayDrop || "-"}
                </span>
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors duration-200">
              <span className="text-slate-300">ชื่อผู้จอง</span>
              <span className="font-medium text-white text-right max-w-[65%] break-all">
                {customerData.name || "-"}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors duration-200">
              <span className="text-slate-300">ติดต่อ</span>
              <span className="text-white text-right max-w-[65%] break-all">
                {customerData.phone || "-"}
                <br className="hidden sm:block" />
                <span className="text-slate-300 text-xs">
                  {customerData.email || "-"}
                </span>
              </span>
            </div>

            <hr className="my-4 border-white/20" />

            <div className="flex justify-between items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors duration-200">
              <span className="text-slate-300">ราคาต่อวัน</span>
              <span className="font-medium text-white">฿{fmt(unitPrice)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors duration-200">
              <span className="text-slate-300">ราคารถรวม (x{dayCount})</span>
              <span className="font-medium text-white">฿{fmt(baseTotal)}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition-colors duration-200">
              <span className="text-slate-300">ราคามัดจำ</span>
              <span className="font-medium text-white">฿500</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 backdrop-blur-sm rounded-xl border border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-200">
              <span className="text-lg font-bold text-white">
                ยอดรวมทั้งหมด
              </span>
              <span className="text-xl font-bold text-yellow-400">
                ฿{fmt(total)}
              </span>
            </div>

            <hr className="my-4 border-white/20" />

            <div className="text-xs text-slate-300 whitespace-pre-wrap break-all p-3 bg-white/5 backdrop-blur-sm rounded-xl">
              หมายเหตุ: {note || "-"}
            </div>

            {isAdmin ? (
              <div className="text-xs font-semibold text-green-400 p-2 bg-green-400/20 backdrop-blur-sm rounded-lg">
                (Admin mode)
              </div>
            ) : null}

            {(passengers || promo || ftype || key) && (
              <div className="text-xs text-slate-300 space-y-1 break-all p-3 bg-white/5 backdrop-blur-sm rounded-xl">
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
