// Components/admin/BookingsTableNew.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.154.83.160";

function normalizeFileUrl(u) {
  if (!u) return "";
  let s = String(u).trim();
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("/")) s = ERP_BASE.replace(/\/+$/, "") + s;
  if (!/^https?:\/\//i.test(s)) {
    s = ERP_BASE.replace(/\/+$/, "") + "/" + s.replace(/^\/+/, "");
  }
  return encodeURI(s);
}

const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const s = String(val).trim();
  if (/^\d{10,13}$/.test(s)) {
    const ms = s.length === 13 ? Number(s) : Number(s) * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  let isoish = s.includes("T") ? s : s.replace(" ", "T");
  isoish = isoish.replace(/\.(\d{3})\d+/, ".$1");

  let d = new Date(isoish);
  if (!isNaN(d.getTime())) return d;

  const [datePart, timePart = ""] = s.split(/[ T]/);
  const [yy, mm = 1, dd = 1] = (datePart || "")
    .split("-")
    .map((n) => parseInt(n, 10));
  const [hh = 0, mi = 0, ssRaw = 0] = timePart.split(":");
  const ss = parseInt(String(ssRaw).split(".")[0] || "0", 10);

  d = new Date(
    yy,
    (parseInt(mm, 10) || 1) - 1,
    parseInt(dd, 10) || 1,
    parseInt(hh, 10) || 0,
    parseInt(mi, 10) || 0,
    ss || 0
  );
  return isNaN(d.getTime()) ? null : d;
};

