"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function EntryNoticeClient() {
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const id = sp.get("rental_id") || sp.get("confirmation") || "";
      const key = id ? `vrent_summary_notice_${id}` : "vrent_summary_notice";
      const shown = sessionStorage.getItem(key);
      if (!shown) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [sp]);

  const dismiss = () => {
    try {
      const id = sp.get("rental_id") || sp.get("confirmation") || "";
      const key = id ? `vrent_summary_notice_${id}` : "vrent_summary_notice";
      sessionStorage.setItem(key, "1"); // แสดงครั้งเดียวต่อการจอง
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />
      <div
        className="relative z-10 w-[92%] max-w-md rounded-2xl sm:rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-4 sm:p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg mr-2 sm:mr-3 flex items-center justify-center">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-black"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          แจ้งเตือน
        </h3>
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-300">
          กรุณาบันทึกภาพหน้าจอเพื่อเป็นหลักฐานการจองด้วยค่ะ
        </p>
        <div className="mt-4 sm:mt-5 flex justify-end gap-2">
          <button
            className="px-3 sm:px-4 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 text-sm"
            onClick={dismiss}
          >
            รับทราบ
          </button>
        </div>
      </div>
    </div>
  );
}
