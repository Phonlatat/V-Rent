// Components/admin/AdminSlideModal.jsx
"use client";

import Link from "next/link";

export default function AdminSlideModal({
  cars = [],
  bookings = [],
  deliveries = [],
}) {
  const tables = [
    {
      id: "cars",
      title: "ตารางรถ",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      count: cars.length,
      description: "จัดการข้อมูลรถทั้งหมด",
      href: "/adminpageT/cars",
      color: "from-yellow-400 to-amber-500",
      bgColor: "from-yellow-400/20 to-amber-500/20",
    },
    {
      id: "bookings",
      title: "การจอง",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      count: bookings.length,
      description: "ติดตามการจองของลูกค้า",
      href: "/adminpageT/bookings",
      color: "from-blue-400 to-cyan-500",
      bgColor: "from-blue-400/20 to-cyan-500/20",
    },
    {
      id: "deliveries",
      title: "ส่งมอบ",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      count: deliveries.length,
      description: "บันทึกการส่งมอบรถ",
      href: "/adminpageT/deliveries",
      color: "from-green-400 to-emerald-500",
      bgColor: "from-green-400/20 to-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
      {tables.map((table) => (
        <Link
          key={table.id}
          href={table.href}
          className="group relative bg-white/10 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl hover:bg-white/15 hover:border-white/30 transition-all duration-300 p-4 md:p-6 text-left hover:-translate-y-1 hover:shadow-2xl"
        >
          <div className="flex items-center gap-3 md:gap-4">
            <div
              className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r ${table.color} rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
            >
              {table.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-bold text-white group-hover:text-yellow-400 transition-colors duration-300 truncate">
                {table.title}
              </h3>
              <p className="text-xs md:text-sm text-slate-300 mt-1 group-hover:text-white transition-colors duration-300 line-clamp-2">
                {table.description}
              </p>
              <div className="mt-2 md:mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${table.bgColor} text-white border border-white/30`}
                >
                  {table.count} รายการ
                </span>
              </div>
            </div>
            <div className="text-slate-400 group-hover:text-yellow-400 transition-colors duration-300 flex-shrink-0">
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
