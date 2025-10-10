"use client";

export default function CarsFilter({
  value,
  onChange,
  onReset,
  className = "",
}) {
  const v = value || {
    type: "",
    seatBucket: "",
    trans: "",
    priceMin: "",
    priceMax: "",
    popular: { freeCancel: false, instantConfirm: false, delivery: false },
  };

  const set = (patch) => onChange?.({ ...v, ...patch });
  const setPopular = (patch) =>
    onChange?.({ ...v, popular: { ...v.popular, ...patch } });

  const typeOptions = [
    ["", "ทั้งหมด"],
    ["ECO", "Eco"],
    ["SEDAN", "Sedan"],
    ["SUV", "SUV"],
    ["PICKUP", "Pickup"],
    ["VAN", "Van"],
  ];
  const seatOptions = [
    ["", "ทั้งหมด"],
    ["5-", "ถึง 5 ที่นั่ง"],
    ["6-7", "6–7 ที่นั่ง"],
    ["8+", "8+ ที่นั่ง"],
  ];
  const transOptions = [
    ["", "ทั้งหมด"],
    ["auto", "ออโต้"],
    ["manual", "ธรรมดา"],
  ];

  return (
    <aside
      className={[
        // กรอบเทา + เงาอ่อน แบบการ์ดบน
        "rounded-2xl border border-slate-200 bg-white",
        "shadow-md shadow-slate-900/5",
        "p-4",
        className,
      ].join(" ")}
    >
      {/* หัวการ์ด */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-slate-900">
          ตัวกรองรถเช่า
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-600 hover:text-slate-900"
        >
          ล้างทั้งหมด
        </button>
      </div>

      {/* ไม่มีเส้นกั้นด้านใน: ใช้ space-y แทน border-t */}
      <div className="space-y-5">
        {/* ประเภทรถ */}
        <section>
          <div className="text-sm font-medium mb-2 text-slate-800">
            ประเภทรถ
          </div>
          <div className="grid grid-cols-2 gap-2">
            {typeOptions.map(([val, label]) => (
              <label
                key={val}
                className={[
                  "cursor-pointer select-none rounded-lg px-3 py-2 text-sm",
                  "border",
                  v.type === val
                    ? "border-blue-500 text-blue-700 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="type"
                  className="sr-only"
                  checked={v.type === val}
                  onChange={() => set({ type: val })}
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        {/* จำนวนที่นั่ง */}
        <section>
          <div className="text-sm font-medium mb-2 text-slate-800">
            จำนวนที่นั่ง
          </div>
          <div className="grid grid-cols-3 gap-2">
            {seatOptions.map(([val, label]) => (
              <label
                key={val}
                className={[
                  "cursor-pointer select-none rounded-lg px-3 py-2 text-sm text-center",
                  "border",
                  v.seatBucket === val
                    ? "border-blue-500 text-blue-700 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="seatBucket"
                  className="sr-only"
                  checked={v.seatBucket === val}
                  onChange={() => set({ seatBucket: val })}
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        {/* เกียร์ */}
        <section>
          <div className="text-sm font-medium mb-2 text-slate-800">เกียร์</div>
          <div className="grid grid-cols-3 gap-2">
            {transOptions.map(([val, label]) => (
              <label
                key={val}
                className={[
                  "cursor-pointer select-none rounded-lg px-3 py-2 text-sm text-center",
                  "border",
                  v.trans === val
                    ? "border-blue-500 text-blue-700 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="trans"
                  className="sr-only"
                  checked={v.trans === val}
                  onChange={() => set({ trans: val })}
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        {/* ราคา/วัน */}
        <section>
          <div className="text-sm font-medium mb-3 text-slate-800">
            ราคา/วัน
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="ต่ำสุด"
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
              value={v.priceMin}
              onChange={(e) => set({ priceMin: e.target.value })}
            />
            <span className="text-slate-400">—</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="สูงสุด"
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
              value={v.priceMax}
              onChange={(e) => set({ priceMax: e.target.value })}
            />
          </div>
        </section>

        {/* ตัวเลือกยอดนิยม */}
        <section>
          <div className="text-sm font-medium mb-2 text-slate-800">
            ตัวเลือกยอดนิยม
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-slate-400"
                checked={!!v.popular?.freeCancel}
                onChange={(e) => setPopular({ freeCancel: e.target.checked })}
              />
              ยกเลิกฟรี
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-slate-400"
                checked={!!v.popular?.instantConfirm}
                onChange={(e) =>
                  setPopular({ instantConfirm: e.target.checked })
                }
              />
              ยืนยันทันที
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-slate-400"
                checked={!!v.popular?.delivery}
                onChange={(e) => setPopular({ delivery: e.target.checked })}
              />
              บริการส่งรถ
            </label>
          </div>
        </section>
      </div>
    </aside>
  );
}
