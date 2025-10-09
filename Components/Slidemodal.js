"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function Slidemodal() {
  const tabs = useMemo(
    () => [
      { key: "recommend", label: "รถเช่าแนะนำ", content: <div>...</div> },
      { key: "cities", label: "เมืองยอดนิยม", content: <div>...</div> },
      { key: "reviews", label: "รีวิวจากผู้ใช้", content: <div>...</div> },
      {
        key: "suppliers",
        label: "ซัพพลายเออร์รถเช่า",
        content: <div>...</div>,
      },
      { key: "faq", label: "คำถามที่พบบ่อย", content: <div>...</div> },
    ],
    []
  );

  const [active, setActive] = useState(0);
  const [indicator, setIndicator] = useState({ width: 0, left: 0 });
  const tabRefs = useRef([]);

  // เมื่อ active เปลี่ยนหรือ resize ให้คำนวณใหม่
  useEffect(() => {
    const el = tabRefs.current[active];
    if (el) {
      const { offsetLeft, offsetWidth } = el;
      setIndicator({ width: offsetWidth, left: offsetLeft });
    }
  }, [active]);

  // รองรับ resize ด้วย
  useEffect(() => {
    const handler = () => {
      const el = tabRefs.current[active];
      if (el) {
        const { offsetLeft, offsetWidth } = el;
        setIndicator({ width: offsetWidth, left: offsetLeft });
      }
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [active]);

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Tabs header */}
        <div className="relative border-b border-slate-200 mb-6">
          <div className="flex flex-wrap gap-4 justify-center relative">
            {tabs.map((t, i) => (
              <button
                key={t.key}
                ref={(el) => (tabRefs.current[i] = el)}
                onClick={() => setActive(i)}
                className={`relative -mb-px px-2 sm:px-3 py-3 text-sm sm:text-base transition-colors ${
                  active === i
                    ? "text-slate-900 font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Moving highlight */}
          <div
            className="absolute bottom-0 h-[2px] bg-blue-600 transition-all duration-300"
            style={{
              width: `${indicator.width}px`,
              transform: `translateX(${indicator.left}px)`,
            }}
          />
        </div>

        {/* Tab content slide */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {tabs.map((t) => (
              <div key={t.key} className="w-full shrink-0 py-6">
                {t.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
