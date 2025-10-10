export default function PageFrame({ children, className = "" }) {
  return (
    // ฉากหลังด้านนอกให้ต่างจากขาว เพื่อเห็นกรอบชัด
    <div className="min-h-screen bg-neutral-100">
      {/* ตัวกรอบจริง */}
      <div
        className={[
          "mx-2 sm:mx-4 lg:mx-6 my-2 sm:my-4 lg:my-6", // เว้นขอบจากขอบจอ
          "rounded-3xl ring-1 ring-slate-200 bg-white",
          "shadow-[0_10px_30px_rgba(0,0,0,0.08)]",
          "overflow-hidden", // ตัดมุมเนื้อหาด้านใน (เช่นรูป hero)
          className,
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
