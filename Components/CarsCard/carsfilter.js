"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function CarsFilter({
  value,
  onChange,
  onReset,
  className = "",
  /** ออปชันจาก DB สำหรับ suggest
   *  รูปแบบที่รองรับ:
   *  - [{ brand: "Toyota", model: "Yaris" }, ...]
   *  - หรืออาจส่งเป็นสตริงล้วน ["Toyota", "Yaris"] ก็ได้
   */
  catalog = [],
}) {
  const v = value || {
    search: "",
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

  /* ---------- SEARCH & SUGGEST ---------- */

  const [openSug, setOpenSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef(null);

  // รวบรวมแหล่ง suggest: ทั้ง brand เดี่ยวๆ และ brand+model
  const suggestionPool = useMemo(() => {
    const out = new Set();

    for (const item of catalog) {
      if (!item) continue;
      if (typeof item === "string") {
        out.add(item.trim());
        continue;
      }
      const b = (item.brand || "").toString().trim();
      const m = (item.model || "").toString().trim();
      if (b) out.add(b);
      if (b && m) out.add(`${b} ${m}`);
      else if (m) out.add(m);
    }
    return Array.from(out);
  }, [catalog]);

  // คัดกรองแบบ case-insensitive + contains (พิม “to” ขึ้น “Toyota”, “Toyota Yaris” ได้)
  const suggestions = useMemo(() => {
    const k = String(value?.search || "")
      .trim()
      .toLowerCase();
    if (!k) return [];
    return suggestionPool
      .filter((s) => s.toLowerCase().includes(k))
      .slice(0, 8);
  }, [value?.search, suggestionPool]);

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    const onDocClick = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpenSug(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const commitSearch = (text) => {
    const search = String(text ?? value?.search ?? "").trim();
    set({ search });
    setOpenSug(false);
    setActiveIdx(-1);
  };

  const onKeyDown = (e) => {
    if (!openSug && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpenSug(true);
      return;
    }
    if (!openSug || suggestions.length === 0) {
      if (e.key === "Enter") commitSearch();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((p) => (p + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((p) => (p - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen =
        activeIdx >= 0 ? suggestions[activeIdx] : value?.search || "";
      commitSearch(chosen);
    } else if (e.key === "Escape") {
      setOpenSug(false);
      setActiveIdx(-1);
    }
  };

  /* ---------- OPTIONS ---------- */
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

      {/* ช่องค้นหา + Suggest */}
      <div className="mb-4" ref={boxRef}>
        <div className="relative">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-slate-500"
              fill="currentColor"
            >
              <path d="M10 2a8 8 0 0 0 0 16 7.9 7.9 0 0 0 4.9-1.7l4.6 4.6 1.4-1.4-4.6-4.6A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z" />
            </svg>
            <input
              type="text"
              value={v.search || ""}
              onChange={(e) => {
                set({ search: e.target.value });
                setOpenSug(true);
              }}
              onFocus={() => setOpenSug(true)}
              placeholder="พิมพ์ยี่ห้อ/รุ่น เช่น Toyota, yaris"
            />
            {!!v.search && (
              <button
                className="text-slate-400 hover:text-slate-600"
                onClick={() => {
                  set({ search: "" });
                  setActiveIdx(-1);
                }}
                aria-label="clear"
              >
                ✕
              </button>
            )}
          </div>

          {/* Suggest dropdown */}
          {openSug && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 z-10 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <ul className="max-h-64 overflow-auto py-1">
                {suggestions.map((s, i) => (
                  <li key={`${s}-${i}`}>
                    <button
                      type="button"
                      className={[
                        "w-full px-3 py-2 text-left text-sm",
                        i === activeIdx
                          ? "bg-amber-50 text-amber-700"
                          : "hover:bg-slate-50",
                      ].join(" ")}
                      onMouseEnter={() => setActiveIdx(i)}
                      onMouseLeave={() => setActiveIdx(-1)}
                      onClick={() => commitSearch(s)}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
                    ? "border-amber-500 text-amber-700 bg-amber-50"
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
                    ? "border-amber-500 text-amber-700 bg-amber-50"
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
                    ? "border-amber-500 text-amber-700 bg-amber-50"
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
