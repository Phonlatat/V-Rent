"use client";

import { useEffect, useMemo, useState } from "react";

/* ───────── helpers ───────── */
const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const s = String(val).trim();

  // รองรับ UNIX timestamp (วินาที/มิลลิวินาที)
  if (/^\d{10,13}$/.test(s)) {
    const ms = s.length === 13 ? Number(s) : Number(s) * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // ทำให้เป็น ISO-ish: เว้นวรรค -> 'T' และตัด microseconds ให้เหลือ 3 หลัก
  let isoish = s.includes("T") ? s : s.replace(" ", "T");
  isoish = isoish.replace(/\.(\d{3})\d+/, ".$1");

  let d = new Date(isoish);
  if (!isNaN(d.getTime())) return d;

  // Fallback: ประกอบ Date เอง (YYYY-MM-DD HH:mm:ss[.xxxxxx])
  const [datePart, timePart = ""] = s.split(/[ T]/);
  const [yy, mm = 1, dd = 1] = (datePart || "")
    .split("-")
    .map((n) => parseInt(n, 10));
  const [hh = 0, mi = 0, ssRaw = 0] = timePart.split(":");
  const ss = parseInt(String(ssRaw).split(".")[0] || "0", 10);

  d = new Date(
    yy,
    (parseInt(mm, 10) || 1) - 1,
    parseInt(dd, 10) || 1,
    parseInt(hh, 10) || 0,
    parseInt(mi, 10) || 0,
    ss || 0
  );
  return isNaN(d.getTime()) ? null : d;
};

