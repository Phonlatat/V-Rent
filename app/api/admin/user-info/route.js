export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id") || "";
    const email = searchParams.get("email") || "";

    // Forward cookies from client request
    const cookie = request.headers.get("cookie") || "";

    // Build query string
    const params = new URLSearchParams();
    if (user_id) params.append("user_id", user_id);
    if (email) params.append("email", email);

    const queryString = params.toString();
    const url = `http://203.154.83.160/api/method/frappe.api.api.get_user_information${
      queryString ? "?" + queryString : ""
    }`;

    console.log("User info proxy - URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });

    console.log("User info proxy - Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("User info proxy - Error response:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch user information",
          details: errorText,
        }),
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("User info proxy - Success:", {
      messageLength: data?.message?.length,
    });
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching user information:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
      }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const cookie = request.headers.get("cookie") || "";

    const response = await fetch(
      "http://203.154.83.160/api/method/frappe.api.api.get_user_information",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch user information" }),
        { status: response.status }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching user information:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
