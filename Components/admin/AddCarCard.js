// components/admin/AddCarCard.jsx
"use client";

import { useRef, useState, useEffect } from "react";
import { carTypes } from "@/data/carTypes";

const ERP_CREATE_URL =
  "http://203.150.243.195/api/method/frappe.api.api.create_vehicle";
// const ERP_AUTH = "token xxx:yyy";

/* ---------------- helpers ---------------- */
function normalizeForm(f = {}) {
  return {
    name: f.name ?? "",
    brand: f.brand ?? "",
    type: f.type ?? "sedan", // ใช้ key 'type' ให้ตรงกันทุกที่
    transmission: f.transmission ?? "อัตโนมัติ",
    licensePlate: f.licensePlate ?? "",
    seats: f.seats ?? "",
    fuel: f.fuel ?? "เบนซิน",
    year: f.year ?? "",
    pricePerDay: f.pricePerDay ?? "",
    status: f.status ?? "Available", // ค่าอังกฤษเสมอ
    description: f.description ?? "",
    company: f.company ?? "",
    imageData: f.imageData ?? "",
  };
}

// เลือกเฉพาะคีย์ที่ “มีค่า” จาก form พาเรนต์มา merge ทับ โดยไม่รีเซ็ตช่องอื่น
const pickDefined = (obj = {}) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  );

