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

      {/* ห่อหุ้ม Client Components ด้วย Suspense (ต้องครอบเพราะใช้ useSearchParams) */}
      <Suspense fallback={<div>กำลังโหลดข้อมูล...</div>}>
        <EntryNoticeClient />
        <SummaryClient />
      </Suspense>

      <Footer />
    </div>
  );
}
