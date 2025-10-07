// app/payment/choose/page.js
// ไฟล์นี้เป็น Server Component โดยค่าเริ่มต้น

import { Suspense } from "react";
import Headers from "@/Components/Header";
import Footer from "@/Components/Footer";
import ChoosePaymentClient from "./ChoosePaymentClient"; // Import Client Component ที่สร้างใหม่

export default function ChoosePaymentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900">
      <title>PaymentPage - V-Rent</title>
      <Headers />
      <main className="flex-grow overflow-x-hidden">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {/* ห่อหุ้ม Client Component ด้วย Suspense */}
          <Suspense fallback={<div>กำลังโหลดข้อมูลการจอง...</div>}>
            <ChoosePaymentClient />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