export default function AddCarCard({
  form,
  onChange, // optional
  onImageChange, // optional
  fileRef: externalFileRef,
  onCreated, // optional
}) {
  const internalFileRef = useRef(null);
  const fileRef = externalFileRef ?? internalFileRef;

  // ---------- Local form ----------
  const [localForm, setLocalForm] = useState(() => normalizeForm(form));

  // ✅ merge แบบปลอดภัย ไม่เคลียร์ค่าที่ผู้ใช้พิมพ์ไว้
  useEffect(() => {
    if (!form || Object.keys(form).length === 0) return;
    setLocalForm((prev) => ({ ...prev, ...pickDefined(normalizeForm(form)) }));
  }, [form]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleLocalChange = (eOrObj) => {
    const { name, value } = "target" in eOrObj ? eOrObj.target : eOrObj ?? {};
    if (!name) return;
    setLocalForm((prev) => ({ ...prev, [name]: value ?? "" }));
    // ส่งขึ้นแบบ lightweight ป้องกันพาเรนต์ reset ทั้งฟอร์ม
    if (typeof onChange === "function") onChange({ name, value });
  };

  const handleLocalImageChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) {
      setLocalForm((prev) => ({ ...prev, imageData: "" }));
      onImageChange?.({ file: null, dataUrl: "" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      // ✅ อัพเดทเฉพาะ imageData ไม่ยุ่งช่องอื่น
      setLocalForm((prev) => ({ ...prev, imageData: dataUrl }));
      onImageChange?.({ file, dataUrl }); // ส่งข้อมูลย่อยขึ้น ไม่ส่ง event ตรงๆ
    };
    reader.readAsDataURL(file);
  };

  const clearImageInput = () => {
    if (fileRef?.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      setError("");

      const formData = new FormData();

      const file = fileRef.current?.files?.[0];
      if (file) formData.append("file", file, file.name);

      formData.append("license_plate", localForm.licensePlate || "");
      formData.append("vehicle_name", localForm.name || "");

      const status = localForm.status || "Available";
      formData.append("status", status);

      formData.append("price", String(localForm.pricePerDay || 0));
      formData.append("price_per_day", String(localForm.pricePerDay || 0));

      formData.append("company", localForm.company || "");
      // ✅ ใช้ค่าเดียวกัน
      formData.append("type", localForm.type || "sedan");
      formData.append("v_type", localForm.type || "sedan");

      formData.append("brand", localForm.brand || "");
      formData.append("seat", String(localForm.seats || ""));
      formData.append("year", String(localForm.year || ""));
      formData.append("gear_system", localForm.transmission || "อัตโนมัติ");
      formData.append("fuel_type", localForm.fuel || "เบนซิน");
      formData.append("description", localForm.description || "");

      const headers = new Headers();
      // headers.set("Authorization", ERP_AUTH);

      const res = await fetch(ERP_CREATE_URL, {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
        redirect: "follow",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Create failed (${res.status}) ${txt}`.trim());
      }

      clearImageInput();
      alert("เพิ่มรถสำเร็จ");
      onCreated?.();
      window.location.reload();
    } catch (err) {
      setError(err?.message || "เพิ่มรถไม่สำเร็จ");
      alert(err?.message || "เพิ่มรถไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-5 group hover:bg-white/15 transition-all duration-300">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mr-3">
          <svg
            className="w-4 h-4 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors duration-300">
          เพิ่มรถเพื่อเช่า
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-4 grid grid-cols-1 xl:grid-cols-6 gap-3"
      >
        {/* ชื่อรถ / ยี่ห้อ / ประเภท */}
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-white mb-1">
            ชื่อรถ *
          </label>
          <input
            type="text"
            name="name"
            value={localForm.name}
            onChange={handleLocalChange}
            placeholder="เช่น Toyota Corolla Cross"
            required
            className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:bg-white/20"
          />
        </div>
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-white mb-1">
            ยี่ห้อ *
          </label>
          <input
            type="text"
            name="brand"
            value={localForm.brand}
            onChange={handleLocalChange}
            placeholder="เช่น Toyota"
            required
            className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:bg-white/20"
          />
        </div>
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-white mb-1">
            ประเภทรถ
          </label>
          <select
            name="type"
            value={localForm.type}
            onChange={handleLocalChange}
            className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:bg-white/20"
          >
            {carTypes.map((c) => (
              <option
                key={c.value}
                value={c.value}
                className="bg-slate-800 text-white"
              >
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* เกียร์ / ป้ายทะเบียน / จำนวนที่นั่ง */}
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-white mb-1">
            ระบบเกียร์
          </label>
          <select
            name="transmission"
            value={localForm.transmission}
            onChange={handleLocalChange}
            className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:bg-white/20"
          >
            <option value="อัตโนมัติ" className="bg-slate-800 text-white">
              อัตโนมัติ (Auto)
            </option>
            <option value="ธรรมดา" className="bg-slate-800 text-white">
              ธรรมดา (Manual)
            </option>
          </select>
        </div>
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-white mb-1">
            ป้ายทะเบียน
          </label>
          <input
            type="text"
            name="licensePlate"
            value={localForm.licensePlate}
            onChange={handleLocalChange}
            placeholder="เช่น 1กข 1234 กรุงเทพฯ"
            className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:bg-white/20"
          />
        </div>
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-white mb-1">
            จำนวนที่นั่ง
          </label>
          <input
            type="number"
            min="1"
            name="seats"
            value={String(localForm.seats ?? "")}
            onChange={handleLocalChange}
            placeholder="เช่น 5"
            className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:bg-white/20"
          />
        </div>

        {/* เชื้อเพลิง / ปีรถ / ราคา/วัน */}
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-white mb-1">
            ประเภทเชื้อเพลิง
          </label>
          <select
            name="fuel"
            value={localForm.fuel}
            onChange={handleLocalChange}
            className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:bg-white/20"
          >
            <option className="bg-slate-800 text-white">เบนซิน</option>
            <option className="bg-slate-800 text-white">ดีเซล</option>
            <option className="bg-slate-800 text-white">ไฮบริด</option>
            <option className="bg-slate-800 text-white">ไฟฟ้า (EV)</option>
            <option className="bg-slate-800 text-white">LPG</option>
            <option className="bg-slate-800 text-white">NGV</option>
          </select>
        </div>
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-white mb-1">
            ปีของรถ
          </label>
          <input
            type="number"
            name="year"
            min="1980"
            max="2100"
            value={String(localForm.year ?? "")}
            onChange={handleLocalChange}
            placeholder="เช่น 2021"
            className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:bg-white/20"
          />
        </div>
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-white mb-1">
            ราคา/วัน (บาท) *
          </label>
          <input
            type="number"
            min="0"
            name="pricePerDay"
            value={String(localForm.pricePerDay ?? "")}
            onChange={handleLocalChange}
            placeholder="เช่น 1500"
            required
            className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:bg-white/20"
          />
        </div>

        {/* สถานะ / รูป */}
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-white mb-1">
            สถานะ
          </label>
          <select
            name="status"
            value={localForm.status}
            onChange={handleLocalChange}
            className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:bg-white/20"
          >
            <option value="Available" className="bg-slate-800 text-white">
              ว่าง
            </option>
            <option value="In Use" className="bg-slate-800 text-white">
              ถูกยืมอยู่
            </option>
            <option value="Maintenance" className="bg-slate-800 text-white">
              ซ่อมแซม
            </option>
          </select>
        </div>
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-white mb-1">
            รูปรถ (อัปโหลด)
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleLocalImageChange}
            className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-xl file:border file:border-white/20 file:bg-white/10 file:px-3 file:py-2 file:text-white hover:file:bg-white/20"
          />
          {localForm.imageData ? (
            <div className="mt-2">
              <img
                src={localForm.imageData}
                alt="ตัวอย่างรูปรถ"
                className="h-24 w-full max-w-[180px] rounded-xl border border-white/20 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  handleLocalChange({ name: "imageData", value: "" });
                  clearImageInput();
                }}
                className="mt-2 text-xs text-slate-300 underline hover:text-white transition-colors duration-200"
              >
                ลบรูป
              </button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              รองรับไฟล์ .jpg, .png, .webp (≤ 4MB)
            </p>
          )}
        </div>

        {/* คำอธิบาย */}
        <div className="xl:col-span-4">
          <label className="block text-xs font-semibold text-white mb-1">
            คำอธิบายเพิ่มเติม
          </label>
          <textarea
            name="description"
            rows={4}
            value={localForm.description}
            onChange={handleLocalChange}
            placeholder="รายละเอียด อุปกรณ์เสริม เงื่อนไขการเช่า ฯลฯ"
            className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:bg-white/20"
          />
        </div>

        {error && (
          <div className="xl:col-span-6">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          </div>
        )}

        <div className="col-span-1 xl:col-span-6 flex justify-center pt-1">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
          >
            {saving ? "กำลังบันทึก..." : "เพิ่มรถ"}
          </button>
        </div>
      </form>
    </div>
  );
}