const fmtDateTimeLocal = (val) => {
  const d = toDate(val);
  if (!d) return "-";
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const computeDays = (a, b) => {
  const A = toDate(a);
  const B = toDate(b);
  if (!A || !B) return 1;
  const diff = Math.ceil((B - A) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
};
const fmtBaht = (n) => Number(n || 0).toLocaleString("th-TH");

/* helper: normalize id compare */
const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

/* ───────── badges ───────── */
function PayBadge({ value }) {
  const v = String(value || "")
    .toLowerCase()
    .trim();
  if (v === "paid")
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
        ชำระแล้ว
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
      รอชำระ
    </span>
  );
}
function BookingBadge({ value }) {
  const v = String(value || "")
    .toLowerCase()
    .trim();
  const MAP = {
    confirmed: { label: "ยืนยันแล้ว", cls: "bg-sky-100 text-sky-800" },
    "waiting pickup": { label: "รอรับ", cls: "bg-amber-100 text-amber-800" },
    "pickup overdue": {
      label: "เลยกำหนดรับ",
      cls: "bg-rose-100 text-rose-800",
    },
    "in use": { label: "กำลังเช่า", cls: "bg-indigo-100 text-indigo-800" },
    "return overdue": {
      label: "เลยกำหนดคืน",
      cls: "bg-rose-100 text-rose-800",
    },
    cancelled: { label: "ยกเลิก", cls: "bg-slate-200 text-slate-700" },
    completed: { label: "เสร็จสิ้น", cls: "bg-violet-100 text-violet-800" },
  };
  const m = MAP[v] || {
    label: value || "-",
    cls: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

/* ───────── normalize record (แทนที่ทั้งฟังก์ชัน) ───────── */
function normalizeRental(rec) {
  const pickupTime =
    rec?.pickup_date ||
    rec?.pickup_time ||
    rec?.start_date ||
    rec?.start_time ||
    null;

  const returnTime =
    rec?.return_date ||
    rec?.dropoff_date ||
    rec?.end_date ||
    rec?.return_time ||
    null;

  const bookingCode =
    rec?.booking_code ||
    rec?.rental_no ||
    rec?.name ||
    rec?.id ||
    rec?.code ||
    "-";

  const customerName =
    rec?.customer_name ||
    rec?.customer ||
    `${rec?.customer_first_name ?? ""} ${
      rec?.customer_last_name ?? ""
    }`.trim() ||
    "-";

  const customerPhone =
    rec?.customer_phone || rec?.phone || rec?.mobile_no || rec?.mobile || "";

  const carName =
    rec?.vehicle || rec?.car_name || rec?.car || rec?.vehicle_name || "-";

  const carPlate = rec?.license_plate || rec?.car_plate || rec?.plate || "";

  const pricePerDay =
    Number(
      rec?.price_per_day ??
        rec?.daily_rate ??
        rec?.rate ??
        rec?.price ??
        rec?.base_price_per_day ??
        rec?.base_price ??
        0
    ) || 0;

  const discount = Number(rec?.discount ?? rec?.discount_amount ?? 0) || 0;
  const addon = Number(rec?.extras_total ?? rec?.additional_total ?? 0) || 0;

  const daysFallback = computeDays(pickupTime, returnTime);
  const totalComputed = pricePerDay * daysFallback + addon - discount;

  const total =
    Number(
      rec?.total_price ??
        rec?.grand_total ??
        rec?.net_total ??
        rec?.amount ??
        totalComputed
    ) || totalComputed;

  const payRaw = String(
    rec?.payment_status || rec?.pay_status || rec?.payment || ""
  ).toLowerCase();
  const paymentStatus = payRaw.includes("paid") ? "paid" : "";

  const bookingStatus = String(rec?.status || rec?.booking_status || "")
    .toLowerCase()
    .trim();

  return {
    id: bookingCode,
    bookingCode,
    customerName,
    customerPhone,
    carName,
    carPlate,
    pricePerDay,
    pickupTime,
    returnTime,
    paymentStatus,
    bookingStatus,
    discount,
    addon,
    total,
    pickupLocation: rec?.pickup_location || rec?.pickup_place || "",
    returnLocation: rec?.return_location || rec?.return_place || "",
    channel: rec?.contact_platform || rec?.source || "",
    docType: rec?.id_document_type || "",
    note: rec?.note || "",
    createdAt: rec?.creation || rec?.created_at || "",
  };
}

/* ───────── lifecycle (stage) ───────── */
function getLifecycle(row, now = new Date()) {
  const status = String(row.bookingStatus || "")
    .toLowerCase()
    .trim();
  const pickup = toDate(row.pickupTime);
  const drop = toDate(row.returnTime);

  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";

  if (status === "in use") {
    if (drop && now > drop) return "return overdue";
    return "in use";
  }
  if (status === "waiting pickup" || status === "confirmed") {
    if (pickup && now > pickup) return "pickup overdue";
    return "waiting pickup";
  }

  if (pickup && now > pickup) return "pickup overdue";
  if (drop && now > drop) return "return overdue";
  return status || "confirmed";
}

/* ───────── options ───────── */
const STATUS_OPTIONS = [
  { value: "", label: "ทั้งหมด" },
  { value: "waiting pickup", label: "รอรับ" },
  { value: "pickup overdue", label: "เลยกำหนดรับ" },
  { value: "in use", label: "กำลังเช่า" },
  { value: "return overdue", label: "เลยกำหนดคืน" },
  { value: "cancelled", label: "ยกเลิก" },
  { value: "completed", label: "เสร็จสิ้น" },
];

/* API mapping UI ↔ ERP strings */
const UI_TO_API_STATUS = {
  confirmed: "Confirmed",
  "waiting pickup": "Waiting Pickup",
  "pickup overdue": "Pickup Overdue",
  "in use": "In Use",
  "return overdue": "Return Overdue",
  cancelled: "Cancelled",
  completed: "Completed",
};
const API_TO_UI_STATUS = Object.fromEntries(
  Object.entries(UI_TO_API_STATUS).map(([k, v]) => [v.toLowerCase(), k])
);

/* ───────── Detail Modal ───────── */
function DetailModal({ open, data, onClose }) {
  if (!open || !data) return null;
  const days = computeDays(data.pickupTime, data.returnTime);

  const Row = ({ label, value, mono }) => (
    <div className="flex gap-2">
      <div className="w-24 shrink-0 text-[13px] text-slate-500">{label}</div>
      <div
        className={`text-[13px] ${
          mono ? "font-mono" : "text-slate-900"
        } text-black break-words`}
      >
        {value || "—"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-black">
            รายละเอียดการจอง — {data.bookingCode}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black">
            {/* ซ้าย: ลูกค้า/ระบบ */}
            <div className="space-y-1.5">
              <Row label="ลูกค้า:" value={data.customerName} />
              <Row label="โทร:" value={data.customerPhone} />
              <Row label="เอกสาร:" value={data.docType || "บัตรประชาชน"} />
              <Row label="ช่องทางจอง:" value={data.channel || "-"} />

              <Row
                label="ราคา/วัน:"
                value={`${fmtBaht(data.pricePerDay)} ฿`}
                mono
              />
              <Row label="วันเช่า:" value={`${days} วัน`} mono />
              <Row label="รวมสุทธิ:" value={`${fmtBaht(data.total)} ฿`} mono />
            </div>

            {/* ขวา: รถ/เวลา/สถานะ */}
            <div className="space-y-1.5">
              <Row label="รถ:" value={data.carName} />
              <Row label="ทะเบียน:" value={data.carPlate || "-"} />
              <Row
                label="รับรถ:"
                value={`${fmtDateTimeLocal(data.pickupTime)} (${
                  data.pickupLocation || "-"
                })`}
              />
              <Row
                label="คืนรถ:"
                value={`${fmtDateTimeLocal(data.returnTime)} (${
                  data.returnLocation || "-"
                })`}
              />
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-24 shrink-0 text-[13px] text-slate-500">
                  ชำระเงิน:
                </div>
                <PayBadge value={data.paymentStatus} />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 shrink-0 text-[13px] text-slate-500">
                  สถานะ:
                </div>
                <BookingBadge value={getLifecycle(data)} />
              </div>
            </div>
          </div>

          {/* หมายเหตุ */}
          <div className="mt-4">
            <div className="text-xs font-semibold text-black mb-1">
              หมายเหตุจากลูกค้า
            </div>
            <div className="w-full rounded-lg border border-slate-300 bg-gray-50 px-3 py-2 text-sm text-black">
              {data.note?.trim() ? data.note : "—"}
            </div>
          </div>

          {/* สลิป Mockup */}
          <div className="mt-4">
            <div className="text-xs font-semibold text-black mb-1">
              สลิปชำระเงิน (Mockup)
            </div>
            <div className="grid place-items-center h-44 border-2 border-dashed rounded-xl text-sm text-gray-400 select-none">
              — ยังไม่มีสลิป —
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-black hover:bg-slate-50"
            onClick={onClose}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

/* helper: แปลง Date → "YYYY-MM-DD HH:mm:ss" */
function toSQLDateTime(val) {
  const d = toDate(val);
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/* ───────── Edit Modal (เชื่อม API + reload → ❌, อัปเดตสถานะในที่เดียว) ───────── */
function EditModal({ open, data, carOptions = [], onClose, onSaved }) {
  const [form, setForm] = useState(data || {});
  const [receiptFile, setReceiptFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setForm(data || {});
    setReceiptFile(null);
    setErr("");
  }, [data]);

  if (!open) return null;
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handleSave = async () => {
    try {
      setSaving(true);
      setErr("");

      const fd = new FormData();
      fd.append("confirmation_document", form.docType || "");
      fd.append("customer_name", form.customerName || "");
      fd.append("customer_phone", form.customerPhone || "");
      fd.append("vehicle", form.carName || "");
      fd.append("base_price", String(form.pricePerDay ?? 0));
      fd.append("pickup_place", form.pickupLocation || "");
      fd.append("return_place", form.returnLocation || "");
      fd.append("pickup_date", toSQLDateTime(form.pickupTime));
      fd.append("return_date", toSQLDateTime(form.returnTime));
      fd.append("discount", String(form.discount ?? 0));
      fd.append("down_payment", "0");
      fd.append("contact_platform", form.channel || "");
      fd.append("additional_options", String(form.addon ?? ""));
      fd.append("remark", form.note || "");
      const days = computeDays(form.pickupTime, form.returnTime);
      const total =
        form.total ??
        (form.pricePerDay ?? 0) * days +
          (form.addon ?? 0) -
          (form.discount ?? 0);
      fd.append("total_price", String(total));
      if (receiptFile) {
        fd.append("receipt", receiptFile, receiptFile.name || "receipt.jpg");
      }
      fd.append("rid", form.bookingCode || form.id || "");
      fd.append(
        "status",
        UI_TO_API_STATUS[String(form.bookingStatus).toLowerCase()] ||
          "Confirmed"
      );
      fd.append(
        "payment_status",
        String(form.paymentStatus || "").toLowerCase() === "paid" ? "Paid" : ""
      );

      const res = await fetch(
        "https://demo.erpeazy.com/api/method/erpnext.api.edit_rental",
        { method: "POST", body: fd, credentials: "include" }
      );
      const text = await res.text();
      if (!res.ok) throw new Error(text || "อัปเดตไม่สำเร็จ");

      onSaved?.({ ...form, total });
      onClose?.();
      // ❌ ไม่ reload หน้า
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:bg-gray-100 disabled:text-gray-500";
  const labelCls = "text-xs font-semibold text-black mb-1";

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-black">แก้ไขการจอง</h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* รหัสจอง */}
          <div>
            <div className={labelCls}>รหัสจอง</div>
            <input
              value={form.bookingCode || ""}
              disabled
              className={inputCls}
            />
          </div>
          {/* เอกสาร */}
          <div>
            <div className={labelCls}>เอกสารยืนยัน</div>
            <select
              value={form.docType || "บัตรประชาชน"}
              onChange={(e) => set("docType", e.target.value)}
              className={inputCls}
            >
              {["บัตรประชาชน", "หนังสือเดินทาง", "ใบขับขี่"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* ลูกค้า */}
          <div>
            <div className={labelCls}>ชื่อลูกค้า</div>
            <input
              value={form.customerName || ""}
              onChange={(e) => set("customerName", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <div className={labelCls}>เบอร์โทร</div>
            <input
              value={form.customerPhone || ""}
              onChange={(e) => set("customerPhone", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* รถ */}
          <div>
            <div className={labelCls}>เลือกรถ</div>
            <select
              value={`${form.carName || ""}|${form.carPlate || ""}|${
                form.pricePerDay ?? 0
              }`}
              onChange={(e) => {
                const [name, plate, price] = e.target.value.split("|");
                set("carName", name);
                set("carPlate", plate);
                set("pricePerDay", Number(price || 0));
              }}
              className={inputCls}
            >
              {(Array.isArray(carOptions) ? carOptions : []).map((c) => (
                <option
                  key={`${c.name}|${c.plate}`}
                  value={`${c.name}|${c.plate}|${c.pricePerDay ?? 0}`}
                >
                  {`${c.name}${c.plate ? ` (${c.plate})` : ""} — ${fmtBaht(
                    c.pricePerDay ?? 0
                  )}฿/วัน`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className={labelCls}>ราคา/วัน (บาท)</div>
            <input
              type="number"
              value={form.pricePerDay ?? 0}
              onChange={(e) => set("pricePerDay", Number(e.target.value || 0))}
              className={inputCls}
            />
          </div>

          {/* สถานที่ */}
          <div>
            <div className={labelCls}>สถานที่รับรถ</div>
            <input
              value={form.pickupLocation || ""}
              onChange={(e) => set("pickupLocation", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <div className={labelCls}>สถานที่คืนรถ</div>
            <input
              value={form.returnLocation || ""}
              onChange={(e) => set("returnLocation", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* วันเวลา */}
          <div>
            <div className={labelCls}>วัน-เวลา รับรถ</div>
            <input
              type="datetime-local"
              value={(form.pickupTime || "").replace(" ", "T").slice(0, 16)}
              onChange={(e) => set("pickupTime", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <div className={labelCls}>วัน-เวลา คืนรถ</div>
            <input
              type="datetime-local"
              value={(form.returnTime || "").replace(" ", "T").slice(0, 16)}
              onChange={(e) => set("returnTime", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* ส่วนลด / ช่องทาง */}
          <div>
            <div className={labelCls}>ส่วนลด (บาท)</div>
            <input
              type="number"
              value={form.discount ?? 0}
              onChange={(e) => set("discount", Number(e.target.value || 0))}
              className={inputCls}
            />
          </div>
          <div>
            <div className={labelCls}>ช่องทาง</div>
            <input
              value={form.channel || ""}
              onChange={(e) => set("channel", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* สถานะ */}
          <div>
            <div className={labelCls}>สถานะชำระเงิน</div>
            <select
              value={form.paymentStatus || ""}
              onChange={(e) => set("paymentStatus", e.target.value)}
              className={inputCls}
            >
              <option value="">เสร็จสิ้น</option>
              <option value="paid">ชำระแล้ว</option>
            </select>
          </div>
          <div>
            <div className={labelCls}>สถานะการจอง</div>
            <select
              value={
                String(form.bookingStatus || "").toLowerCase() || "confirmed"
              }
              onChange={(e) => set("bookingStatus", e.target.value)}
              className={inputCls}
            >
              <option value="waiting pickup">รอรับ</option>
              <option value="pickup overdue">เลยกำหนดรับ</option>
              <option value="in use">กำลังเช่า</option>
              <option value="return overdue">เลยกำหนดคืน</option>
              <option value="cancelled">ยกเลิก</option>
              <option value="completed">เสร็จสิ้น</option>
            </select>
          </div>

          {/* หมายเหตุ */}
          <div className="md:col-span-2">
            <div className={labelCls}>หมายเหตุ</div>
            <textarea
              rows={4}
              value={form.note || ""}
              onChange={(e) => set("note", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* ไฟล์ */}
          <div className="md:col-span-2">
            <div className={labelCls}>สลิปโอนเงิน</div>
            <input
              type="file"
              className="block w-full text-sm text-slate-900"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            />
            {receiptFile && (
              <div className="mt-1 text-xs text-slate-600">
                เลือกไฟล์: <b>{receiptFile.name}</b>
              </div>
            )}
          </div>
        </div>

        {err && (
          <div className="px-5 text-sm text-rose-600">
            เกิดข้อผิดพลาด: {err}
          </div>
        )}

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3 text-black">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm"
            disabled={saving}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "กำลังบันทึก…" : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Compact List (มือถือ/จอเล็ก) ───────── */
function CompactList({
  rows,
  onOpenDetail,
  onEdit,
  onComplete,
  onCancel,
  onDelete,
  completingId,
  cancellingId,
  deletingId,
}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <div className="text-center text-gray-600 py-6">
        ไม่พบรายการที่ตรงกับตัวกรอง
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3">
      {rows.map((b) => {
        const days = computeDays(b.pickupTime, b.returnTime);
        const total = b.total ?? b.pricePerDay * days;
        const life = getLifecycle(b);

        return (
          <div
            key={b.id}
            className="rounded-lg border border-gray-200 p-3 bg-white text-black"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold break-words">{b.bookingCode}</div>
                <div className="text-sm text-gray-700 break-words">
                  {b.customerName} •{" "}
                  {(b.carName || "—") + " / " + (b.carPlate || "—")}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {fmtDateTimeLocal(b.pickupTime)} →{" "}
                  {fmtDateTimeLocal(b.returnTime)}
                </div>
                <div className="text-xs text-gray-500">
                  รวม {fmtBaht(total)} ฿
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <PayBadge value={life === "cancelled" ? "" : b.paymentStatus} />
                <BookingBadge value={life} />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => onEdit?.(b)}
                className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 hover:bg-gray-300"
              >
                แก้ไข
              </button>
              <button
                onClick={() => onOpenDetail?.(b)}
                className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 hover:bg-gray-300"
              >
                รายละเอียด
              </button>

              {(life === "in use" || life === "return overdue") && (
                <button
                  onClick={() => onComplete?.(b)}
                  disabled={completingId === b.bookingCode}
                  className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 hover:bg-gray-300 disabled:opacity-60"
                >
                  {completingId === b.bookingCode
                    ? "กำลังบันทึก…"
                    : "เสร็จสิ้น"}
                </button>
              )}

              <button
                onClick={() => onCancel?.(b)}
                disabled={cancellingId === b.bookingCode}
                className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 hover:bg-gray-300 disabled:opacity-60"
              >
                {cancellingId === b.bookingCode ? "กำลังยกเลิก…" : "ยกเลิก"}
              </button>

              <button
                onClick={() => onDelete?.(b)}
                disabled={deletingId === b.bookingCode}
                className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 hover:bg-gray-300 disabled:opacity-60"
                title="ลบรายการจองนี้"
              >
                {deletingId === b.bookingCode ? "กำลังลบ…" : "ลบ"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────── ตาราง ───────── */
export default function BookingsTable({
  bookings = [],
  carMapById = new Map(),
  carMapByKey = new Map(),
  onOpenDetail,
  onConfirmPickup,
  onComplete,
  onEdited,
  onDeleted, // ✅ แจ้ง parent เมื่อลบสำเร็จ (ถ้าส่งมา)
}) {
  const [remoteRows, setRemoteRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // action busy flags
  const [completingId, setCompletingId] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  // clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // fetch เมื่อไม่มี props
  useEffect(() => {
    if (Array.isArray(bookings) && bookings.length > 0) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(
          "https://demo.erpeazy.com/api/method/erpnext.api.get_rentals_overall",
          { method: "GET", credentials: "include", redirect: "follow" }
        );
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(text);
        }
        const list = Array.isArray(json?.message)
          ? json.message
          : Array.isArray(json)
          ? json
          : [];
        if (!ignore) setRemoteRows(list.map(normalizeRental));
      } catch (e) {
        if (!ignore) setErr(String(e?.message || e));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [bookings]);

  const rows = useMemo(() => {
    if (Array.isArray(bookings) && bookings.length > 0)
      return bookings.map(normalizeRental);
    return remoteRows;
  }, [bookings, remoteRows]);

  /* ฟิลเตอร์ */
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("");

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    return rows.filter((r) => {
      const texts = [
        r.bookingCode,
        r.customerName,
        r.customerPhone,
        r.carName,
        r.carPlate,
        r.pickupLocation,
        r.returnLocation,
        r.channel,
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      const okText = !key || texts.some((t) => t.includes(key));

      const stage = getLifecycle(r, now);
      const okStatus = !statusF || stage === statusF;
      return okText && okStatus;
    });
  }, [rows, q, statusF, now]);

  /* edit + detail modal states */
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  const carOptions = useMemo(() => {
    const temp = new Map();
    const push = (name, plate, price) => {
      const key = `${name}|${plate}`;
      if (!temp.has(key)) temp.set(key, { name, plate, pricePerDay: price });
    };
    rows.forEach((r) => push(r.carName, r.carPlate, r.pricePerDay));
    carMapByKey.forEach((v, k) =>
      push(v?.name || k, v?.plate || "", v?.pricePerDay || 0)
    );
    carMapById.forEach((v) =>
      push(v?.name || "", v?.plate || "", v?.pricePerDay || 0)
    );
    return [...temp.values()];
  }, [rows, carMapById, carMapByKey]);

  const openEdit = (row) => {
    setEditRow(row);
    setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);

  const applyEditedLocal = (newRec) => {
    onEdited?.(newRec);
    if (!(Array.isArray(bookings) && bookings.length > 0)) {
      setRemoteRows((prev) =>
        prev.map((r) =>
          r.id === newRec.id || r.bookingCode === newRec.bookingCode
            ? { ...r, ...newRec }
            : r
        )
      );
    }
  };

  const openDetail = (row) => {
    setDetailRow(row);
    setDetailOpen(true);
    onOpenDetail?.(row);
  };

  /* ---- handlers: API ---- */

  /* เปลี่ยนสถานะการเช่า (ERP API ใหม่) */
  const apiEditRentalStatus = async (vid, status) => {
    const res = await fetch(
      "https://demo.erpeazy.com/api/method/erpnext.api.edit_rentals_status",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        redirect: "follow",
        body: JSON.stringify({ vid: String(vid), status: String(status) }),
      }
    );
    const text = await res.text();
    if (!res.ok) throw new Error(text || "เปลี่ยนสถานะไม่สำเร็จ");
    return text;
  };

  const apiUpdateStatus = async ({ rid, status, payment }) => {
    const fd = new FormData();
    fd.append("rid", rid);
    if (status) fd.append("status", status); // "Completed" | "Cancelled" | ...
    if (typeof payment !== "undefined") fd.append("payment_status", payment); // "Paid" | ""
    const res = await fetch(
      "https://demo.erpeazy.com/api/method/erpnext.api.edit_rental",
      {
        method: "POST",
        body: fd,
        credentials: "include",
      }
    );
    const text = await res.text();
    if (!res.ok) throw new Error(text || "อัปเดตไม่สำเร็จ");
  };

  const handleComplete = async (b) => {
    try {
      if (!b?.bookingCode) return;
      setCompletingId(b.bookingCode);
      await apiUpdateStatus({
        rid: b.bookingCode,
        status: "Completed",
        payment: "Paid",
      });

      // แจ้ง parent ถ้ามี
      onComplete?.(b);

      // อัปเดตในตาราง (เมื่อใช้ remoteRows)
      if (!(Array.isArray(bookings) && bookings.length > 0)) {
        setRemoteRows((prev) =>
          prev.map((r) =>
            r.bookingCode === b.bookingCode
              ? { ...r, bookingStatus: "completed", paymentStatus: "paid" }
              : r
          )
        );
      }
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + (e?.message || e));
    } finally {
      setCompletingId("");
    }
  };

  const handleCancel = async (b) => {
    try {
      if (!b?.bookingCode) return;
      const ok = confirm(`คุณต้องการยกเลิกการจอง "${b.bookingCode}" หรือไม่?`);
      if (!ok) return;
      setCancellingId(b.bookingCode);

      // ใช้ API ใหม่ตามที่กำหนด
      await apiEditRentalStatus(b.bookingCode, "Cancelled");

      // อัปเดตในตารางให้แสดง "ยกเลิก" ทั้งคอลัมน์ชำระเงินและสถานะ
      if (!(Array.isArray(bookings) && bookings.length > 0)) {
        setRemoteRows((prev) =>
          prev.map((r) =>
            r.bookingCode === b.bookingCode
              ? { ...r, bookingStatus: "cancelled" }
              : r
          )
        );
      }
    } catch (e) {
      alert("ยกเลิกไม่สำเร็จ: " + (e?.message || e));
    } finally {
      setCancellingId("");
    }
  };

  const handleDelete = async (b) => {
    try {
      if (!b?.bookingCode) return;
      const ok = confirm(`ยืนยันลบการจอง "${b.bookingCode}" หรือไม่?`);
      if (!ok) return;

      setDeletingId(b.bookingCode);

      const headers = new Headers();
      headers.append("Content-Type", "application/json");

      const res = await fetch(
        "https://demo.erpeazy.com/api/method/erpnext.api.delete_rental",
        {
          method: "DELETE",
          headers,
          body: JSON.stringify({ rental_id: b.bookingCode }),
          credentials: "include",
          redirect: "follow",
        }
      );

      const text = await res.text();
      if (!res.ok) throw new Error(text || "ลบไม่สำเร็จ");

      // แจ้ง parent ถ้าคุม data ผ่าน props
      onDeleted?.(b);

      // ถ้าใช้ remoteRows ภายใน ให้ลบทันที
      if (!(Array.isArray(bookings) && bookings.length > 0)) {
        setRemoteRows((prev) =>
          prev.filter(
            (r) => r.bookingCode !== b.bookingCode && r.id !== b.bookingCode
          )
        );
      }
    } catch (e) {
      alert("ลบไม่สำเร็จ: " + (e?.message || e));
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-black">ตารางการจองของลูกค้า</h2>
        <span className="text-sm text-gray-600">
          แสดง {filtered.length} / {rows.length} รายการ
        </span>
      </div>

      {/* filter bar */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3 items-end">
        <div>
          <div className="text-xs font-semibold text-slate-700 mb-1">ค้นหา</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="รหัสจอง / ลูกค้า / รถ / ป้าย / สถานที่ / ช่องทาง…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-700 mb-1">
            สถานะการจอง
          </div>
          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            setQ("");
            setStatusF("");
          }}
          className="h-[38px] md:h-[40px] rounded-lg border border-slate-300 px-3 text-sm text-slate-900 hover:bg-slate-50"
        >
          ล้างตัวกรอง
        </button>
      </div>

      {loading && <div className="mt-4 text-gray-600">กำลังโหลด...</div>}
      {err && <div className="mt-4 text-red-600">เกิดข้อผิดพลาด: {err}</div>}

      {!loading && !err && (
        <>
          {/* จอเล็ก: แบบการ์ด (ไม่ต้องเลื่อนซ้าย-ขวา) */}
          <div className="mt-4 md:hidden">
            <CompactList
              rows={filtered}
              onOpenDetail={openDetail}
              onEdit={openEdit}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onDelete={handleDelete}
              completingId={completingId}
              cancellingId={cancellingId}
              deletingId={deletingId}
            />
          </div>

          {/* จอ md ขึ้นไป: ตารางพอดีหน้าต่าง ไม่มี min-width/overflow */}
          <div className="mt-4 hidden md:block">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">รับ → คืน</th>
                  <th className="py-2 pr-3">รหัสจอง</th>
                  <th className="py-2 pr-3">ลูกค้า</th>
                  <th className="py-2 pr-3">รถ/ทะเบียน</th>
                  <th className="py-2 pr-3 text-right hidden lg:table-cell">
                    ราคา/วัน
                  </th>
                  <th className="py-2 pr-3 text-right hidden lg:table-cell">
                    วันเช่า
                  </th>
                  <th className="py-2 pr-3 text-right">รวมสุทธิ</th>
                  <th className="py-2 pr-3">ชำระเงิน</th>
                  <th className="py-2 pr-3">สถานะ</th>
                  <th className="py-2 pr-3">การจัดการ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => {
                  const days = computeDays(b.pickupTime, b.returnTime);
                  const total = b.total ?? b.pricePerDay * days;
                  const life = getLifecycle(b, now);

                  return (
                    <tr key={b.id} className="align-top">
                      {/* รับ → คืน */}
                      <td className="py-3 pr-3 text-black break-words">
                        <div>{fmtDateTimeLocal(b.pickupTime)}</div>
                        <div className="text-xs text-gray-500">
                          → {fmtDateTimeLocal(b.returnTime)}
                        </div>
                      </td>

                      {/* รหัส/ลูกค้า/รถ */}
                      <td className="py-3 pr-3 font-medium text-black break-words">
                        {b.bookingCode}
                      </td>
                      <td className="py-3 pr-3 text-black break-words">
                        <div>{b.customerName}</div>
                        <div className="text-xs text-gray-500">
                          {b.customerPhone}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-black break-words">
                        {(b.carName || "—") + " / " + (b.carPlate || "—")}
                      </td>

                      {/* ราคา/วัน / วันเช่า / รวมสุทธิ */}
                      <td className="py-3 pr-3 text-right text-black whitespace-nowrap font-mono tabular-nums hidden lg:table-cell">
                        {fmtBaht(b.pricePerDay)}&nbsp;฿
                      </td>
                      <td className="py-3 pr-3 text-right text-black whitespace-nowrap font-mono tabular-nums hidden lg:table-cell">
                        {days}&nbsp;วัน
                      </td>
                      <td className="py-3 pr-3 text-right text-black whitespace-nowrap font-mono tabular-nums">
                        {fmtBaht(total)}&nbsp;฿
                      </td>

                      {/* ชำระ/สถานะ */}
                      <td className="py-3 pr-3 text-black">
                        {life === "cancelled" ? (
                          <BookingBadge value="cancelled" />
                        ) : (
                          <PayBadge value={b.paymentStatus} />
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <BookingBadge value={life} />
                      </td>

                      {/* การจัดการ */}
                      <td className="py-3 pr-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => openEdit(b)}
                            className="inline-flex shrink-0 rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 text-black hover:bg-gray-300"
                          >
                            แก้ไข
                          </button>

                          <button
                            onClick={() => openDetail(b)}
                            className="inline-flex shrink-0 rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 text-black hover:bg-gray-300"
                          >
                            รายละเอียด
                          </button>

                          {(life === "in use" || life === "return overdue") && (
                            <button
                              onClick={() => handleComplete(b)}
                              disabled={completingId === b.bookingCode}
                              className="inline-flex shrink-0 rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 text-black hover:bg-gray-300 disabled:opacity-60"
                            >
                              {completingId === b.bookingCode
                                ? "กำลังบันทึก…"
                                : "เสร็จสิ้น"}
                            </button>
                          )}

                          <button
                            onClick={() => handleCancel(b)}
                            disabled={cancellingId === b.bookingCode}
                            className="inline-flex shrink-0 rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 text-black hover:bg-gray-300 disabled:opacity-60"
                          >
                            {cancellingId === b.bookingCode
                              ? "กำลังยกเลิก…"
                              : "ยกเลิก"}
                          </button>

                          <button
                            onClick={() => handleDelete(b)}
                            disabled={deletingId === b.bookingCode}
                            className="inline-flex shrink-0 rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 text-black hover:bg-gray-300 disabled:opacity-60"
                            title="ลบรายการจองนี้"
                          >
                            {deletingId === b.bookingCode ? "กำลังลบ…" : "ลบ"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-gray-600">
                      ไม่พบรายการที่ตรงกับตัวกรอง
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modals */}
      <EditModal
        open={editOpen}
        data={editRow}
        carOptions={carOptions}
        onClose={closeEdit}
        onSaved={applyEditedLocal}
      />
      <DetailModal
        open={detailOpen}
        data={detailRow}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}

/* เผื่อไฟล์หน้าอื่น import แบบ named */
export { BookingsTable };
