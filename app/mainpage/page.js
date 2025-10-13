"use client";

import CardAddOn from "@/Components/CardAddOn";
import Footer from "@/Components/FooterMinimal";
import Header from "@/Components/Headnsearch";
import Slidemodal from "@/Components/Slidemodal";
import { useState } from "react";

export default function Home() {
  const [pickupLocation, setPickupLocation] = useState("");

  return (
    <div className="flex flex-col min-h-screen">
      <title>MainPage - V-Rent</title>
      <div>
        <Header
          pickupLocation={pickupLocation}
          setPickupLocation={setPickupLocation}
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
        <Footer />
      </div>
    </div>
  );
}
