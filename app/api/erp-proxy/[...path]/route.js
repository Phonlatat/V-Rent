import { NextResponse } from "next/server";

const ERP_BASE = process.env.ERP_BASE || "http://203.154.83.160";

export async function GET(request, { params }) {
  const { path } = params;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  try {
    const targetUrl = `${ERP_BASE}/api/method/${path.join(
      "/"
    )}?${searchParams}`;
    console.log("ERP Proxy GET:", targetUrl);

    // Forward all headers from the original request
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "host") {
        headers.set(key, value);
      }
    });

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: headers,
      credentials: "include",
    });

    const data = await response.text();
    let jsonData;

    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { raw: data };
    }

    return NextResponse.json(jsonData, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("ERP Proxy GET Error:", error);
    return NextResponse.json(
      {
        error: "Proxy request failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  const { path } = params;
  const contentType = request.headers.get("content-type") || "";

  try {
    const targetUrl = `${ERP_BASE}/api/method/${path.join("/")}`;
    console.log("ERP Proxy POST:", targetUrl);
    console.log("ERP_BASE:", ERP_BASE);
    console.log("Content-Type:", contentType);

    // Forward all headers from the original request
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "host") {
        headers.set(key, value);
      }
    });

    // Ensure cookies are forwarded
    const cookie = request.headers.get("cookie");
    if (cookie) {
      headers.set("cookie", cookie);
    }

    // Add user agent
    headers.set("user-agent", "V-Rent-App/1.0");

    let body;
    if (contentType.includes("multipart/form-data")) {
      // Handle file uploads
      body = await request.formData();
    } else {
      // Handle JSON and other content types
      body = await request.text();
    }

    console.log("Sending request to:", targetUrl);
    console.log("Headers:", Object.fromEntries(headers.entries()));
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: headers,
      body: body,
      credentials: "include",
    });

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    const data = await response.text();
    let jsonData;

    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { raw: data };
    }

    return NextResponse.json(jsonData, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("ERP Proxy POST Error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      ERP_BASE: ERP_BASE,
      targetUrl: `${ERP_BASE}/api/method/${path.join("/")}`,
    });

    return NextResponse.json(
      {
        error: "Proxy request failed",
        details: error.message,
        ERP_BASE: ERP_BASE,
        targetUrl: `${ERP_BASE}/api/method/${path.join("/")}`,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { path } = params;
  const contentType = request.headers.get("content-type") || "";

  try {
    const targetUrl = `${ERP_BASE}/api/method/${path.join("/")}`;
    console.log("ERP Proxy PUT:", targetUrl);

    // Forward all headers from the original request
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "host") {
        headers.set(key, value);
      }
    });

    let body;
    if (contentType.includes("multipart/form-data")) {
      body = await request.formData();
    } else {
      body = await request.text();
    }

    const response = await fetch(targetUrl, {
      method: "PUT",
      headers: headers,
      body: body,
      credentials: "include",
    });

    const data = await response.text();
    let jsonData;

    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { raw: data };
    }

    return NextResponse.json(jsonData, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("ERP Proxy PUT Error:", error);
    return NextResponse.json(
      {
        error: "Proxy request failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { path } = params;

  try {
    const targetUrl = `${ERP_BASE}/api/method/${path.join("/")}`;
    console.log("ERP Proxy DELETE:", targetUrl);

    // Forward all headers from the original request
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "host") {
        headers.set(key, value);
      }
    });

    const response = await fetch(targetUrl, {
      method: "DELETE",
      headers: headers,
      credentials: "include",
    });

    const data = await response.text();
    let jsonData;

    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { raw: data };
    }

    return NextResponse.json(jsonData, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("ERP Proxy DELETE Error:", error);
    return NextResponse.json(
      {
        error: "Proxy request failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