const fmtDateTimeLocal = (val) => {
  const d = toDate(val);
  if (!d) return "-";
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const computeDays = (a, b) => {
  const A = toDate(a);
  const B = toDate(b);
  if (!A || !B) return 1;
  const diff = Math.ceil((B - A) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
};

const fmtBaht = (n) => Number(n || 0).toLocaleString("th-TH");

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

function StatusBadge({ status }) {
  const getStatusColor = (status) => {
    const s = String(status || "")
      .toLowerCase()
      .trim();
    if (s.includes("confirmed") || s.includes("ยืนยัน")) {
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    }
    if (s.includes("in use") || s.includes("กำลังเช่า")) {
      return "bg-green-500/20 text-green-300 border-green-500/30";
    }
    if (s.includes("completed") || s.includes("เสร็จสิ้น")) {
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    }
    if (s.includes("cancelled") || s.includes("ยกเลิก")) {
      return "bg-red-500/20 text-red-300 border-red-500/30";
    }
    return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border ${getStatusColor(
        status
      )}`}
    >
      {status || "—"}
    </span>
  );
}

function PaymentBadge({ status }) {
  const getPaymentColor = (status) => {
    const s = String(status || "")
      .toLowerCase()
      .trim();
    if (s.includes("paid") || s.includes("จ่ายแล้ว")) {
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    }
    if (s.includes("partial") || s.includes("บางส่วน")) {
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    }
    if (s.includes("pending") || s.includes("รอจ่าย")) {
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    }
    return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border ${getPaymentColor(
        status
      )}`}
    >
      {status || "—"}
    </span>
  );
}

export default function BookingsTableNew({
  bookings = [],
  carMapById = new Map(),
  carMapByKey = new Map(),
  onOpenDetail = () => {},
  onConfirmPickup = () => {},
  onComplete = () => {},
  onFetchBookings, // เพิ่มใหม่
}) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Smooth scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Process bookings data
  const rows = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    return bookings.map((booking, idx) => ({
      ...booking,
      _idx: idx,
      car: carMapById.get(booking.carId) || carMapByKey.get(booking.carKey),
    }));
  }, [bookings, carMapById, carMapByKey]);

  // Filter bookings
  const filteredRows = useMemo(() => {
    let filtered = rows;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.customerName?.toLowerCase().includes(term) ||
          row.carName?.toLowerCase().includes(term) ||
          row.id?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((row) => {
        const status = String(row.status || "").toLowerCase();
        return status.includes(statusFilter);
      });
    }

    return filtered;
  }, [rows, searchTerm, statusFilter]);

  const openDetail = (booking) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
    onOpenDetail(booking);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedBooking(null);
  };

  const handleConfirmPickup = async (booking) => {
    try {
      setLoading(true);
      await onConfirmPickup(booking);
    } catch (error) {
      console.error("Error confirming pickup:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (booking) => {
    try {
      setLoading(true);
      await onComplete(booking);
    } catch (error) {
      console.error("Error completing booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (booking) => {
    setEditForm({ ...booking });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditForm({});
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const doEdit = async () => {
    const bookingId = editForm.name || editForm.id || editForm.key;
    if (!bookingId) {
      alert("ไม่พบ ID ของการจอง");
      return;
    }

    try {
      setEditLoading(true);

      // Validate required fields
      const customerName = editForm.customer_name || editForm.customerName;
      const customerPhone = editForm.customer_phone || editForm.customerPhone;
      const pickupDate = editForm.pickup_date || editForm.pickupDate;
      const returnDate = editForm.return_date || editForm.returnDate;

      if (!customerName?.trim()) {
        alert("กรุณากรอกชื่อลูกค้า");
        return;
      }
      if (!customerPhone?.trim()) {
        alert("กรุณากรอกเบอร์โทรศัพท์");
        return;
      }
      if (!pickupDate) {
        alert("กรุณาเลือกวันที่รับรถ");
        return;
      }
      if (!returnDate) {
        alert("กรุณาเลือกวันที่คืนรถ");
        return;
      }

      console.log("Sending edit request:", editForm);

      // TODO: Replace with actual API endpoint
      const res = await fetch("/api/bookings/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bookingId,
          customer_name: customerName,
          customer_phone: customerPhone,
          pickup_date: pickupDate,
          return_date: returnDate,
          pickup_place: editForm.pickup_place || editForm.pickupLocation || "",
          return_place: editForm.return_place || editForm.returnLocation || "",
          remarks: editForm.remarks || editForm.notes || "",
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Edit failed (${res.status})`);
      }

      alert("แก้ไขข้อมูลการจองสำเร็จ");
      onFetchBookings?.(); // Refresh the data
      closeEdit();
    } catch (err) {
      console.error("Edit error:", err);
      alert(err?.message || "แก้ไขข้อมูลการจองไม่สำเร็จ");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาการจอง..."
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
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
          >
            <option value="all" className="bg-slate-800 text-white">
              ทุกสถานะ
            </option>
            <option value="confirmed" className="bg-slate-800 text-white">
              ยืนยันแล้ว
            </option>
            <option value="in use" className="bg-slate-800 text-white">
              กำลังเช่า
            </option>
            <option value="completed" className="bg-slate-800 text-white">
              เสร็จสิ้น
            </option>
            <option value="cancelled" className="bg-slate-800 text-white">
              ยกเลิก
            </option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={async () => {
              try {
                setLoading(true);
                if (onFetchBookings) {
                  await onFetchBookings();
                }
                console.log("ข้อมูลการจองได้รับการอัปเดตแล้ว");
              } catch (error) {
                console.error("Error refreshing bookings:", error);
                alert("เกิดข้อผิดพลาดในการรีเฟรชข้อมูล");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-3">
          <div className="text-xl md:text-2xl font-bold text-white">
            {rows.length}
          </div>
          <div className="text-xs md:text-sm text-slate-300">การจองทั้งหมด</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-3">
          <div className="text-xl md:text-2xl font-bold text-blue-400">
            {
              rows.filter((r) =>
                String(r.status || "")
                  .toLowerCase()
                  .includes("confirmed")
              ).length
            }
          </div>
          <div className="text-xs md:text-sm text-slate-300">ยืนยันแล้ว</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-3">
          <div className="text-xl md:text-2xl font-bold text-green-400">
            {
              rows.filter((r) =>
                String(r.status || "")
                  .toLowerCase()
                  .includes("in use")
              ).length
            }
          </div>
          <div className="text-xs md:text-sm text-slate-300">กำลังเช่า</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-3">
          <div className="text-xl md:text-2xl font-bold text-emerald-400">
            {
              rows.filter((r) =>
                String(r.status || "")
                  .toLowerCase()
                  .includes("completed")
              ).length
            }
          </div>
          <div className="text-xs md:text-sm text-slate-300">เสร็จสิ้น</div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/10 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  ลูกค้า
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  รถยนต์
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  วันที่
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  ราคา
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
                    colSpan={7}
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
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-300"
                  >
                    {searchTerm ? "ไม่พบข้อมูลที่ค้นหา" : "ไม่พบข้อมูลการจอง"}
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
                      <div className="text-sm font-medium text-white">
                        {row.customer_name || row.customerName || "—"}
                      </div>
                      <div className="text-sm text-slate-300">
                        {row.customer_phone || row.customerPhone || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {row.vehicle || row.carName || "—"}
                      </div>
                      <div className="text-sm text-slate-300">
                        {row.license_plate || row.carPlate || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      <div>
                        {fmtDateTimeLocal(row.pickup_date || row.pickupDate)}
                      </div>
                      <div className="text-xs text-slate-300">
                        ถึง{" "}
                        {fmtDateTimeLocal(row.return_date || row.returnDate)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {fmtBaht(row.total_price || row.totalPrice || 0)} ฿
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={row.status} />
                        <PaymentBadge
                          status={row.payment_status || row.paymentStatus}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetail(row)}
                          className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                          title="ดูรายละเอียด"
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => openEdit(row)}
                          className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
                          title="แก้ไขข้อมูลการจอง"
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
                        {String(row.status || "")
                          .toLowerCase()
                          .includes("confirmed") && (
                          <button
                            onClick={() => handleConfirmPickup(row)}
                            className="text-green-400 hover:text-green-300 transition-colors duration-200"
                            title="ยืนยันการรับรถ"
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
                          </button>
                        )}
                        {String(row.status || "")
                          .toLowerCase()
                          .includes("in use") && (
                          <button
                            onClick={() => handleComplete(row)}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
                            title="เสร็จสิ้น"
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
                                d="M9 12l2 2 4-4"
                              />
                            </svg>
                          </button>
                        )}
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
              {searchTerm ? "ไม่พบข้อมูลที่ค้นหา" : "ไม่พบข้อมูลการจอง"}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredRows.map((row, idx) => (
                <div
                  key={row.id}
                  className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 hover:bg-white/15 transition-all duration-200"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        #{idx + 1}
                      </h3>
                      <div className="mt-1">
                        <StatusBadge status={row.status} />
                      </div>
                    </div>
                    <div className="text-right text-sm text-slate-300">
                      <div>{fmtBaht(row.total_price || row.totalPrice)} ฿</div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3">
                    <div className="text-sm text-slate-400 mb-1">ลูกค้า:</div>
                    <div className="text-white font-medium">
                      {row.customer_name || row.customerName || "—"}
                    </div>
                    <div className="text-sm text-slate-300">
                      {row.customer_phone || row.customerPhone || "—"}
                    </div>
                  </div>

                  {/* Car Info */}
                  <div className="mb-3">
                    <div className="text-sm text-slate-400 mb-1">รถยนต์:</div>
                    <div className="text-white font-medium">
                      {row.vehicle || row.carName || "—"}
                    </div>
                    <div className="text-sm text-slate-300 font-mono">
                      {row.license_plate || row.carPlate || "—"}
                    </div>
                  </div>

                  {/* Date Info */}
                  <div className="mb-4">
                    <div className="text-sm text-slate-400 mb-1">วันที่:</div>
                    <div className="text-white text-sm">
                      {fmtDateTimeLocal(row.pickup_date || row.pickupDate)} -{" "}
                      {fmtDateTimeLocal(row.return_date || row.returnDate)}
                    </div>
                    <div className="text-xs text-slate-300">
                      {computeDays(
                        row.pickup_date || row.pickupDate,
                        row.return_date || row.returnDate
                      )}{" "}
                      วัน
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openDetail(row)}
                      className="flex-1 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-200 text-xs font-medium"
                    >
                      ดูรายละเอียด
                    </button>
                    <button
                      onClick={() => openEdit(row)}
                      className="flex-1 px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 transition-all duration-200 text-xs font-medium"
                    >
                      แก้ไข
                    </button>
                  </div>

                  {/* Status Action buttons */}
                  <div className="flex gap-2 mt-2">
                    {String(row.status || "")
                      .toLowerCase()
                      .includes("confirmed") && (
                      <button
                        onClick={() => handleConfirmPickup(row)}
                        className="flex-1 px-3 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all duration-200 text-xs font-medium"
                      >
                        ยืนยันรับรถ
                      </button>
                    )}

                    {String(row.status || "")
                      .toLowerCase()
                      .includes("in use") && (
                      <button
                        onClick={() => handleComplete(row)}
                        className="flex-1 px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 transition-all duration-200 text-xs font-medium"
                      >
                        เสร็จสิ้น
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={closeDetail}>
        <div className="w-full max-w-3xl rounded-2xl bg-gradient-to-br from-slate-900 via-black to-slate-800 p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto border border-white/20">
          <h3 className="text-xl font-bold mb-4">รายละเอียดการจอง</h3>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-yellow-400 mb-3">
                  ข้อมูลลูกค้า
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300">ชื่อลูกค้า</label>
                    <div className="text-white font-medium">
                      {selectedBooking.customer_name ||
                        selectedBooking.customerName ||
                        "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">
                      เบอร์โทรศัพท์
                    </label>
                    <div className="text-white">
                      {selectedBooking.customer_phone ||
                        selectedBooking.customerPhone ||
                        "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">อีเมล</label>
                    <div className="text-white">
                      {selectedBooking.customerEmail || "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">ที่อยู่</label>
                    <div className="text-white">
                      {selectedBooking.customerAddress || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Car Information */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-yellow-400 mb-3">
                  ข้อมูลรถยนต์
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300">รถยนต์</label>
                    <div className="text-white font-medium">
                      {selectedBooking.vehicle ||
                        selectedBooking.carName ||
                        "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">
                      ป้ายทะเบียน
                    </label>
                    <div className="text-white font-mono">
                      {selectedBooking.license_plate ||
                        selectedBooking.carPlate ||
                        "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">ยี่ห้อ</label>
                    <div className="text-white">
                      {selectedBooking.carBrand || "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">ประเภทรถ</label>
                    <div className="text-white">
                      {selectedBooking.carType || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-yellow-400 mb-3">
                  ข้อมูลการจอง
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300">รหัสการจอง</label>
                    <div className="text-white font-mono">
                      {selectedBooking.name || selectedBooking.id || "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">วันที่จอง</label>
                    <div className="text-white">
                      {fmtDateTimeLocal(selectedBooking.bookingDate) || "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">
                      วันที่รับรถ
                    </label>
                    <div className="text-white">
                      {fmtDateTimeLocal(
                        selectedBooking.pickup_date ||
                          selectedBooking.pickupDate
                      ) || "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">
                      วันที่คืนรถ
                    </label>
                    <div className="text-white">
                      {fmtDateTimeLocal(
                        selectedBooking.return_date ||
                          selectedBooking.returnDate
                      ) || "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">จำนวนวัน</label>
                    <div className="text-white">
                      {computeDays(
                        selectedBooking.pickup_date ||
                          selectedBooking.pickupDate,
                        selectedBooking.return_date ||
                          selectedBooking.returnDate
                      )}{" "}
                      วัน
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">ราคารวม</label>
                    <div className="text-white font-semibold">
                      {fmtBaht(
                        selectedBooking.total_price ||
                          selectedBooking.totalPrice ||
                          0
                      )}{" "}
                      ฿
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-yellow-400 mb-3">
                  ข้อมูลสถานที่
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300">
                      สถานที่รับรถ
                    </label>
                    <div className="text-white">
                      {selectedBooking.pickup_place ||
                        selectedBooking.pickupLocation ||
                        "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">
                      สถานที่คืนรถ
                    </label>
                    <div className="text-white">
                      {selectedBooking.return_place ||
                        selectedBooking.returnLocation ||
                        "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-yellow-400 mb-3">
                  สถานะ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300">
                      สถานะการจอง
                    </label>
                    <div className="mt-1">
                      <StatusBadge status={selectedBooking.status} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">
                      สถานะการชำระเงิน
                    </label>
                    <div className="mt-1">
                      <PaymentBadge
                        status={
                          selectedBooking.payment_status ||
                          selectedBooking.paymentStatus
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-yellow-400 mb-3">
                    หมายเหตุ
                  </h4>
                  <div className="text-white">{selectedBooking.notes}</div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={closeDetail}
              className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              ปิด
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={closeEdit}>
        <div className="w-full max-w-2xl rounded-2xl bg-gradient-to-br from-slate-900 via-black to-slate-800 p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto border border-white/20">
          <h3 className="text-xl font-bold mb-4">แก้ไขข้อมูลการจอง</h3>
          <p className="text-slate-300 mb-6">อัปเดตข้อมูลการจองรถยนต์</p>

          {/* Form */}
          <div className="space-y-4">
            {/* ชื่อลูกค้า */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                ชื่อลูกค้า *
              </label>
              <input
                type="text"
                value={editForm.customer_name || editForm.customerName || ""}
                onChange={(e) =>
                  handleEditFormChange("customer_name", e.target.value)
                }
                className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                placeholder="เช่น สมชาย ใจดี"
              />
            </div>

            {/* เบอร์โทรศัพท์ */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                เบอร์โทรศัพท์ *
              </label>
              <input
                type="tel"
                value={editForm.customer_phone || editForm.customerPhone || ""}
                onChange={(e) =>
                  handleEditFormChange("customer_phone", e.target.value)
                }
                className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                placeholder="เช่น 081-234-5678"
              />
            </div>

            {/* วันที่รับรถ */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                วันที่รับรถ *
              </label>
              <input
                type="datetime-local"
                value={
                  editForm.pickup_date || editForm.pickupDate
                    ? new Date(editForm.pickup_date || editForm.pickupDate)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  handleEditFormChange("pickup_date", e.target.value)
                }
                className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
              />
            </div>

            {/* วันที่คืนรถ */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                วันที่คืนรถ *
              </label>
              <input
                type="datetime-local"
                value={
                  editForm.return_date || editForm.returnDate
                    ? new Date(editForm.return_date || editForm.returnDate)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  handleEditFormChange("return_date", e.target.value)
                }
                className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
              />
            </div>

            {/* สถานที่รับรถ */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                สถานที่รับรถ
              </label>
              <input
                type="text"
                value={editForm.pickup_place || editForm.pickupLocation || ""}
                onChange={(e) =>
                  handleEditFormChange("pickup_place", e.target.value)
                }
                className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                placeholder="เช่น สนามบินสุวรรณภูมิ"
              />
            </div>

            {/* สถานที่คืนรถ */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                สถานที่คืนรถ
              </label>
              <input
                type="text"
                value={editForm.return_place || editForm.returnLocation || ""}
                onChange={(e) =>
                  handleEditFormChange("return_place", e.target.value)
                }
                className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                placeholder="เช่น สนามบินสุวรรณภูมิ"
              />
            </div>

            {/* หมายเหตุ */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                หมายเหตุ
              </label>
              <textarea
                value={editForm.remarks || editForm.notes || ""}
                onChange={(e) =>
                  handleEditFormChange("remarks", e.target.value)
                }
                rows={3}
                className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                placeholder="หมายเหตุเพิ่มเติม..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={closeEdit}
              disabled={editLoading}
              className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              onClick={doEdit}
              disabled={editLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-yellow-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editLoading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
