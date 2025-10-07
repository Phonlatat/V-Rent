// components/admin/Badges.jsx
// console.log("Badges.jsx loaded v2 - has inrent & booked mapping");
import { cls } from "./utils";

/** ----- Dictionary ไทย <-> อังกฤษ (canonical = อังกฤษ) ----- */
const EN_TH = {
  // Car status
  available: "ว่าง",
  "in rent": "ถูกจอง",
  "in use": "ถูกยืมอยู่",
  maintenance: "ซ่อมบำรุง",
  "pending delivery": "รอส่ง",
  "pickup overdue": "เลยกำหนดรับ",
  "return overdue": "เลยกำหนดส่ง",
  // Booking status
  confirmed: "ยืนยันแล้ว",
  "waiting pickup": "รอรับ",
  cancelled: "ยกเลิก",
  completed: "เสร็จสิ้น",
  // Payment status
  paid: "ชำระแล้ว",
  "partial paid": "มัดจำแล้ว", // ✅ เพิ่ม
};

const TH_EN = {
  // Car
  ว่าง: "available",
  ถูกยืมอยู่: "in use",
  ถูกจอง: "in rent",
  ซ่อมบำรุง: "maintenance",
  ซ่อมแซม: "maintenance",
  รอส่ง: "pending delivery",
  เลยกำหนดรับ: "pickup overdue",
  เลยกำหนดส่ง: "return overdue",
  // Booking
  ยืนยันแล้ว: "confirmed",
  รอรับ: "waiting pickup",
  กำลังเช่า: "in use",
  เลยกำหนดคืน: "return overdue",
  ยกเลิก: "cancelled",
  เสร็จสิ้น: "completed",
  // Payment
  ชำระแล้ว: "paid",
  มัดจำแล้ว: "partial paid", // ✅ เพิ่ม
};

const lc = (s = "") => String(s).trim().toLowerCase().replace(/\s+/g, " ");
const normalize = (s = "") => lc(s).replace(/[_-]+/g, " ");

function canonical(raw = "") {
  const x = normalize(raw);
  if (TH_EN[x]) return TH_EN[x];

  // Car status EN variants
  if (x === "in rent" || x === "inrent") return "in rent";
  if (x === "rented") return "in use";
  if (x === "reserved" || x === "booked") return "in rent";
  if (x === "overdue pickup") return "pickup overdue";
  if (x === "overdue return") return "return overdue";
  if (x === "maintainance") return "maintenance";

  // Payment variants/synonyms
  if (
    [
      "partial",
      "partialpaid",
      "partially paid",
      "deposit",
      "deposit paid",
    ].includes(x)
  )
    return "partial paid"; // ✅ map มัดจำ

  // คีย์ที่เราจะ “ตัดออก” ถ้ามาเป็นสถานะนี้
  if (["pending payment", "pending", "unpaid"].includes(x))
    return "pending payment";
  return x;
}

function toEnglish(v = "") {
  return canonical(v);
}
function toThai(v = "") {
  const en = canonical(v);
  return EN_TH[en] || v || "";
}

function isRemovedStatus(v = "") {
  return canonical(v) === "pending payment";
}

function colorForStatus(en) {
  switch (en) {
    case "available":
      return "bg-green-100 text-green-800";
    case "in rent":
      return "bg-cyan-100 text-cyan-800";
    case "in use":
      return "bg-red-100 text-red-800";
    case "maintenance":
      return "bg-amber-100 text-amber-800";
    case "pending delivery":
      return "bg-blue-100 text-blue-800";
    case "pickup overdue":
      return "bg-orange-100 text-orange-800";
    case "return overdue":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}
function colorForBooking(en) {
  switch (en) {
    case "confirmed":
    case "waiting pickup":
      return "bg-emerald-100 text-emerald-800";
    case "in use":
      return "bg-indigo-100 text-indigo-800";
    case "pickup overdue":
    case "return overdue":
      return "bg-rose-100 text-rose-800";
    case "completed":
      return "bg-sky-100 text-sky-800";
    case "cancelled":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}
function colorForPayment(en) {
  switch (en) {
    case "paid":
      return "bg-emerald-100 text-emerald-800";
    case "partial paid":
      return "bg-amber-100 text-amber-800"; // ✅ สีเหลือง = มัดจำแล้ว
    case "completed":
      return "bg-sky-100 text-sky-800";
    case "cancelled":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/* -------------------- Car Status Badge -------------------- */
export const StatusBadge = ({ value, display = "th" }) => {
  if (isRemovedStatus(value)) return null;
  const en = toEnglish(value);
  const label = display === "en" ? en : toThai(en);
  const color = colorForStatus(en);
  return (
    <span
      className={cls(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        color
      )}
    >
      {label || "-"}
    </span>
  );
};

/* -------------------- Booking Badge -------------------- */
export const BookingBadge = ({ value, display = "th" }) => {
  if (isRemovedStatus(value)) return null;
  const en = toEnglish(value);
  const label = display === "en" ? en : toThai(en);
  const color = colorForBooking(en);
  return (
    <span
      className={cls(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        color
      )}
    >
      {label || "-"}
    </span>
  );
};

/* -------------------- Payment Badge -------------------- */
export const PayBadge = ({ value, display = "th" }) => {
  if (isRemovedStatus(value)) return null;
  const en = toEnglish(value);
  const label = display === "en" ? en : toThai(en);
  const color = colorForPayment(en);
  return (
    <span
      className={cls(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        color
      )}
    >
      {label || "-"}
    </span>
  );
};
