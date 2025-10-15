// /lib/erpClient.js
const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.150.243.195";

export async function getErpUserInformation(userId) {
  // ถ้าไม่มี userId ให้พยายามดึงจาก session (optional)
  if (!userId) {
    try {
      const r = await fetch(
        `${ERP_BASE}/api/method/frappe.auth.get_logged_user`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const t = await r.text();
      const j = JSON.parse(t);
      if (j?.message) return { name: j.message }; // ได้แค่ user ชื่อสั้น
    } catch (e) {
      // เงียบไว้ ไปต่อด้วย null
    }
    return null;
  }

  // ✅ เรียก get_user_information แบบถูก (POST JSON หรือ GET ใส่ query ก็ได้)
  const res = await fetch(
    `${ERP_BASE}/api/method/frappe.api.api.get_user_information`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ user_id: userId }),
    }
  );

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok || data?.exception || data?.exc) {
    console.warn("get_user_information failed:", data);
    return null;
  }
  return data?.message ?? null;
}

export function toErpDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:00`;
}
