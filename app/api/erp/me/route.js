import { NextResponse } from "next/server";

const ERP_BASE = (
  process.env.NEXT_PUBLIC_ERP_BASE || "https://demo.erpeazy.com"
).replace(/\/+$/, "");

async function getJSON(url, cookie) {
  try {
    const r = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", Cookie: cookie || "" },
      cache: "no-store",
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// ---- helpers ----
async function getUserDoctype(email, cookie) {
  if (!email) return {};
  const qs = new URLSearchParams({
    doctype: "User",
    fieldname: "full_name,phone,mobile_no,contact_no",
    filters: JSON.stringify({ name: email }),
  }).toString();
  const resp = await getJSON(
    `${ERP_BASE}/api/method/frappe.client.get_value?${qs}`,
    cookie
  );
  return resp?.message || {};
}

async function getPhoneFromContactByEmailId(email, cookie) {
  if (!email) return "";
  const qs = new URLSearchParams({
    doctype: "Contact",
    fieldname: "mobile_no,phone",
    filters: JSON.stringify({ email_id: email }),
    limit_page_length: "1",
  }).toString();
  const resp = await getJSON(
    `${ERP_BASE}/api/method/frappe.client.get_value?${qs}`,
    cookie
  );
  const v = resp?.message || {};
  return v.mobile_no || v.phone || "";
}

async function getPhoneViaContactEmailChild(email, cookie) {
  if (!email) return "";
  const qs1 = new URLSearchParams({
    doctype: "Contact Email",
    fields: JSON.stringify(["parent"]),
    filters: JSON.stringify({ email_id: email }),
    limit_page_length: "1",
  }).toString();
  const list = await getJSON(
    `${ERP_BASE}/api/method/frappe.client.get_list?${qs1}`,
    cookie
  );
  const parent = list?.message?.[0]?.parent;
  if (!parent) return "";

  const qs2 = new URLSearchParams({
    doctype: "Contact",
    fieldname: "phone,mobile_no",
    filters: JSON.stringify({ name: parent }),
  }).toString();
  const v = await getJSON(
    `${ERP_BASE}/api/method/frappe.client.get_value?${qs2}`,
    cookie
  );
  const msg = v?.message || {};
  return msg.mobile_no || msg.phone || "";
}

export async function GET(req) {
  const cookie = req.headers.get("cookie") || "";
  const url = req.nextUrl;
  const emailFallback =
    req.headers.get("x-email") || url.searchParams.get("email") || "";
  const userIdFallback =
    req.headers.get("x-user-id") || url.searchParams.get("user_id") || "";

  const info = await getJSON(
    `${ERP_BASE}/api/method/erpnext.api.get_user_information`,
    cookie
  );
  const msg = info?.message ?? info ?? {};

  let email =
    msg.email ||
    msg.user ||
    msg.user_id ||
    msg.username ||
    "" ||
    emailFallback ||
    userIdFallback;
  let userId = msg.user_id || msg.user || email || userIdFallback || "";

  const first = msg.first_name || msg.given_name || "";
  const last = msg.last_name || msg.surname || "";
  let fullName =
    first || last
      ? [first, last].filter(Boolean).join(" ")
      : msg.full_name || msg.fullname || msg.name || "";

  let phone =
    msg.phone ||
    msg.mobile_no ||
    msg.phone_no ||
    msg.telephone ||
    msg.mobile ||
    "";

  const tried = { info: !!phone };

  // 2) Doctype User
  if (email && (!fullName || !phone)) {
    const u = await getUserDoctype(email, cookie);
    if (!fullName && u.full_name) fullName = u.full_name;
    if (!phone) phone = u.mobile_no || u.phone || u.contact_no || "";
    tried.user = !!(u.full_name || u.mobile_no || u.phone || u.contact_no);
  }

  // 3) Contact by email_id (ตรงๆก่อน)
  if (email && !phone) {
    const p = await getPhoneFromContactByEmailId(email, cookie);
    if (p) phone = p;
    tried.contact_by_email_id = !!p;
  }

  // 4) Child table Contact Email -> Contact (วิธีเดิมเป็น fallback สุดท้าย)
  if (email && !phone) {
    const p2 = await getPhoneViaContactEmailChild(email, cookie);
    if (p2) phone = p2;
    tried.contact_via_child = !!p2;
  }

  const rolesRaw = msg.roles || [];
  const roles = Array.isArray(rolesRaw)
    ? rolesRaw.map((r) => (typeof r === "string" ? r : r?.role)).filter(Boolean)
    : [];
  const isAdmin =
    String(userId).toLowerCase() === "administrator" ||
    roles.some((r) => /^(Administrator|System Manager)$/i.test(String(r)));

  if (!fullName && email) fullName = email.split("@")[0];
   const res = await fetch(
    `${ERP_BASE}/api/method/erpnext.api.get_user_information`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ user_id: userId }),
    }
  );
  const text = await res.json();

  return NextResponse.json({
    ok: true,
    user: {
      email: email || "",
      fullName: fullName || "",
      phone: phone || "",
      isAdmin: text.message[5],
    },
    raw: { userId, roles, tried },
  });
}
