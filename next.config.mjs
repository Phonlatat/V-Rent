/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "demo.erpeazy.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "v-rent-app-916879005749.asia-southeast1.run.app",
        pathname: "/**",
      },
    ],
    unoptimized: true,
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "203.150.243.195", pathname: "**" },
      // ถ้าใช้ ERP อื่น ๆ ด้วย
      { protocol: "https", hostname: "demo.erpeazy.com", pathname: "**" },
    ],
  },
};

export default nextConfig; // ✅ ใช้ export default สำหรับ .mjs
