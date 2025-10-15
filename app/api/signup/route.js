import { NextResponse } from "next/server";

const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.150.243.195";
const ERP_SIGNUP_URL = `${ERP_BASE}/api/method/frappe.api.api.sign_up`;

export async function POST(req) {
  try {
    const body = await req.json();

    // เรียก API ของ ERP system
    const response = await fetch(ERP_SIGNUP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: body.email,
        full_name: body.name,
        password: body.password,
        phone: body.phone,
      }),
    });

    const raw = await response.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw };
    }

    if (!response.ok) {
      const msg = data?.message || data?.exc || data?.raw || "Sign up failed";
      return NextResponse.json(
        { error: typeof msg === "string" ? msg : "Sign up failed" },
        { status: response.status }
      );
    }

    // ส่งข้อมูลกลับไปยัง frontend
    return NextResponse.json({
      success: true,
      message: data.message || "สมัครสมาชิกสำเร็จ",
    });
  } catch (error) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสมัครสมาชิก" },
      { status: 500 }
    );
  }
}
