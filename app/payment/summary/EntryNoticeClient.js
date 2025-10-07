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
      <div className="absolute inset-0 bg-black/50" onClick={dismiss} />
      <div
        className="relative z-10 w-[92%] max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-bold text-slate-900">แจ้งเตือน</h3>
        <p className="mt-2 text-sm text-slate-700">
          กรุณาบันทึกภาพหน้าจอเพื่อเป็นหลักฐานการจองด้วยค่ะ
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
            onClick={dismiss}
          >
            รับทราบ
          </button>
        </div>
      </div>
    </div>
  );
}
