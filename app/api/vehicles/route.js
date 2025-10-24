// app/api/vehicles/route.js
import { NextResponse } from "next/server";

const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.154.83.160";

// เปลี่ยนเป็น endpoint ที่คุณใช้จริงได้
const ERP_SEARCH_URL = `${ERP_BASE}/api/method/frappe.api.api.get_vehicles`;
const ERP_ADMIN_LIST_URL = `${ERP_BASE}/api/method/frappe.api.api.get_vehicles_admin`;

export async function POST(req) {
  let payload = {};
  try {
    payload = await req.json();
  } catch {}

  // ถ้ามีพารามิเตอร์ random ให้เพิ่มการสุ่มใน payload
  if (payload.random) {
    payload.randomize = true;
    payload.order_by = "RAND()"; // สำหรับ MySQL/MariaDB
  }

  // 1) พยายามเรียก search (รองรับ body)
  try {
    const r = await fetch(ERP_SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // ถ้า ERP ต้องใช้ session/cookie ให้ต่อ credentials ด้วย
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const t = await r.text();
    let j;
    try {
      j = JSON.parse(t);
    } catch {
      j = { raw: t };
    }

    if (r.ok && (j?.message || Array.isArray(j))) {
      // ถ้าข้อมูลที่ได้เป็น array ให้ส่งกลับไปเลย
      let vehicles = j?.message || j;

      // ถ้ามี limit ให้จำกัดจำนวน
      if (payload.limit && Array.isArray(vehicles)) {
        vehicles = vehicles.slice(0, payload.limit);
      }

      return NextResponse.json({
        message: vehicles,
        success: true,
        count: Array.isArray(vehicles) ? vehicles.length : 0,
      });
    }
    // ถ้า search ไม่โอเค ไป fallback ต่อ
    console.warn("search_available_vehicles failed; fallback", j);
  } catch (e) {
    console.warn("search_available_vehicles error; fallback", e);
  }

  // 2) fallback: ดึงรายการรถ admin (GET)
  try {
    const r2 = await fetch(ERP_ADMIN_LIST_URL, {
      method: "GET",
      credentials: "include",
    });
    const t2 = await r2.text();
    let j2;
    try {
      j2 = JSON.parse(t2);
    } catch {
      j2 = { raw: t2 };
    }

    if (!r2.ok) {
      return new NextResponse(t2, { status: r2.status });
    }
    return NextResponse.json(j2);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
