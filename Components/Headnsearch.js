// Components/Headnsearch.jsx (หรือไฟล์ที่คุณใช้)
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import BookingBox from "@/Components/bookingbox";

const ERP_BASE = (
  process.env.NEXT_PUBLIC_ERP_BASE || "http://203.154.83.160"
).replace(/\/+$/, "");

export default function Headnsearch({
  bgSrc = "/images/View2.jpg",
  pickupLocation,
  setPickupLocation,
}) {
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");

  // … (โค้ดจัดการ session ของคุณเดิม - คงไว้ได้ตามที่มี)
  // hydrateFromERP(), computeFromStorage(), handleSignOut() ฯลฯ

  return (
    <section className="relative min-h-[40vh] pb-24 sm:pb-28 md:pb-36">
      <Image
        src={bgSrc}
        alt="V-Rent background"
        fill
        priority
        className="object-cover object-center -z-10"
      />
      <div className="absolute inset-0 bg-black/35 -z-10" />

      {/* Header บนรูปพื้นหลัง */}
      <header className="w-full bg-transparent text-white px-6 py-4 flex items-center justify-between shadow-none">
        <div className="text-3xl font-bold">
          <Link href="/mainpage" className="flex items-center gap-1">
            <span>V</span>
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              -
            </span>
            <span>Rent</span>
          </Link>
        </div>

        {/* ... ปุ่ม Login/Sign out ของคุณ ... */}
      </header>

      {/* BookingBox (เรียกใช้ที่นี่) */}
      <div className="pt-[max(2rem,env(safe-area-inset-top))] pb-8">
        <div className="px-4 sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <BookingBox
              pickupLocation={pickupLocation}
              setPickupLocation={setPickupLocation}
              pushToCars={true}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
