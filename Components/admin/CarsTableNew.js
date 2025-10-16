// Components/admin/CarsTableNew.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge } from "./Badges";
import { fmtBaht } from "./utils";
import { createPortal } from "react-dom";

const MAX_FILE_MB = 3;

/** ───────── ERP CONFIG (ปรับได้) ───────── */
const ERP_DELETE_URL =
  "http://203.154.83.160/api/method/frappe.api.api.delete_vehicle";
const ERP_EDIT_URL =
  "http://203.154.83.160/api/method/frappe.api.api.edit_vehicles";

/** ✅ Base URL และตัวช่วยแปลง URL รูป */
const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.154.83.160";
function normalizeImage(u) {
  if (!u) return "";
  const s0 = String(u).trim();
  if (/^(data:|blob:)/i.test(s0)) return s0;
  let s = s0;
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("/")) s = ERP_BASE.replace(/\/+$/, "") + s;
  if (!/^https?:\/\//i.test(s)) {
    s = ERP_BASE.replace(/\/+$/, "") + "/" + s.replace(/^\/+/, "");
  }
  return encodeURI(s);
}

function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
        aria-label="ปิด"
      />
      <div className="relative min-h-full flex items-center justify-center p-4">
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function CarsTableNew({
  cars = [],
  bookings = [],
  now = new Date(),
  onEdit,
  onDelete,
  onAddCar,
  onRefresh,
  onFetchCars,
  getCarRowStatus = (c) => {
    const firstNonEmpty = (...xs) =>
      xs.find(
        (s) =>
          String(s ?? "")
            .replace(/\u00A0|\u200B|\u200C|\u200D/g, "")
            .trim().length > 0
      );

    const raw0 = firstNonEmpty(
      c?.status,
      c?.stage,
      c?.vehicle_stage,
      c?.car_status,
      c?.status_text,
      ""
    );
    const raw = String(raw0)
      .normalize("NFKC")
      .replace(/\u00A0|\u200B|\u200C|\u200D/g, " ")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    const compact = raw.replace(/\s+/g, "");

    if (
      raw === "in rent" ||
      compact === "inrent" ||
      raw === "ถูกจอง" ||
      raw === "reserved" ||
      raw === "booked"
    )
      return "ถูกจอง";

    if (
      raw === "in use" ||
      compact === "inuse" ||
      raw === "ถูกยืมอยู่" ||
      raw === "กำลังเช่า" ||
      raw === "rented"
    )
      return "ถูกยืมอยู่";

    if (
      raw === "maintenance" ||
      raw === "maintainance" ||
      raw === "ซ่อมบำรุง" ||
      raw === "ซ่อมแซม"
    )
      return "ซ่อมบำรุง";

    if (raw === "available" || raw === "ว่าง") return "ว่าง";

    return "ว่าง";
  },
  apiUrl = "http://203.154.83.160/api/method/frappe.api.api.get_vehicles",
  autoFetchIfEmpty = true,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // modal state
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [selectedName, setSelectedName] = useState("");
  const [selectedPlate, setSelectedPlate] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editSuccessOpen, setEditSuccessOpen] = useState(false);

  // Smooth scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Process cars data
  const rows = useMemo(() => {
    if (!Array.isArray(cars)) return [];

    // Debug: log the first car to see its structure
    if (cars.length > 0) {
      console.log("First car data structure:", cars[0]);
    }

    return cars.map((car, idx) => {
      // Normalize car data like CarsTable.js does
      const normalizedCar = {
        ...car,
        _idx: idx,

        // Ensure all fields are properly mapped
        id:
          car.id ||
          car.vid ||
          car.name ||
          car.vehicle_id ||
          car.vehicle ||
          car.license_plate ||
          car.plate ||
          "",
        vid: car.vid || "",
        name: car.model || car.vehicle_name || car.name || "—",
        brand: car.brand || car.make || "",
        licensePlate: (
          car.license_plate ||
          car.plate ||
          car.licensePlate ||
          ""
        ).trim(),
        pricePerDay: Number(
          car.price_per_day || car.rate || car.price || car.pricePerDay || 0
        ),
        status:
          car.status ||
          car.stage ||
          car.vehicle_stage ||
          car.car_status ||
          car.status_text ||
          "ว่าง",
        type: car.type || car.v_type || car.ftype || car.category || "Sedan",
        transmission: car.transmission || car.gear_system || "อัตโนมัติ",
        seats: Number(car.seats || car.seat || 5),
        fuel: car.fuel || car.fuel_type || "เบนซิน",
        year: Number(car.year || 0),
        company: car.company || "",
        description: car.description || "",
        image:
          car.imageData ||
          car.image_url ||
          car.image ||
          car.photo ||
          car.thumbnail ||
          car.vehicle_image ||
          "",
        imageData: normalizeImage(
          car.imageData ||
            car.image_url ||
            car.image ||
            car.photo ||
            car.thumbnail ||
            car.vehicle_image ||
            ""
        ),
        imageUrl: normalizeImage(
          car.imageData ||
            car.image_url ||
            car.image ||
            car.photo ||
            car.thumbnail ||
            car.vehicle_image ||
            ""
        ),
      };

      return normalizedCar;
    });
  }, [cars]);

  // Filter and sort cars
  const filteredRows = useMemo(() => {
    let filtered = rows;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.name?.toLowerCase().includes(term) ||
          row.brand?.toLowerCase().includes(term) ||
          row.licensePlate?.toLowerCase().includes(term) ||
          row.type?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((row) => {
        const status = getCarRowStatus(row);
        return status === statusFilter;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "name":
          aVal = a.name || "";
          bVal = b.name || "";
          break;
        case "brand":
          aVal = a.brand || "";
          bVal = b.brand || "";
          break;
        case "price":
          aVal = a.pricePerDay || 0;
          bVal = b.pricePerDay || 0;
          break;
        case "status":
          aVal = getCarRowStatus(a);
          bVal = getCarRowStatus(b);
          break;
        default:
          aVal = a.name || "";
          bVal = b.name || "";
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [rows, searchTerm, statusFilter, sortBy, sortOrder, getCarRowStatus]);

  const openEdit = (row) => {
    console.log("Opening edit for row:", row);
    console.log("Available fields in row:", Object.keys(row));

    // ใช้ข้อมูลที่ normalize แล้วจาก rows
    const currentData = {
      // ข้อมูลพื้นฐาน
      id: row.id,
      name: row.name,
      brand: row.brand,
      licensePlate: row.licensePlate,
      pricePerDay: row.pricePerDay,
      type: row.type,
      status: row.status,
      description: row.description,

      // ข้อมูลเพิ่มเติม
      seats: row.seats,
      year: row.year,
      transmission: row.transmission,
      fuel: row.fuel,
      company: row.company,

      // รูปภาพ
      image: row.image || row.imageData || row.imageUrl,

      // ข้อมูลอื่นๆ
      ...row, // เก็บข้อมูลอื่นๆ ที่อาจมี
    };

    console.log("Current car data for edit:", currentData);
    console.log("Seats value:", currentData.seats);
    console.log("Year value:", currentData.year);
    console.log("Transmission value:", currentData.transmission);
    console.log("Fuel value:", currentData.fuel);
    console.log("Company value:", currentData.company);

    setEditForm(currentData);
    setEditOpen(true);
  };

  const openDelete = (row) => {
    console.log("Opening delete for row:", row);
    setSelectedId(row.id || row.name || row.key);
    setSelectedName(row.name);
    setSelectedPlate(row.licensePlate);
    setDelOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditForm({});
    setSelectedImage(null);
    setImagePreview(null);
    setUploadingImage(false);
  };

  const closeEditSuccess = () => {
    setEditSuccessOpen(false);
  };

  const closeDelete = () => {
    setDelOpen(false);
    setSelectedId(null);
    setSelectedName("");
    setSelectedPlate("");
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);

      // สร้าง preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const doEdit = async () => {
    const carId = editForm.id || editForm.name || editForm.key;
    if (!carId) {
      alert("ไม่พบ ID ของรถ");
      return;
    }

    try {
      setEditLoading(true);

      // Validate required fields
      if (!editForm.name?.trim()) {
        alert("กรุณากรอกชื่อรถ");
        return;
      }
      if (!editForm.licensePlate?.trim()) {
        alert("กรุณากรอกป้ายทะเบียน");
        return;
      }
      if (!editForm.pricePerDay || editForm.pricePerDay <= 0) {
        alert("กรุณากรอกราคาที่ถูกต้อง");
        return;
      }

      // สร้าง FormData สำหรับส่งข้อมูลและรูปภาพ
      const formData = new FormData();

      // Required parameters
      formData.append("vid", carId);
      formData.append("license_plate", editForm.licensePlate || "");
      formData.append("vehicle_name", editForm.name || "");
      formData.append("status", editForm.status || "Available");
      formData.append("price", String(editForm.pricePerDay || 0));
      formData.append("company", editForm.company || "");
      formData.append("type", editForm.type || "Sedan");
      formData.append("v_type", editForm.type || "Sedan");
      formData.append("brand", editForm.brand || "");
      formData.append("seat", String(editForm.seats || ""));
      formData.append("year", String(editForm.year || ""));
      formData.append("gear_system", editForm.transmission || "");
      formData.append("fuel_type", editForm.fuel || "");
      formData.append("description", editForm.description || "");

      // เพิ่มรูปภาพถ้ามี
      if (selectedImage) {
        formData.append("file", selectedImage, selectedImage.name);
      }

      console.log(
        "Sending edit request with image:",
        selectedImage ? "Yes" : "No"
      );

      const res = await fetch(ERP_EDIT_URL, {
        method: "POST",
        body: formData, // ใช้ FormData แทน JSON
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Edit failed (${res.status})`);
      }

      // แสดง modal ยืนยันการแก้ไขแทน alert
      setEditSuccessOpen(true);
      onRefresh?.(); // Refresh the data
      closeEdit();
    } catch (err) {
      console.error("Edit error:", err);
      alert(err?.message || "แก้ไขข้อมูลรถไม่สำเร็จ");
    } finally {
      setEditLoading(false);
    }
  };

  const doDelete = async () => {
    if (!selectedPlate) {
      alert("ไม่พบป้ายทะเบียนรถ");
      return;
    }

    try {
      setDeleteLoading(true);

      console.log("Sending delete request for license plate:", selectedPlate);

      const res = await fetch(ERP_DELETE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_plate: selectedPlate }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Delete failed (${res.status})`);
      }

      onDelete?.();
      closeDelete();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err?.message || "ลบรถไม่สำเร็จ");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddCar = () => {
    if (onAddCar) {
      onAddCar();
    } else {
      // Navigate back to adminpageT with scroll to add car form
      window.location.href = "/adminpageT#add-car";
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);

      if (onFetchCars) {
        // Use custom fetch function if provided
        await onFetchCars();
      } else if (onRefresh) {
        // Use refresh callback if provided
        onRefresh();
      } else {
        // Fallback: fetch data directly
        const response = await fetch(apiUrl, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // Note: This would need to be handled by parent component
          // to update the cars state
          console.log("Data refreshed:", data);
        } else {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
      }

      // Show success message
      console.log("ข้อมูลรถยนต์ได้รับการอัปเดตแล้ว");
    } catch (error) {
      console.error("Error refreshing data:", error);
      alert("เกิดข้อผิดพลาดในการรีเฟรชข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="p-6">
      {/* Professional Header with Search and Actions */}
      <div className="space-y-6 mb-8">
        {/* Search and Filter Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="ค้นหารถยนต์ตามชื่อ, ยี่ห้อ, หรือทะเบียน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-12 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 lg:w-auto">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 min-w-[140px]"
              >
                <option value="all" className="bg-slate-800 text-white">
                  ทุกสถานะ
                </option>
                <option value="ว่าง" className="bg-slate-800 text-white">
                  ว่าง
                </option>
                <option value="ถูกจอง" className="bg-slate-800 text-white">
                  ถูกจอง
                </option>
                <option value="ถูกยืมอยู่" className="bg-slate-800 text-white">
                  ถูกยืมอยู่
                </option>
                <option value="ซ่อมบำรุง" className="bg-slate-800 text-white">
                  ซ่อมบำรุง
                </option>
              </select>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/80 to-blue-600/80 text-white font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-blue-500/30"
                  title="รีเฟรชข้อมูล"
                >
                  {loading ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  )}
                  <span className="hidden sm:inline">รีเฟรช</span>
                </button>

                {/* Add Car Button */}
                <button
                  onClick={handleAddCar}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-yellow-400 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  title="เพิ่มรถใหม่ (จะกลับไปยังหน้า Admin Dashboard)"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>เพิ่มรถใหม่</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-4 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                {rows.length}
              </div>
              <div className="text-sm text-slate-300">รถทั้งหมด</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-slate-400 to-slate-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-400/20 to-green-500/10 backdrop-blur-sm rounded-2xl border border-green-400/30 p-4 hover:bg-green-400/25 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-green-400 mb-1">
                {rows.filter((r) => getCarRowStatus(r) === "ว่าง").length}
              </div>
              <div className="text-sm text-slate-300">ว่าง</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-400/20 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-blue-400/30 p-4 hover:bg-blue-400/25 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-blue-400 mb-1">
                {rows.filter((r) => getCarRowStatus(r) === "ถูกจอง").length}
              </div>
              <div className="text-sm text-slate-300">ถูกจอง</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0v10a2 2 0 002 2h2a2 2 0 002-2V7m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-400/20 to-red-500/10 backdrop-blur-sm rounded-2xl border border-red-400/30 p-4 hover:bg-red-400/25 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-red-400 mb-1">
                {rows.filter((r) => getCarRowStatus(r) === "ซ่อมบำรุง").length}
              </div>
              <div className="text-sm text-slate-300">ซ่อมบำรุง</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-red-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Data Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            รายการรถยนต์ทั้งหมด
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            แสดงข้อมูลรถยนต์ทั้งหมด {rows.length} คัน
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10">
                  #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10">
                  รถยนต์
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10">
                  ป้ายทะเบียน
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10">
                  ราคา/วัน
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-300"
                  >
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      กำลังโหลดข้อมูล...
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-300"
                  >
                    {searchTerm ? "ไม่พบข้อมูลที่ค้นหา" : "ไม่พบข้อมูลรถยนต์"}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-lg object-cover border border-white/20"
                            src={row.imageData || "/noimage.jpg"}
                            alt={row.name}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {row.name}
                          </div>
                          <div className="text-sm text-slate-300">
                            {row.brand}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-mono">
                      {row.licensePlate || "—"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {fmtBaht(
                        Number(
                          row.pricePerDay ||
                            row.price_per_day ||
                            row.price ||
                            row.rate ||
                            row.rate_per_day ||
                            0
                        )
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge value={getCarRowStatus(row)} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            console.log("Edit button clicked for row:", row);
                            openEdit(row);
                          }}
                          className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200 cursor-pointer"
                          title="แก้ไข"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            console.log("Delete button clicked for row:", row);
                            openDelete(row);
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors duration-200 cursor-pointer"
                          title="ลบ"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {loading && rows.length === 0 ? (
            <div className="p-8 text-center text-slate-300">
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                กำลังโหลดข้อมูล...
              </div>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-8 text-center text-slate-300">
              {searchTerm ? "ไม่พบข้อมูลที่ค้นหา" : "ไม่พบข้อมูลรถยนต์"}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredRows.map((row, idx) => (
                <div
                  key={row.id}
                  className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 hover:bg-white/15 transition-all duration-200"
                >
                  {/* Header with image and basic info */}
                  <div className="flex items-start gap-4 mb-3">
                    <div className="flex-shrink-0">
                      <img
                        className="h-16 w-20 rounded-lg object-cover border border-white/20"
                        src={row.imageData || "/noimage.jpg"}
                        alt={row.name}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {row.name}
                      </h3>
                      <p className="text-sm text-slate-300 truncate">
                        {row.brand}
                      </p>
                      <div className="mt-1">
                        <StatusBadge value={getCarRowStatus(row)} />
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">ป้ายทะเบียน:</span>
                      <p className="text-white font-mono font-medium">
                        {row.licensePlate || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">ราคา/วัน:</span>
                      <p className="text-white font-semibold">
                        {fmtBaht(
                          Number(
                            row.pricePerDay ||
                              row.price_per_day ||
                              row.price ||
                              row.rate ||
                              row.rate_per_day ||
                              0
                          )
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        console.log("Edit button clicked for row:", row);
                        openEdit(row);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 transition-all duration-200 text-sm font-medium"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => {
                        console.log("Delete button clicked for row:", row);
                        openDelete(row);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all duration-200 text-sm font-medium"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Edit Modal */}
      <Modal open={editOpen} onClose={closeEdit}>
        <div className="w-full max-w-6xl rounded-3xl bg-gradient-to-br from-slate-900/95 via-black/95 to-slate-800/95 backdrop-blur-xl p-8 shadow-2xl text-white border border-white/20 max-h-[90vh] overflow-y-auto relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full blur-2xl animate-pulse" />
            <div
              className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-orange-400/20 to-yellow-500/20 rounded-full blur-2xl animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-2xl mb-4 border border-yellow-500/30">
                <svg
                  className="w-8 h-8 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                แก้ไขข้อมูลรถ
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                อัปเดตข้อมูลรถยนต์และรูปภาพ
              </p>

              {/* Current Car Info Summary */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span className="text-white font-semibold">
                    {editForm.name || "รถยนต์"}
                  </span>
                </div>
                <div className="text-sm text-slate-300 space-y-1">
                  <div className="flex justify-center gap-4">
                    <span>
                      ป้ายทะเบียน:{" "}
                      <span className="text-yellow-400 font-medium">
                        {editForm.licensePlate || "ไม่ระบุ"}
                      </span>
                    </span>
                    <span>
                      ยี่ห้อ:{" "}
                      <span className="text-yellow-400 font-medium">
                        {editForm.brand || "ไม่ระบุ"}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-center gap-4">
                    <span>
                      ประเภทรถ:{" "}
                      <span className="text-yellow-400 font-medium">
                        {editForm.type || "ไม่ระบุ"}
                      </span>
                    </span>
                    <span>
                      ราคา:{" "}
                      <span className="text-yellow-400 font-medium">
                        {editForm.pricePerDay
                          ? `฿${editForm.pricePerDay.toLocaleString()}`
                          : "ไม่ระบุ"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Form */}
              <div className="space-y-6">
                {/* ชื่อรถ */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    ชื่อรถ *
                  </label>
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) =>
                      handleEditFormChange("name", e.target.value)
                    }
                    className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                    placeholder={editForm.name || "เช่น Toyota Camry"}
                  />
                </div>

                {/* ยี่ห้อ */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    ยี่ห้อ
                  </label>
                  <input
                    type="text"
                    value={editForm.brand || ""}
                    onChange={(e) =>
                      handleEditFormChange("brand", e.target.value)
                    }
                    className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                    placeholder="เช่น Toyota"
                  />
                </div>

                {/* ป้ายทะเบียน - Disabled */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    ป้ายทะเบียน *
                    <span className="ml-2 text-xs text-slate-400">
                      (ไม่สามารถแก้ไขได้)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={editForm.licensePlate || ""}
                    disabled
                    className="w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-slate-400 cursor-not-allowed"
                    placeholder="เช่น กก-1234"
                  />
                </div>

                {/* ราคา/วัน */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    ราคา/วัน (บาท) *
                  </label>
                  <input
                    type="number"
                    value={editForm.pricePerDay || ""}
                    onChange={(e) =>
                      handleEditFormChange(
                        "pricePerDay",
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                    placeholder="เช่น 1000"
                    min="0"
                  />
                </div>

                {/* ประเภทรถ */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    ประเภทรถ
                  </label>
                  <select
                    value={editForm.type || "Sedan"}
                    onChange={(e) =>
                      handleEditFormChange("type", e.target.value)
                    }
                    className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                  >
                    <option value="Sedan" className="bg-slate-800 text-white">
                      Sedan
                    </option>
                    <option value="SUV" className="bg-slate-800 text-white">
                      SUV
                    </option>
                    <option
                      value="Hatchback"
                      className="bg-slate-800 text-white"
                    >
                      Hatchback
                    </option>
                    <option value="Pickup" className="bg-slate-800 text-white">
                      Pickup
                    </option>
                    <option value="Van" className="bg-slate-800 text-white">
                      Van
                    </option>
                  </select>
                </div>

                {/* สถานะ */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    สถานะ
                  </label>
                  <select
                    value={editForm.status || "Available"}
                    onChange={(e) =>
                      handleEditFormChange("status", e.target.value)
                    }
                    className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                  >
                    <option
                      value="Available"
                      className="bg-slate-800 text-white"
                    >
                      ว่าง
                    </option>
                    <option value="In Rent" className="bg-slate-800 text-white">
                      ถูกจอง
                    </option>
                    <option value="In Use" className="bg-slate-800 text-white">
                      ถูกยืมอยู่
                    </option>
                    <option
                      value="Maintenance"
                      className="bg-slate-800 text-white"
                    >
                      ซ่อมบำรุง
                    </option>
                  </select>
                </div>

                {/* จำนวนที่นั่ง */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    จำนวนที่นั่ง
                  </label>
                  <input
                    type="number"
                    value={editForm.seats || ""}
                    onChange={(e) =>
                      handleEditFormChange("seats", Number(e.target.value))
                    }
                    className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                    placeholder={
                      editForm.seats ? editForm.seats.toString() : "เช่น 5"
                    }
                    min="1"
                    max="20"
                  />
                </div>

                {/* ปีที่ผลิต */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    ปีที่ผลิต
                  </label>
                  <input
                    type="number"
                    value={editForm.year || ""}
                    onChange={(e) =>
                      handleEditFormChange("year", Number(e.target.value))
                    }
                    className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                    placeholder={
                      editForm.year ? editForm.year.toString() : "เช่น 2020"
                    }
                    min="1990"
                    max="2024"
                  />
                </div>

                {/* ระบบเกียร์ */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    ระบบเกียร์
                  </label>
                  <select
                    value={editForm.transmission || ""}
                    onChange={(e) =>
                      handleEditFormChange("transmission", e.target.value)
                    }
                    className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                  >
                    <option value="" className="bg-slate-800 text-white">
                      {editForm.transmission || "เลือกระบบเกียร์"}
                    </option>
                    <option value="Manual" className="bg-slate-800 text-white">
                      Manual
                    </option>
                    <option
                      value="Automatic"
                      className="bg-slate-800 text-white"
                    >
                      Automatic
                    </option>
                    <option value="CVT" className="bg-slate-800 text-white">
                      CVT
                    </option>
                    <option
                      value="อัตโนมัติ"
                      className="bg-slate-800 text-white"
                    >
                      อัตโนมัติ
                    </option>
                    <option value="ธรรมดา" className="bg-slate-800 text-white">
                      ธรรมดา
                    </option>
                  </select>
                </div>

                {/* ประเภทเชื้อเพลิง */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    ประเภทเชื้อเพลิง
                  </label>
                  <select
                    value={editForm.fuel || ""}
                    onChange={(e) =>
                      handleEditFormChange("fuel", e.target.value)
                    }
                    className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                  >
                    <option value="" className="bg-slate-800 text-white">
                      {editForm.fuel || "เลือกประเภทเชื้อเพลิง"}
                    </option>
                    <option
                      value="Gasoline"
                      className="bg-slate-800 text-white"
                    >
                      Gasoline (เบนซิน)
                    </option>
                    <option value="Diesel" className="bg-slate-800 text-white">
                      Diesel (ดีเซล)
                    </option>
                    <option value="Hybrid" className="bg-slate-800 text-white">
                      Hybrid
                    </option>
                    <option
                      value="Electric"
                      className="bg-slate-800 text-white"
                    >
                      Electric
                    </option>
                    <option value="เบนซิน" className="bg-slate-800 text-white">
                      เบนซิน
                    </option>
                    <option value="ดีเซล" className="bg-slate-800 text-white">
                      ดีเซล
                    </option>
                  </select>
                </div>

                {/* บริษัท */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    บริษัท
                  </label>
                  <input
                    type="text"
                    value={editForm.company || ""}
                    onChange={(e) =>
                      handleEditFormChange("company", e.target.value)
                    }
                    className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                    placeholder={editForm.company || "เช่น V-Rent"}
                  />
                </div>

                {/* คำอธิบาย */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    คำอธิบาย
                  </label>
                  <textarea
                    value={editForm.description || ""}
                    onChange={(e) =>
                      handleEditFormChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                    placeholder="คำอธิบายเพิ่มเติม..."
                  />
                </div>
              </div>

              {/* Right Column - Image Upload */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-4">
                    รูปรถยนต์
                  </label>

                  {/* Current Image Display */}
                  {editForm.image && !imagePreview && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-300 mb-2">
                        รูปปัจจุบัน:
                      </p>
                      <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-white/5 border border-white/20">
                        <img
                          src={normalizeImage(editForm.image)}
                          alt="Current car image"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextElementSibling.style.display = "flex";
                          }}
                        />
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-slate-800/50 text-slate-400"
                          style={{ display: "none" }}
                        >
                          <div className="text-center">
                            <svg
                              className="w-8 h-8 mx-auto mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <p className="text-xs">ไม่สามารถโหลดรูปได้</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* New Image Preview */}
                  {imagePreview && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-300 mb-2">รูปใหม่:</p>
                      <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-white/5 border border-white/20">
                        <img
                          src={imagePreview}
                          alt="New car image preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={removeImage}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* File Upload */}
                  <div className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center hover:border-yellow-400/50 transition-colors duration-300">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-xl flex items-center justify-center border border-yellow-400/30">
                        <svg
                          className="w-6 h-6 text-yellow-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {selectedImage ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพ"}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                          PNG, JPG, JPEG (สูงสุด 5MB)
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Upload Progress */}
                  {uploadingImage && (
                    <div className="mt-4">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-slate-300 text-sm">
                          กำลังอัปโหลด...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={closeEdit}
                disabled={editLoading}
                className="flex-1 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                ยกเลิก
              </button>
              <button
                onClick={doEdit}
                disabled={editLoading}
                className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-yellow-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-yellow-400/25 flex items-center justify-center gap-2"
              >
                {editLoading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    บันทึกการแก้ไข
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Enhanced Delete Confirmation Modal */}
      <Modal open={delOpen} onClose={closeDelete}>
        <div className="w-full max-w-lg rounded-3xl bg-gradient-to-br from-slate-900/95 via-black/95 to-slate-800/95 backdrop-blur-xl p-8 shadow-2xl text-white border border-white/20 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-red-400/20 to-red-600/20 rounded-full blur-2xl animate-pulse" />
            <div
              className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full blur-2xl animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </div>

          <div className="relative z-10">
            {/* Header with Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-2xl mb-4 border border-red-500/30">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                ยืนยันการลบรถ
              </h3>
              <p className="text-slate-400 text-sm">
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>

            {/* Vehicle Information Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-xl flex items-center justify-center border border-yellow-400/30">
                  <svg
                    className="w-6 h-6 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-1">
                    {selectedName || "รถยนต์"}
                  </h4>
                  {selectedPlate && (
                    <p className="text-slate-300 text-sm">
                      ป้ายทะเบียน:{" "}
                      <span className="font-semibold text-yellow-400">
                        {selectedPlate}
                      </span>
                    </p>
                  )}
                  {!selectedPlate && selectedId && (
                    <p className="text-slate-300 text-sm">
                      หมายเลข:{" "}
                      <span className="font-semibold text-yellow-400">
                        #{selectedId}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <h5 className="text-red-400 font-semibold text-sm mb-1">
                    คำเตือน
                  </h5>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    การลบรถจะทำให้ข้อมูลรถและประวัติการจองที่เกี่ยวข้องถูกลบออกจากระบบอย่างถาวร
                    กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={closeDelete}
                disabled={deleteLoading}
                className="flex-1 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                ยกเลิก
              </button>
              <button
                onClick={doDelete}
                disabled={deleteLoading}
                className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/25 flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    กำลังลบ...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    ลบรถ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Success Confirmation Modal */}
      <Modal open={editSuccessOpen} onClose={closeEditSuccess}>
        <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-slate-900/95 via-black/95 to-slate-800/95 backdrop-blur-xl p-8 shadow-2xl text-white border border-white/20 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-2xl animate-pulse" />
            <div
              className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-full blur-2xl animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </div>

          <div className="relative z-10">
            {/* Header with Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl mb-4 border border-green-500/30">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                แก้ไขข้อมูลสำเร็จ
              </h3>
              <p className="text-slate-400 text-sm">
                ข้อมูลรถยนต์ได้ถูกอัปเดตเรียบร้อยแล้ว
              </p>
            </div>

            {/* Success Message Card */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-green-400 font-semibold text-sm mb-1">
                    สำเร็จ
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    การแก้ไขข้อมูลรถยนต์เสร็จสมบูรณ์
                    ข้อมูลใหม่ได้ถูกบันทึกในระบบแล้ว
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={closeEditSuccess}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold hover:from-emerald-500 hover:to-green-400 transition-all duration-300 shadow-lg hover:shadow-green-400/25 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                ตกลง
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
