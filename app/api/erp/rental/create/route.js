import { NextResponse } from "next/server";

const ERP_BASE = (
  process.env.NEXT_PUBLIC_ERP_BASE || "http://203.150.243.195"
).replace(/\/+$/, "");

async function postERP(url, cookie, data) {
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Cookie: cookie || "",
    },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { ok: r.ok, status: r.status, json, text };
}

export async function POST(req) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const body = await req.json();

    const payload = {
      confirmation_document: body.confirmation_document || "",
      customer_name: body.customer_name || "",
      customer_phone: body.customer_phone || "",
      vehicle: body.vehicle || "",
      base_price: body.base_price ?? 0,
      pickup_place: body.pickup_place || "",
      return_place: body.return_place || "",
      pickup_date: body.pickup_date || "",
      return_date: body.return_date || "",
      discount: body.discount ?? 0,
      down_payment: body.down_payment ?? 0,
      contact_platform: body.contact_platform || "website",
      payment_status: body.payment_status || "Paid",
      status: body.status || "Confirmed",
      additional_options: body.additional_options || "",
      remark: body.remark || "",
    };

    const out = await postERP(
      `${ERP_BASE}/api/method/erpnext.api.create_rental`,
      cookie,
      payload
    );

    if (!out.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "ERP error",
          status: out.status,
          erp: out.json || out.text,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, erp: out.json || out.text });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
