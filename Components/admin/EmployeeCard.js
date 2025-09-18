// components/admin/EmployeeCard.jsx
"use client";

import { useEffect, useState } from "react";

/** ================== ERP CONFIG ================== */
const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "https://demo.erpeazy.com";
const RENTAL_ENDPOINTS = [
  "/api/method/erpnext.api.get_rentals_today",
  "/api/method/erpnext.api.get_rentals_overall",
  "/api/method/erpnext.api.get_rentals",
];

export default function EmployeeCard({ userId = "" }) {
  const [employee, setEmployee] = useState({
    id: "-",
    name: "-",
    role: "-",
    status: "-",
    phone: "-",
    email: "-",
    branch: "-",
    shift: "-",
    startDate: "-",
    lastLogin: "-",
  });

  const [todaySummary, setTodaySummary] = useState({
    pickups: 0, // ต้องนำส่งวันนี้
    pickupsDone: 0, // นำส่งแล้ว
    returns: 0, // ต้องรับคืนวันนี้
    returnsDone: 0, // ส่งคืนแล้ว
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");

        const effectiveUserId =
          userId ||
          (typeof window !== "undefined"
            ? localStorage.getItem("vrent_user_id") || ""
            : "");

        if (!effectiveUserId) {
          setError("ไม่พบ user_id สำหรับเรียกข้อมูลพนักงาน");
          setLoading(false);
          return;
        }

        /** 1) ข้อมูลพนักงาน */
        const u = new URL(`${ERP_BASE}/api/method/erpnext.api.get_admin`);
        u.searchParams.set("user_id", effectiveUserId);

        const resEmp = await fetch(u.toString(), {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });
        if (!resEmp.ok) {
          if (resEmp.status === 403)
            throw new Error("คุณไม่มีสิทธิ์ดึงข้อมูลพนักงาน (403)");
          throw new Error(`เกิดข้อผิดพลาด (HTTP ${resEmp.status})`);
        }
        const empJson = await resEmp.json();
        const msg = empJson?.message;
        let mapped = {};
        if (Array.isArray(msg)) {
          const [
            full_name,
            phone,
            branch,
            status,
            start_date,
            last_login,
            role,
          ] = msg;
          mapped = {
            id: "-",
            name: full_name ?? "-",
            role: role ?? "-",
            status: status ?? "-",
            phone: phone ?? "-",
            email: effectiveUserId,
            branch: branch ?? "-",
            shift: "-",
            startDate: start_date ?? "-",
            lastLogin: last_login ?? "-",
          };
        } else if (msg && typeof msg === "object") {
          mapped = {
            id: msg.employee_id || msg.id || "-",
            name: msg.full_name || msg.name || "-",
            role: msg.role || "-",
            status: msg.status || "-",
            phone: msg.phone || "-",
            email: msg.email || effectiveUserId || "-",
            branch: msg.branch || "-",
            shift: msg.shift || "-",
            startDate: msg.start_date || msg.startDate || "-",
            lastLogin: msg.last_login || msg.lastLogin || "-",
          };
        } else {
          throw new Error("รูปแบบข้อมูลพนักงานไม่ถูกต้อง");
        }
        setEmployee(mapped);

        /** 2) ดึงงานวันนี้ (ลองหลาย endpoint) */
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        const ymd = `${y}-${m}-${d}`;

        let bookingsRaw = null;
        let summaryFromApi = null;

        for (const path of RENTAL_ENDPOINTS) {
          try {
            const url = new URL(`${ERP_BASE}${path}`);
            url.searchParams.set("date", ymd);
            url.searchParams.set("from_date", ymd);
            url.searchParams.set("to_date", ymd);

            const r = await fetch(url.toString(), {
              method: "GET",
              credentials: "include",
              signal: controller.signal,
            });
            if (!r.ok) continue;

            const j = await r.json();
            const payload = j?.message ?? j?.data ?? j?.result;

            const maybe = extractCounts(payload);
            if (maybe) {
              summaryFromApi = maybe;
              break;
            }

            if (Array.isArray(payload)) {
              bookingsRaw = payload;
              break;
            }
          } catch {
            /* ลอง endpoint ถัดไป */
          }
        }

        if (summaryFromApi) {
          setTodaySummary(summaryFromApi);
        } else {
          const bookings = normalizeBookings(bookingsRaw || []);

          const isToday = (dt) => {
            if (!dt) return false;
            const t = new Date(dt);
            return (
              t.getFullYear() === today.getFullYear() &&
              t.getMonth() === today.getMonth() &&
              t.getDate() === today.getDate()
            );
          };

          const S = (b) =>
            String(b.status || "")
              .toLowerCase()
              .trim();
          const isCanceled = (b) => /cancel/.test(S(b));
          const isInUse = (b) => S(b) === "in use";
          const isCompleted = (b) => S(b) === "completed";

          const isDeliveredFlag = (b) =>
            /delivered|picked|pick(ed)?_?up|start|ongoing|in[_\s]?use|success|done|complete/.test(
              `${b.deliveryStatus || b.pickupStatus || ""}`.toLowerCase()
            );
          const isReturnedFlag = (b) =>
            /returned|dropoff|handed[_\s]?back|success|done|complete/.test(
              `${b.returnStatus || b.dropoffStatus || ""}`.toLowerCase()
            );

          const pickupsTodayRaw = bookings.filter(
            (b) => isToday(b.pickupTime) && !isCanceled(b)
          );
          const returnsToday = bookings.filter(
            (b) => isToday(b.returnTime) && !isCanceled(b)
          );

          // ❗ กันซ้ำ: ถ้าจบวันนี้ (completed+returnToday) จะไม่นับฝั่ง pickups
          const pickupsToday = pickupsTodayRaw.filter(
            (b) => !(isCompleted(b) && isToday(b.returnTime))
          );

          const pickupsDoneCount = pickupsToday.filter(
            (b) => isInUse(b) || (!isInUse(b) && isDeliveredFlag(b))
          ).length;

          const returnsDoneCount = returnsToday.filter(
            (b) => isCompleted(b) || (!isCompleted(b) && isReturnedFlag(b))
          ).length;

          setTodaySummary({
            pickups: pickupsToday.length,
            pickupsDone: pickupsDoneCount,
            returns: returnsToday.length,
            returnsDone: returnsDoneCount,
          });
        }
      } catch (e) {
        const msg = String(e?.message || "").toLowerCase();
        const isAbort =
          e?.name === "AbortError" ||
          msg.includes("aborted without reason") ||
          msg.includes("the user aborted a request");
        if (isAbort) return;
        setError(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [userId]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="relative w-full h-40 sm:h-48 lg:h-56 bg-gray-100">
        <div className="absolute inset-4 rounded-xl border-2 border-dashed border-gray-300" />
      </div>

      <div className="p-5">
        <h2 className="text-lg font-bold text-black">ข้อมูลพนักงาน</h2>

        {loading && (
          <p className="mt-3 text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
        )}

        {!!error && !loading && (
          <p className="mt-3 text-sm text-red-600">
            โหลดข้อมูลไม่สำเร็จ: {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold text-black">
                  {employee.name}
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {employee.status}
                </span>
              </div>
              <div className="text-sm text-gray-600">{employee.role}</div>
              <div className="grid gap-y-1.5 text-sm text-gray-800 mt-3">
                <div>
                  รหัสพนักงาน:{" "}
                  <span className="font-medium text-black">{employee.id}</span>
                </div>
                <div>สาขา: {employee.branch}</div>
                <div>กะทำงาน: {employee.shift}</div>
                <div>เริ่มงาน: {employee.startDate}</div>
                <div>เข้าระบบล่าสุด: {employee.lastLogin}</div>
                <div>โทร: {employee.phone}</div>
                <div>อีเมล: {employee.email}</div>
              </div>
            </div>

            {/* สรุปวันนี้ */}
            <div className="mt-5 grid grid-cols-4 gap-3">
              <div className="rounded-xl border bg-gray-50 p-4 sm:p-5 h-24 flex flex-col items-center justify-center">
                <div className="text-xs text-gray-500 leading-tight whitespace-pre-line text-center">
                  {"นำส่ง\nวันนี้"}
                </div>
                <div className="text-2xl font-bold leading-none py-2">
                  {todaySummary.pickups}
                </div>
              </div>

              <div className="rounded-xl border bg-gray-50 p-4 sm:p-5 h-24 flex flex-col items-center justify-center">
                <div className="text-xs text-gray-500 whitespace-nowrap text-center">
                  นำส่งแล้ว
                </div>
                <div className="text-2xl font-bold leading-none py-2">
                  {todaySummary.pickupsDone}
                </div>
              </div>

              <div className="rounded-xl border bg-gray-50 p-4 sm:p-5 h-24 flex flex-col items-center justify-center">
                <div className="text-xs text-gray-500 leading-tight whitespace-pre-line text-center">
                  {"รับคืน\nวันนี้"}
                </div>
                <div className="text-2xl font-bold leading-none py-2">
                  {todaySummary.returns}
                </div>
              </div>

              <div className="rounded-xl border bg-gray-50 p-4 sm:p-5 h-24 flex flex-col items-center justify-center">
                <div className="text-xs text-gray-500 whitespace-nowrap text-center">
                  ส่งคืนแล้ว
                </div>
                <div className="text-2xl font-bold leading-none py-2">
                  {todaySummary.returnsDone}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function extractCounts(payload) {
  if (!payload || Array.isArray(payload)) return null;
  const root =
    typeof payload === "object" && (payload.today || payload.summary)
      ? payload.today || payload.summary
      : payload;

  const num = (v) => (isFinite(v) ? Number(v) : 0);
  const find = (obj, keys) => {
    for (const k of keys) {
      for (const cand of [k, k.toUpperCase(), k.toLowerCase()]) {
        if (cand in obj && isFinite(obj[cand])) return num(obj[cand]);
      }
    }
    for (const v of Object.values(obj || {})) {
      if (v && typeof v === "object") {
        for (const k of keys) {
          if (k in v && isFinite(v[k])) return num(v[k]);
        }
      }
    }
    return null;
  };

  const pickups =
    find(root, [
      "pickups",
      "deliveries_due",
      "to_deliver",
      "to_pickup",
      "today_pickups",
    ]) ?? 0;
  const pickupsDone =
    find(root, ["pickups_done", "delivered", "delivered_today"]) ?? 0;
  const returns =
    find(root, [
      "returns",
      "dropoffs_due",
      "to_return",
      "today_returns",
      "returns_today",
    ]) ?? 0;
  const returnsDone =
    find(root, ["returns_done", "returned", "returned_today"]) ?? 0;

  const total = pickups + pickupsDone + returns + returnsDone;
  if (total === 0) return null;
  return { pickups, pickupsDone, returns, returnsDone };
}

function normalizeBookings(list) {
  if (!Array.isArray(list)) return [];
  return list.map((v, i) => {
    if (Array.isArray(v)) {
      const [
        code,
        ,
        pickup_time,
        return_time,
        status,
        delivery_status,
        return_status,
      ] = v;
      return {
        id: String(code ?? i),
        pickupTime: safeDate(pickup_time),
        returnTime: safeDate(return_time),
        status: String(status ?? "").toLowerCase(),
        deliveryStatus: String(delivery_status ?? "").toLowerCase(),
        returnStatus: String(return_status ?? "").toLowerCase(),
      };
    }
    return {
      id:
        v.id || v.name || v.booking_id || v.booking_code || v.code || String(i),
      pickupTime:
        safeDate(
          v.pickup_time ||
            v.pickup_at ||
            v.pickup_datetime ||
            v.pickup_date ||
            v.start ||
            v.start_time ||
            v.start_datetime
        ) || null,
      returnTime:
        safeDate(
          v.return_time ||
            v.return_at ||
            v.return_datetime ||
            v.return_date ||
            v.end ||
            v.end_time ||
            v.end_datetime
        ) || null,
      status: String(v.status || v.booking_status || "").toLowerCase(),
      deliveryStatus: String(
        v.delivery_status || v.pickup_status || ""
      ).toLowerCase(),
      returnStatus: String(
        v.return_status || v.dropoff_status || ""
      ).toLowerCase(),
    };
  });
}

function safeDate(x) {
  if (!x) return null;
  try {
    if (x instanceof Date) return isNaN(x.getTime()) ? null : x;
    if (typeof x === "number") return new Date(x);

    let s = String(x).trim();
    if (!s) return null;

    s = s.replace(/[๐-๙]/g, (d) => "0123456789"["๐๑๒๓๔๕๖๗๘๙".indexOf(d)]);

    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      s = s.replace("T", " ");
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }

    const m = s.match(
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/
    );
    if (m) {
      let dd = parseInt(m[1], 10);
      let mm = parseInt(m[2], 10);
      let yyyy = parseInt(m[3], 10);
      const HH = parseInt(m[4] ?? "0", 10);
      const II = parseInt(m[5] ?? "0", 10);
      if (yyyy >= 2400) yyyy -= 543;
      const d = new Date(yyyy, mm - 1, dd, HH, II, 0);
      return isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}
