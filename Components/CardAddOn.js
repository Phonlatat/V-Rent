"use client";

export default function CardAddOn({ className = "" }) {
  const items = [
    {
      title: "ราคาโปร่งใส",
      desc: "เห็นราคาจบตั้งแต่แรก ไม่มีบวกเพิ่มหน้างาน ชำระปลอดภัยทุกขั้นตอน",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-1.09A3.5 3.5 0 0 1 8 12.5a1 1 0 0 1 2 0 1.5 1.5 0 1 0 3 0c0-.83-.67-1.5-1.5-1.5H10a1 1 0 0 1 0-2h2V7h2v1.09A3.5 3.5 0 0 1 16 11.5a3.5 3.5 0 0 1-3 3.45V17Z" />
        </svg>
      ),
    },
    {
      title: "ยืดหยุ่นเรื่องแผน",
      desc: "เปลี่ยนแปลง/ยกเลิกฟรี ก่อนเวลารับรถ 24 ชั่วโมง*",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M12 6V3l5 4-5 4V8a5 5 0 1 0 5 5h2a7 7 0 1 1-7-7Z" />
        </svg>
      ),
    },
    {
      title: "ตรวจรถโปร่งใสทุกคัน",
      desc: "ทุกคันผ่านการตรวจเช็กสภาพก่อนส่งมอบ มีรายงานภาพประกอบครบถ้วน",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm-1 15-5-5 1.41-1.41L11 14.17l5.59-5.59L18 10Z" />
        </svg>
      ),
    },
    {
      title: "ช่วยเหลือตลอด 24 ชม.",
      desc: "มีทีมงานพร้อมให้คำแนะนำและช่วยเหลือระหว่างการเช่าทุกเวลา",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M20 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4l4 4 4-4h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2ZM6 7h12v2H6Zm0 4h9v2H6Z" />
        </svg>
      ),
    },
  ];

  return (
    <section className={`w-full ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map((it, i) => (
          <article
            key={i}
            className="
              group h-full rounded-2xl bg-white/95 backdrop-blur
              shadow-sm hover:shadow-md transition-all duration-300
              p-5 hover:-translate-y-1
            "
          >
            <div className="flex items-start gap-3">
              <span
                className="
                  inline-flex items-center justify-center
                  w-9 h-9 rounded-xl
                  bg-yellow-400/15 text-yellow-500
                "
                aria-hidden
              >
                {it.icon}
              </span>

              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900 tracking-tight">
                  {it.title}
                </h3>
                <p className="text-sm leading-6 text-slate-600">{it.desc}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
