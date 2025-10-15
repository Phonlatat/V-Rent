"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function Slidemodal({ onSelectCity }) {
  const tabs = useMemo(
    () => [
      {
        key: "recommend",
        mLabel: "แนะนำ",
        label: "รถเช่าแนะนำ",
        content: (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Toyota Yaris", "Toyota Fortuner", "Toyota Commuter"].map(
              (name, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-4 shadow-lg hover:shadow-xl hover:bg-white/15 hover:border-yellow-400/30 transition-all duration-300"
                >
                  <div className="text-white font-semibold">{name}</div>
                  <p className="text-sm text-slate-300 mt-1">
                    เกียร์อัตโนมัติ • แอร์เย็น • รับ-ส่งสนามบิน
                  </p>
                  <button className="mt-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-medium hover:from-amber-500 hover:to-yellow-400 hover:scale-105 transition-all duration-300">
                    จองเลย
                  </button>
                </div>
              )
            )}
          </div>
        ),
      },

      {
        key: "cities",
        mLabel: "ยอดนิยม",
        label: "สถานที่รับรถยอดนิยม",
        content: (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              "เชียงใหม่",
              "กรุงเทพฯ",
              "ภูเก็ต",
              "ขอนแก่น",
              "เชียงราย",
              "หาดใหญ่",
            ].map((c) => (
              <button
                key={c}
                onClick={() => onSelectCity && onSelectCity(c)} // ✅ ส่งชื่อเมืองออกไป
                className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md px-3 py-2 text-white hover:border-yellow-400 hover:bg-white/15 hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                {c}
              </button>
            ))}
          </div>
        ),
      },

      {
        key: "reviews",
        mLabel: "รีวิว",
        label: "รีวิวจากผู้ใช้",
        content: (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[5, 4.8, 4.9].map((score, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-4 shadow-lg hover:shadow-xl hover:bg-white/15 hover:border-yellow-400/30 transition-all duration-300"
              >
                <div className="text-yellow-400">★★★★★</div>
                <div className="mt-2 text-white font-medium">คะแนน {score}</div>
                <p className="text-sm text-slate-300 mt-1">
                  รถสภาพดี รับ-ส่งตรงเวลา การบริการเป็นกันเองมาก
                </p>
              </div>
            ))}
          </div>
        ),
      },

      {
        key: "faq",
        mLabel: "FAQ",
        label: "คำถามที่พบบ่อย",
        content: (
          <div className="space-y-3">
            {[
              [
                "จองล่วงหน้าได้กี่วัน?",
                "แนะนำอย่างน้อย 24-48 ชม. เพื่อให้มีรถว่างแน่นอน",
              ],
              [
                "รับ-ส่งรถที่สนามบินได้ไหม?",
                "ได้ มีบริการรับ-ส่งฟรีในจุดบริการที่กำหนด",
              ],
              [
                "ยกเลิกได้ไหม?",
                "ยืดหยุ่น: ยกเลิกฟรีภายในเวลาที่กำหนดของแต่ละดีล",
              ],
            ].map(([q, a], i) => (
              <details
                key={i}
                className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-4 hover:bg-white/15 hover:border-yellow-400/30 transition-all duration-300"
              >
                <summary className="cursor-pointer font-medium text-white hover:text-yellow-400 transition-colors duration-300">
                  {q}
                </summary>
                <p className="mt-2 text-sm text-slate-300">{a}</p>
              </details>
            ))}
          </div>
        ),
      },
    ],
    [onSelectCity]
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
        <div className="relative border-b border-white/20 mb-6">
          <div className="relative flex gap-1 sm:gap-4 justify-stretch px-1">
            {tabs.map((t, i) => (
              <button
                key={t.key}
                ref={(el) => (tabRefs.current[i] = el)}
                onClick={() => setActive(i)}
                className={[
                  "flex-1 min-w-0 rounded-md transition-all duration-300",
                  // มือถือ: ย่อให้พอดี 1 แถว
                  "px-2 py-2 text-[12px] leading-[18px] truncate",
                  // ≥ sm: กลับขนาดปกติ
                  "sm:px-3 sm:py-3 sm:text-base sm:leading-6",
                  active === i
                    ? "text-white font-semibold bg-white/10 backdrop-blur-md border border-white/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                ].join(" ")}
              >
                {/* มือถือใช้ชื่อสั้น, จอใหญ่ใช้ชื่อเต็ม */}
                <span className="sm:hidden">{t.mLabel}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Moving highlight */}
          <div
            className="absolute bottom-0 h-[2px] bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300"
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
