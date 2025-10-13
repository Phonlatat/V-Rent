import { Suspense } from "react";
import Headers from "@/Components/HeaderISO";
import Footer from "@/Components/Footer";
import SummaryClient from "./SummaryClient";
import EntryNoticeClient from "./EntryNoticeClient";

export default function ChoosePaymentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900">
      <title>Summary - V-Rent</title>
      <Headers />

      <main className="flex-grow">
        <section className="relative">
          {/* แถบเหลืองครึ่งบนของโซนเนื้อหา */}
          <div className="absolute inset-x-0 top-0 h-[120px] bg-gradient-to-r from-yellow-400 to-amber-500" />

          {/* เนื้อหาจริง ให้อยู่เหนือแถบเหลือง */}
          <div className="relative p-4 sm:p-8 lg:p-10">
            <div className="max-w-6xl mx-auto">
              {/* ห่อหุ้ม Client Components ด้วย Suspense (ต้องครอบเพราะใช้ useSearchParams) */}
              <Suspense fallback={<div>กำลังโหลดข้อมูล...</div>}>
                <EntryNoticeClient />
                <SummaryClient />
              </Suspense>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
