// components/admin/DeliveriesTable.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { fmtDateTimeLocal } from "./utils";

/* ===== Helpers ===== */
const IMG_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.150.243.195";
const normalizeImage = (u) => {
  if (!u) return "";
  let s = String(u).trim();
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("/")) s = IMG_BASE.replace(/\/+$/, "") + s;
  if (!/^https?:\/\//i.test(s))
    s = IMG_BASE.replace(/\/+$/, "") + "/" + s.replace(/^\/+/, "");
  return encodeURI(s);
};
const toArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return String(v)
    .split(/[,;]\s*|\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);
};
const norm = (s) =>
  s
    ? String(s)
        .toLowerCase()
        .replace(/[\s-]+/g, "")
    : "";

/** แปลง "YYYY-MM-DD HH:mm:ss" -> ISO; ถ้าเป็น ISO อยู่แล้วก็ใช้ได้เลย */
const toISO = (v) => {
  if (!v) return null;
  const s = String(v).trim();
  const guess = s.includes(" ") ? s.replace(" ", "T") : s;
  const d = new Date(guess);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const isSameDay = (iso, ymd) => {
  if (!iso || !ymd) return true;
  const d = new Date(iso);
  const [y, m, dd] = ymd.split("-").map((n) => parseInt(n, 10));
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === dd;
};

/* ===== Component ===== */
export default function DeliveriesTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // filters
  const [q, setQ] = useState("");
  const [date, setDate] = useState(""); // YYYY-MM-DD

  // deleting state
  const [deletingId, setDeletingId] = useState(""); // เก็บ dlv_id ที่กำลังลบ

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErr("");
      try {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");

        const res = await fetch(
          "http://203.150.243.195/api/method/erpnext.api.get_dlv",
          {
            method: "GET",
            headers,
            credentials: "include",
            redirect: "follow",
          }
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

        const mapped = list.map((rec) => {
          // ---- fields จาก API หลายรูปแบบ ----
          const customerName =
            rec?.customer_name ||
            rec?.customer ||
            `${rec?.customer_first_name ?? ""} ${
              rec?.customer_last_name ?? ""
            }`.trim() ||
            "-";

          const customerPhone =
            rec?.customer_phone ||
            rec?.customer_tel ||
            rec?.phone ||
            rec?.mobile_no ||
            "";

          const pickupRaw =
            rec?.pickup_time ||
            rec?.delivery_time ||
            rec?.pickup_at ||
            rec?.pickup_date ||
            null;
          const pickupTime = toISO(pickupRaw);

          const loggedAt =
            toISO(rec?.creation) ||
            toISO(rec?.created_at) ||
            toISO(rec?.modified);

          const carName =
            rec?.car_name ||
            rec?.vehicle_name ||
            rec?.vehicle ||
            rec?.car ||
            "-";
          const carPlate =
            rec?.car_plate || rec?.license_plate || rec?.plate || "";

          const pickupLocation =
            rec?.pickup_location_name ||
            rec?.pickup_location ||
            rec?.pickup_place ||
            rec?.location ||
            "-";
          const pickupLocCode =
            rec?.pickup_location_code || rec?.pickup_loc_code || "";
          const pickupLocationFull = pickupLocCode
            ? `${pickupLocation} (${pickupLocCode})`
            : pickupLocation;

          const returnLocation =
            rec?.return_location_name ||
            rec?.return_location ||
            rec?.return_place ||
            rec?.return_loc ||
            "-";

          const returnTime =
            toISO(rec?.return_time) ||
            toISO(rec?.return_at) ||
            toISO(rec?.return_date);

          const fuelLevel =
            rec?.fuel_level_label || rec?.fuel_level || rec?.fuel || undefined;

          const odometer =
            rec?.odometer || rec?.odo || rec?.mileage || rec?.mile || undefined;

          const idImages = toArray(
            rec?.id_images ||
              rec?.images_id ||
              rec?.proof_id ||
              rec?.confirm_proofs
          );
          const carImages = toArray(
            rec?.car_images ||
              rec?.images_car ||
              rec?.proof_car ||
              rec?.car_proofs
          );
          const slipImages = toArray(
            rec?.slip_images ||
              rec?.images_slip ||
              rec?.payment_slip ||
              rec?.slip_proofs ||
              rec?.slips
          );

          return {
            // คีย์ภายใน
            id: rec?.name || rec?.id || "-",
            // ใช้ค่านี้เป็น dlv_id ในการลบ (fallback เป็น id)
            deliveryCode:
              rec?.delivery_code || rec?.dlv_code || rec?.name || "-",

            // ตาราง
            bookingCode:
              rec?.booking_code ||
              rec?.booking ||
              rec?.bookingCode ||
              rec?.rental_no ||
              "-",
            customerName,
            customerPhone,
            carName,
            carPlate,
            pickupTime,
            loggedAt,
            pickupLocation: pickupLocationFull,
            staff:
              rec?.delivery_staff ||
              rec?.staff ||
              rec?.employee ||
              rec?.owner ||
              "-",
            idImgCount:
              typeof rec?.confirm_proofs_count === "number"
                ? rec.confirm_proofs_count
                : idImages.length,
            carImgCount:
              typeof rec?.car_proofs_count === "number"
                ? rec.car_proofs_count
                : carImages.length,
            slipImgCount:
              typeof rec?.slip_proofs_count === "number"
                ? rec.slip_proofs_count
                : slipImages.length,

            // Modal
            idDocType:
              rec?.id_doc_type || rec?.identity_doc || rec?.document || "",
            rentalTerm: rec?.rental_term || rec?.rental_condition || "",
            note: rec?.note || rec?.remark || rec?.remarks || "",
            returnLocation,
            returnTime,
            fuelLevel,
            odometer,
            idImages,
            carImages,
            slipImages,
          };
        });

        setRows(mapped);
      } catch (e) {
        console.error(e);
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ===== Filtering ===== */
  const filtered = useMemo(() => {
    const key = norm(q);
    return rows.filter((r) => {
      const matchText =
        !key ||
        [
          r.deliveryCode,
          r.bookingCode,
          r.customerName,
          r.customerPhone,
          r.carName,
          r.carPlate,
          r.pickupLocation,
          r.staff,
        ]
          .map(norm)
          .some((t) => t.includes(key));
      const matchDate = isSameDay(r.pickupTime, date);
      return matchText && matchDate;
    });
  }, [rows, q, date]);

  /* ===== Modal keyboard/scroll lock ===== */
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  /* ===== Delete Handler ===== */
  const handleDelete = async (row) => {
    const dlvId =
      row?.deliveryCode && row.deliveryCode !== "-"
        ? row.deliveryCode
        : row?.id;

    if (!dlvId) {
      setErr("ไม่พบรหัสส่งมอบ (dlv_id) สำหรับการลบ");
      return;
    }

    const ok = window.confirm(
      `ยืนยันลบรายการส่งมอบ ${dlvId} ?\nการลบจะไม่สามารถย้อนกลับได้`
    );
    if (!ok) return;

    setErr("");
    setDeletingId(dlvId);
    try {
      const headers = new Headers();
      headers.append("Content-Type", "application/json");

      const res = await fetch(
        "http://203.150.243.195/api/method/erpnext.api.delete_dlv",
        {
          method: "DELETE",
          headers,
          credentials: "include",
          body: JSON.stringify({ dlv_id: dlvId }),
          redirect: "follow",
        }
      );

      const text = await res.text();
      // พยายาม parse เผื่อ backend ส่ง json กลับ
      let payload = null;
      try {
        payload = JSON.parse(text);
      } catch {
        /* not json, ignore */
      }

      if (!res.ok) {
        // ถ้า backend ส่งข้อความ error มากับ body
        const msg =
          payload?.message || payload?.exc || text || "ลบไม่สำเร็จ (unknown)";
        throw new Error(msg);
      }

      // ลบสำเร็จ → เอาออกจาก state
      setRows((prev) =>
        prev.filter((r) => {
          const idCompare =
            r.deliveryCode && r.deliveryCode !== "-" ? r.deliveryCode : r.id;
          return idCompare !== dlvId;
        })
      );
    } catch (e) {
      console.error(e);
      setErr(`ลบไม่สำเร็จ: ${String(e.message || e)}`);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-black">
          บันทึกส่งมอบ (Delivery Logs)
        </h2>
        <div className="text-sm text-gray-600">
          ทั้งหมด {rows.length} รายการ
        </div>
      </div>

      {/* filters */}
      <div className="mt-3 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            placeholder="รหัสส่งมอบ/รหัสจอง/ลูกค้า/รถ/ป้าย/สถานที่/พนักงาน..."
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            placeholder="dd/mm/yyyy"
          />
          <button
            type="button"
            onClick={() => {
              setQ("");
              setDate("");
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 text-black"
          >
            ล้างตัวกรอง
          </button>
        </div>
        <div className="md:ml-auto text-sm text-gray-600">
          แสดง {filtered.length} จาก {rows.length} รายการ
        </div>
      </div>

      {loading && <div className="mt-4 text-gray-600">กำลังโหลด...</div>}
      {err && <div className="mt-4 text-red-600">เกิดข้อผิดพลาด: {err}</div>}

      {!loading && !err && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="text-left text-black">
                <th className="py-2 pr-4">วันที่/เวลา</th>
                <th className="py-2 pr-4">รหัสส่งมอบ</th>
                <th className="py-2 pr-4">รหัสจอง</th>
                <th className="py-2 pr-4">ลูกค้า</th>
                <th className="py-2 pr-4">รถ/ทะเบียน</th>
                <th className="py-2 pr-4">สถานที่รับ</th>
                <th className="py-2 pr-4">พนักงาน</th>
                <th className="py-2 pr-4">รูป</th>
                <th className="py-2 pr-2">จัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-black">
              {filtered.map((d) => {
                const dlvId =
                  d.deliveryCode && d.deliveryCode !== "-"
                    ? d.deliveryCode
                    : d.id;
                const isDeleting = deletingId === dlvId;

                return (
                  <tr key={`${d.id}-${dlvId}`} className="align-top">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <div className="font-medium">
                        {d.pickupTime ? fmtDateTimeLocal(d.pickupTime) : "-"}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        บันทึก:{" "}
                        {d.loggedAt ? fmtDateTimeLocal(d.loggedAt) : "-"}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-black">
                        {d.deliveryCode}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{d.bookingCode}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{d.customerName}</div>
                      {d.customerPhone && (
                        <div className="text-xs text-gray-600 mt-0.5">
                          {d.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{d.carName}</div>
                      {d.carPlate && (
                        <div className="text-xs text-gray-600 mt-0.5">
                          {d.carPlate}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{d.pickupLocation}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{d.staff}</div>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <div className="font-medium">
                        ID: {d.idImgCount} / CAR: {d.carImgCount} / SLIP:{" "}
                        {d.slipImgCount ?? 0}
                      </div>
                    </td>

                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelected(d);
                            setOpen(true);
                          }}
                          className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 text-black hover:bg-gray-300"
                        >
                          เปิดดู
                        </button>

                        <button
                          onClick={() => handleDelete(d)}
                          disabled={isDeleting}
                          className={`rounded-lg border border-gray-300 px-3 py-1.5 ${
                            isDeleting
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gray-200 text-black hover:bg-gray-300"
                          }`}
                          title="ลบรายการส่งมอบนี้"
                        >
                          {isDeleting ? "กำลังลบ…" : "ลบ"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-600">
                    ไม่พบรายการที่ตรงกับตัวกรอง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Inline Modal ===== */}
      {open && selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative bg-white w>[min(980px,92vw)] max-h-[90vh] rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            style={{ width: "min(980px,92vw)" }}
          >
            {/* header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-black">
                รายละเอียดส่งมอบ — {selected.deliveryCode} (
                {selected.bookingCode})
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600"
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>

            {/* body */}
            <div
              className="p-5 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 56px)" }}
            >
              {/* สรุป 2 คอลัมน์ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-6 text-black">
                <div>
                  <div>
                    ลูกค้า:{" "}
                    <span className="font-semibold">
                      {selected.customerName || "-"}
                    </span>
                  </div>
                  <div>โทร: {selected.customerPhone || "-"}</div>
                  <div>เอกสารที่ใช้: {selected.idDocType || "-"}</div>
                  <div>พนักงานบันทึก: {selected.staff || "-"}</div>
                  <div>
                    บันทึกเมื่อ:{" "}
                    {selected.loggedAt
                      ? fmtDateTimeLocal(selected.loggedAt)
                      : "-"}
                  </div>
                </div>
                <div>
                  <div>
                    รถ:{" "}
                    <span className="font-semibold">
                      {selected.carName || "-"}
                    </span>
                    {selected.carPlate ? ` / ${selected.carPlate}` : ""}
                  </div>
                  <div>สถานที่ส่งมอบ: {selected.pickupLocation || "-"}</div>
                  <div>
                    วัน–เวลาส่งมอบ:{" "}
                    {selected.pickupTime
                      ? fmtDateTimeLocal(selected.pickupTime)
                      : "-"}
                  </div>
                  <div>สถานที่คืน: {selected.returnLocation || "-"}</div>
                  <div>
                    วัน–เวลาคืน:{" "}
                    {selected.returnTime
                      ? fmtDateTimeLocal(selected.returnTime)
                      : "-"}
                  </div>
                  <div>เลขไมล์: {selected.odometer ?? "-"}</div>
                </div>
              </div>

              {/* หมายเหตุ */}
              <div className="mt-5 bg-white rounded-xl border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-200 text-sm font-semibold text-black">
                  หมายเหตุ
                </div>
                <div className="p-4 text-sm text-black whitespace-pre-wrap">
                  {selected.note?.trim() ? selected.note : "—"}
                </div>
              </div>

              {/* รูปหลักฐาน */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* ID Proofs */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-4 py-2 border-b border-gray-200 text-sm font-semibold text-black">
                    รูปเอกสารยืนยัน (ID Proofs)
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {(selected.idImages || []).length === 0 && (
                      <div className="col-span-2 text-sm text-gray-500">
                        ไม่มีรูป
                      </div>
                    )}
                    {(selected.idImages || []).map((u, i) => {
                      const src = normalizeImage(u);
                      if (!src) return null;
                      return (
                        <a
                          key={i}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-gray-200 overflow-hidden hover:shadow"
                          title="เปิดรูปเต็ม"
                        >
                          <img
                            src={src}
                            alt={`id-${i + 1}`}
                            className="w-full h-36 object-cover bg-gray-100"
                            loading="lazy"
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* Car Proofs */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-4 py-2 border-b border-gray-200 text-sm font-semibold text-black">
                    รูปสภาพรถ (Car Proofs)
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {(selected.carImages || []).length === 0 && (
                      <div className="col-span-2 text-sm text-gray-500">
                        ไม่มีรูป
                      </div>
                    )}
                    {(selected.carImages || []).map((u, i) => {
                      const src = normalizeImage(u);
                      if (!src) return null;
                      return (
                        <a
                          key={i}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-gray-200 overflow-hidden hover:shadow"
                          title="เปิดรูปเต็ม"
                        >
                          <img
                            src={src}
                            alt={`car-${i + 1}`}
                            className="w-full h-36 object-cover bg-gray-100"
                            loading="lazy"
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* Slip Proofs */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-4 py-2 border-b border-gray-200 text-sm font-semibold text-black">
                    สลิปโอนยอดเต็ม (Slip Proofs)
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {(selected.slipImages || []).length === 0 && (
                      <div className="col-span-2 text-sm text-gray-500">
                        ไม่มีรูป
                      </div>
                    )}
                    {(selected.slipImages || []).map((u, i) => {
                      const src = normalizeImage(u);
                      if (!src) return null;
                      return (
                        <a
                          key={i}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-gray-200 overflow-hidden hover:shadow"
                          title="เปิดรูปเต็ม"
                        >
                          <img
                            src={src}
                            alt={`slip-${i + 1}`}
                            className="w-full h-36 object-cover bg-gray-100"
                            loading="lazy"
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* footer */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 text-black hover:bg-gray-300"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ===== /Modal ===== */}
    </div>
  );
}
