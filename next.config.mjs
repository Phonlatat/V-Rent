/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "203.154.83.160",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "203.154.83.160",
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
};

export default nextConfig; // ✅ ใช้ export default สำหรับ .mjs
