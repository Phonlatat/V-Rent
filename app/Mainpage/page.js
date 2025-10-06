"use client";

import Footer from "@/Components/Footer";
import HeaderBar from "@/Components/Header";
import BookingBox from "@/Components/bookingbox";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const toLocalInput = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${y}-${m}-${day}T${hh}:${mm}`;
  };

  const handleSearch = (data) => {
    const params = new URLSearchParams();

    // 1) snake_case (ฝั่ง API/ERP ใช้)
    const snake = [
      "pickup_at",
      "return_at",
      "passengers",
      "promo",
      "ftype",
      "pickup_location",
      "dropoff_location",
      "return_same",
    ];
    snake.forEach((k) => {
      const v = data?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        params.set(k, String(v));
      }
    });

    // 2) camelCase (ให้หน้า UI ถัดไป/booking พรีฟิล)
    const camelPairs = [
      ["pickup_location", "pickupLocation"],
      ["dropoff_location", "dropoffLocation"],
      ["return_same", "returnSame"],
    ];
    camelPairs.forEach(([from, to]) => {
      const v = data?.[from];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        params.set(to, String(v));
      }
    });

    // 3) แนบเวลารูปแบบที่ <input type="datetime-local"> ใช้ได้
    const pickupAtLocal = toLocalInput(data?.pickup_at);
    const returnAtLocal = toLocalInput(data?.return_at);
    if (pickupAtLocal) params.set("pickupAt", pickupAtLocal);
    if (returnAtLocal) params.set("dropoffAt", returnAtLocal);

    // 4) เผื่อ UI รุ่นเก่าเก็บค่าดิบ
    ["pickupDate", "pickupTime", "returnDate", "returnTime", "carType"].forEach(
      (k) => {
        const v = data?._raw?.[k] ?? data?.[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          params.set(k, String(v));
        }
      }
    );

    // ไปหน้าเลือกคันก่อน (CarBox). ค่าใน params จะถูกพกต่อไปยัง /cars/[id] และ /booking
    router.push(`/cars?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <title>MainPage - V-Rent</title>
      <HeaderBar />
      <main
        className="flex-grow bg-white overflow-x-hidden
                   pt-[max(1rem,env(safe-area-inset-top))]
                   pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="min-h-screen bg-gray-100 px-4 sm:px-6">
          <div className="mx-auto max-w-full">
            <BookingBox onSearch={handleSearch} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
