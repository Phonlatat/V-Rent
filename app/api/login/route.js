import { NextResponse } from "next/server";

const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.150.243.195";
const ERP_LOGIN_URL = `${ERP_BASE}/api/method/login`;

export async function POST(req) {
  try {
    const body = await req.json();
    
    // เรียก API ของ ERP system
    const response = await fetch(ERP_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usr: body.email,
        pwd: body.password,
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
      const msg = data?.message || data?.exc || data?.raw || "Login failed";
      return NextResponse.json(
        { error: typeof msg === "string" ? msg : "Login failed" },
        { status: response.status }
      );
    }

    // ส่งข้อมูลกลับไปยัง frontend
    return NextResponse.json({
      success: true,
      full_name: data.full_name,
      is_admin: data.is_admin || false,
      message: data.message || "Login successful"
    });

  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" },
      { status: 500 }
    );
  }
}
