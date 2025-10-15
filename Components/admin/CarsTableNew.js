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
  "http://203.154.83.160/api/method/frappe.api.api.edit_vehicle";

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
      <div className="relative min-h-full flex items-start justify-center p-4">
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
    return cars.map((car, idx) => ({
      ...car,
      _idx: idx,
    }));
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
    setEditForm({ ...row });
    setEditOpen(true);
  };

  const openDelete = (row) => {
    setSelectedId(row.id);
    setSelectedName(row.name);
    setSelectedPlate(row.licensePlate);
    setDelOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditForm({});
  };

  const closeDelete = () => {
    setDelOpen(false);
    setSelectedId(null);
    setSelectedName("");
    setSelectedPlate("");
  };

  const doDelete = async () => {
    if (!selectedId) return;
    try {
      setLoading(true);
      const res = await fetch(ERP_DELETE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      alert("ลบรถสำเร็จ");
      onDelete?.();
      closeDelete();
    } catch (err) {
      alert(err?.message || "ลบรถไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = () => {
    if (onAddCar) {
      onAddCar();
    } else {
      // Fallback: scroll to AddCarCard in main page
      const addCarElement = document.querySelector("[data-add-car-card]");
      if (addCarElement) {
        addCarElement.scrollIntoView({ behavior: "smooth" });
      }
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
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหารถยนต์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-10 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
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
        </div>
        <div className="flex gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
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

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </button>

          {/* Add Car Button */}
          <button
            onClick={handleAddCar}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-yellow-400 transition-all duration-300"
            title="เพิ่มรถใหม่ (จะเลื่อนไปยังฟอร์มเพิ่มรถ)"
          >
            เพิ่มรถใหม่
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
          <div className="text-2xl font-bold text-white">{rows.length}</div>
          <div className="text-sm text-slate-300">รถทั้งหมด</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
          <div className="text-2xl font-bold text-green-400">
            {rows.filter((r) => getCarRowStatus(r) === "ว่าง").length}
          </div>
          <div className="text-sm text-slate-300">ว่าง</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
          <div className="text-2xl font-bold text-blue-400">
            {rows.filter((r) => getCarRowStatus(r) === "ถูกจอง").length}
          </div>
          <div className="text-sm text-slate-300">ถูกจอง</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
          <div className="text-2xl font-bold text-red-400">
            {rows.filter((r) => getCarRowStatus(r) === "ซ่อมบำรุง").length}
          </div>
          <div className="text-sm text-slate-300">ซ่อมบำรุง</div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/10 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  รถยนต์
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  ป้ายทะเบียน
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  ราคา/วัน
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                      {fmtBaht(row.pricePerDay)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={getCarRowStatus(row)} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(row)}
                          className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
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
                          onClick={() => openDelete(row)}
                          className="text-red-400 hover:text-red-300 transition-colors duration-200"
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
      </div>

      {/* Modal: แก้ไข */}
      <Modal open={editOpen} onClose={closeEdit}>
        <div className="w-full max-w-2xl rounded-2xl bg-gradient-to-br from-slate-900 via-black to-slate-800 p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto border border-white/20">
          <h3 className="text-xl font-bold mb-4">แก้ไขข้อมูลรถ</h3>
          <p className="text-slate-300 mb-6">อัปเดตข้อมูลรถยนต์</p>
          {/* Form content would go here */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={closeEdit}
              className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => {
                // Save logic
                closeEdit();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-yellow-400 transition-all duration-300"
            >
              บันทึก
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: ยืนยันลบ */}
      <Modal open={delOpen} onClose={closeDelete}>
        <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-900 via-black to-slate-800 p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto border border-white/20">
          <h3 className="text-xl font-bold mb-4">ยืนยันการลบ</h3>
          <p className="text-slate-300 mb-6">
            ต้องการลบรถ{" "}
            {selectedName ? (
              <span className="font-semibold text-white">{selectedName}</span>
            ) : null}{" "}
            {selectedPlate ? (
              <span className="text-slate-300">
                (ป้ายทะเบียน{" "}
                <span className="font-semibold text-white">
                  {selectedPlate}
                </span>
                )
              </span>
            ) : (
              <span className="text-slate-300">
                หมายเลข{" "}
                <span className="font-semibold text-white">#{selectedId}</span>
              </span>
            )}{" "}
            ใช่หรือไม่?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={closeDelete}
              className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              ยกเลิก
            </button>
            <button
              onClick={doDelete}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300"
            >
              ลบ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
