"use client";

import CardAddOn from "@/Components/CardAddOn";
import Footer from "@/Components/Footer";
import Header from "@/Components/Headnsearch";
import Slidemodal from "@/Components/Slidemodal";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [pickupLocation, setPickupLocation] = useState("");
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
      <div>
        <Header
          pickupLocation={pickupLocation}
          setPickupLocation={setPickupLocation}
          onSearch={handleSearch} // ถ้าต้องการให้ Headnsearch เรียกค้นหาแล้วให้ Home จัดการ push เอง
        />
        {/* BODY: กล่องสีขาวขอบมน ว่างเปล่า */}
        <main className="flex-1 bg-transparent">
          <div className="pt-0">
            {/* ดึงกล่องขึ้นมาทับ */}
            <div className="w-full -mt-16 sm:-mt-24 md:-mt-32 lg:-mt-36 relative z-20">
              <section
                className="
                rounded-4xl bg-white shadow-xl ring-1 ring-black/5
                min-h-[55vh] p-4 sm:p-6
              "
              >
                {/* เว้นว่างไว้ตามต้องการ ใส่คอนเทนต์ภายหลัง */}
                <CardAddOn />
                <Slidemodal
                  onSelectCity={(city) => {
                    setPickupLocation(city);

                    // ปิดการ scroll ชั่วคราว แล้วค่อย scroll ขึ้นด้านบน (สำหรับ iOS)
                    setTimeout(() => {
                      // ลองใช้ทั้งสองวิธี เผื่อ Safari บล็อกตัวแรก
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      document.documentElement.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }, 150); // รอ 0.15 วิให้ transition ของ modal เสร็จ
                  }}
                />
              </section>
            </div>
          </div>
        </main>

        {/* FOOTER */}
      </div>
    </div>
  );
}
