// app/api/image-proxy/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  try {
    const response = await fetch(imageUrl);
    const imageBuffer = await response.arrayBuffer();

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": response.headers.get("content-type"),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return new Response("Image not found", { status: 404 });
  }
}
