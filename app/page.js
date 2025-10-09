import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <title>V-Rent</title>
      {/* ข้อความตรงกลาง */}
      <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-white text-center mb-16">
        V-Rent
      </h1>

      {/* ปุ่ม Continue ด้านล่างตรงกลาง */}
      <div className="absolute bottom-10">
        <Link
          href="/mainpage"
          className="px-8 py-4 bg-black text-white text-lg rounded-lg transition-colors duration-300 hover:bg-gray-800"
        >
          Continue
        </Link>
        {/* First Commit Version 4 */}
      </div>
    </div>
  );
}
