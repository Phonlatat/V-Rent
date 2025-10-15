// app/cars/CarsPageContent.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import BookingBox from "@/Components/bookingbox";
import CarsFilter from "@/Components/CarsCard/carsfilter";
import CarList from "@/Components/CarsCard/carList";
import FilterDrawer from "@/Components/CarsCard/FilterDrawer"; // drawer สำหรับมือถือ

export default function CarsPageContent() {
  const search = useSearchParams();

  /* ------ ดึงค่าจาก URL (payload คงค่า form ของผู้ใช้) ------ */
  const payload = useMemo(() => {
    const pickup_at = search.get("pickup_at") || "";
    const return_at = search.get("return_at") || "";
    const passengers = Number(search.get("passengers") || 1);
    const promo = search.get("promo") || "";
    const ftype = search.get("ftype") || "";

    // เฉพาะใช้บน UI (ไม่ส่งเข้า API ตรง ๆ)
    const pickupLocation =
      search.get("pickupLocation") || search.get("pickup_location") || "";
    const dropoffLocation =
      search.get("dropoffLocation") || search.get("dropoff_location") || "";
    const returnSameRaw =
      search.get("returnSame") ?? search.get("return_same") ?? "true";

    return {
      pickup_at,
      return_at,
      passengers,
      promo,
      ftype,
      pickupLocation,
      dropoffLocation,
      returnSame: String(returnSameRaw) !== "false",
    };
  }, [search]);

  /* ------ ตัวกรอง ------ */
  const [flt, setFlt] = useState({
    search: "", // <— เพิ่ม
    type: payload.ftype || "", // SEDAN | SUV | ...
    seatBucket: "", // "5-" | "6-7" | "8+"
    trans: "", // "auto" | "manual"
    priceMin: "",
    priceMax: "",
    popular: { freeCancel: false, instantConfirm: false, delivery: false },
  });

  const resetFilter = () =>
    setFlt({
      search: "", // <— เพิ่ม
      type: payload.ftype || "",
      seatBucket: "",
      trans: "",
      priceMin: "",
      priceMax: "",
      popular: { freeCancel: false, instantConfirm: false, delivery: false },
    });

  /* ------ สร้าง catalog สำหรับ suggest (brand / brand+model) ------ */
  const [catalogFromDB, setCatalogFromDB] = useState([]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickup_at: payload.pickup_at,
            return_at: payload.return_at,
            passengers: payload.passengers,
            promo: payload.promo,
            ftype: payload.ftype,
            search: flt.search, // <— เพิ่ม (ส่งเข้า CarList)
          }),
          signal: ac.signal,
        });
        const text = await res.text();
        const data = (() => {
          try {
            return JSON.parse(text);
          } catch {
            return {};
          }
        })();

        const raw = Array.isArray(data?.message)
          ? data.message
          : Array.isArray(data)
          ? data
          : [];

        const seen = new Set();
        const out = [];
        for (const c of raw) {
          const brand = String(c.brand || c.make || "").trim();
          const model = String(
            c.model || c.vehicle_model || c.vehicle_name || c.name || ""
          ).trim();

          if (brand) {
            const kb = `b:${brand.toLowerCase()}`;
            if (!seen.has(kb)) {
              seen.add(kb);
              out.push({ brand });
            }
          }
          if (brand && model) {
            const kbm = `bm:${brand.toLowerCase()} ${model.toLowerCase()}`;
            if (!seen.has(kbm)) {
              seen.add(kbm);
              out.push({ brand, model });
            }
          }
        }
        setCatalogFromDB(out);
      } catch {
        setCatalogFromDB([]);
      }
    })();
    return () => ac.abort();
  }, [
    payload.pickup_at,
    payload.return_at,
    payload.passengers,
    payload.promo,
    payload.ftype,
    flt.search,
  ]);

  /* ------ สำหรับ Drawer บนมือถือ ------ */
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const filtered = useMemo(
    () =>
      !!flt.type ||
      !!flt.seatBucket ||
      !!flt.trans ||
      !!flt.priceMin ||
      !!flt.priceMax ||
      !!flt.popular?.freeCancel ||
      !!flt.popular?.instantConfirm ||
      !!flt.popular?.delivery,
    [flt]
  );

  /* ------ รวม query ส่งเข้า CarList ------ */
  const listQuery = useMemo(
    () => ({
      pickup_at: payload.pickup_at,
      return_at: payload.return_at,
      passengers: payload.passengers,
      promo: payload.promo,
      ftype: payload.ftype,
      search: flt.search, // ← สำคัญ
      pickupLocation: payload.pickupLocation,
      dropoffLocation: payload.dropoffLocation,
      returnSame: payload.returnSame,

      // filters
      seatBucket: flt.seatBucket,
      trans: flt.trans,
      priceMin: flt.priceMin,
      priceMax: flt.priceMax,
      popular: flt.popular,
    }),
    [payload, flt]
  );

  /* ------ UI ------ */
  return (
    <div className="w-full min-h-[1px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* การ์ด BookingBox with dark theme */}
        <div className="rounded-2xl border border-white/20 shadow-2xl p-3 sm:p-4 bg-white/10 backdrop-blur-md hover:bg-white/15 hover:border-yellow-400/30 transition-all duration-300">
          <BookingBox />
        </div>

        {/* แถบปุ่มสำหรับมือถือ เปิด Drawer */}
        <div className="flex items-center justify-between lg:hidden">
          <div className="text-sm text-slate-300">
            {filtered ? "มีการใช้ตัวกรอง" : "ตัวกรองทั้งหมด"}
          </div>
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md px-3 py-2 text-sm text-white hover:bg-white/15 hover:border-yellow-400/30 transition-all duration-300"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M3 5h18v2H3V5Zm4 6h10v2H7v-2Zm3 6h4v2h-4v-2Z" />
            </svg>
            ตัวกรอง
            {filtered && (
              <span className="ml-1 h-2 w-2 rounded-full bg-yellow-400" />
            )}
          </button>
        </div>

        {/* Drawer (มือถือ) */}
        <FilterDrawer
          open={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          title="ตัวกรองรถ"
        >
          <CarsFilter
            value={flt}
            onChange={setFlt}
            onReset={resetFilter}
            catalog={catalogFromDB /* [{brand,model}, ...] */}
          />
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="flex-1 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-2 text-black font-medium hover:from-amber-500 hover:to-yellow-400 transition-all duration-300"
            >
              ดูผลลัพธ์
            </button>
            <button
              onClick={resetFilter}
              className="rounded-lg px-4 py-2 border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/15 hover:border-yellow-400/30 transition-all duration-300"
            >
              ล้าง
            </button>
          </div>
        </FilterDrawer>

        <div className="grid grid-cols-4 gap-4">
          {/* ซ้าย: ฟิลเตอร์ (เฉพาะจอใหญ่) */}
          <div className="hidden lg:block">
            <div className="sticky top-4">
              <CarsFilter
                value={flt}
                onChange={setFlt}
                onReset={resetFilter}
                catalog={catalogFromDB /* [{brand,model}, ...] */}
              />
            </div>
          </div>

          {/* ขวา: รายการรถ */}
          <div className="col-span-4 lg:col-span-3 rounded-2xl border border-white/20 shadow-2xl p-4 bg-white/10 backdrop-blur-md hover:bg-white/15 hover:border-yellow-400/30 transition-all duration-300">
            <CarList query={listQuery} />
          </div>
        </div>
      </div>
    </div>
  );
}
