// app/cars/page.js
import { Suspense } from "react";
import Headers from "@/Components/HeaderISO";
import Footer from "@/Components/Footer";
import CarsPageContent from "./CarsPageContent";

export default function CarsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <title>CarsBoxPage - V-Rent</title>
      <Headers />

      {/* ทำพื้นหลังแถบเหลืองเฉพาะหน้านี้ */}
      <main className="flex-1 bg-white text-black">
        <section className="relative">
          {/* แถบเหลืองครึ่งบนของโซนเนื้อหา */}
          <div className="absolute inset-x-0 top-0 h-[120px] bg-gradient-to-r from-yellow-400 to-amber-500" />

          {/* เนื้อหาจริง ให้อยู่เหนือแถบเหลือง */}
          <div className="relative p-4 sm:p-8 lg:p-10">
            <Suspense fallback={<div>กำลังโหลดข้อมูล...</div>}>
              <CarsPageContent />
            </Suspense>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
