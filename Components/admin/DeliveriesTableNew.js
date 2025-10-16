// Components/admin/DeliveriesTableNew.jsx
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
    // ทุกสถานะยกเว้น cancelled ให้เป็นสีเขียว (ส่งรถสำเร็จแล้ว)
    if (s.includes("cancelled") || s.includes("ยกเลิก")) {
      return "bg-red-500/20 text-red-300 border-red-500/30";
    }
    // Default เป็นสีเขียวสำหรับ "ส่งรถสำเร็จแล้ว"
    return "bg-green-500/20 text-green-300 border-green-500/30";
  };

  // แปลงสถานะเป็นภาษาไทย
  const getStatusText = (status) => {
    const s = String(status || "")
      .toLowerCase()
      .trim();
    if (s.includes("pending") || s.includes("รอส่ง")) {
      return "ส่งรถสำเร็จแล้ว";
    }
    if (s.includes("in progress") || s.includes("กำลังส่ง")) {
      return "ส่งรถสำเร็จแล้ว";
    }
    if (s.includes("delivered") || s.includes("ส่งแล้ว")) {
      return "ส่งรถสำเร็จแล้ว";
    }
    if (s.includes("cancelled") || s.includes("ยกเลิก")) {
      return "ยกเลิก";
    }
    return "ส่งรถสำเร็จแล้ว"; // Default เป็นส่งรถสำเร็จแล้ว
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border ${getStatusColor(
        status
      )}`}
    >
      {getStatusText(status)}
    </span>
  );
}

export default function DeliveriesTableNew({
  deliveries = [],
  onUpdateStatus = () => {},
  onFetchDeliveries, // เพิ่มใหม่
}) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Delete states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [selectedDeleteName, setSelectedDeleteName] = useState("");

  // Smooth scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Process deliveries data
  const rows = useMemo(() => {
    if (!Array.isArray(deliveries)) return [];
    return deliveries.map((delivery, idx) => ({
      ...delivery,
      _idx: idx,
    }));
  }, [deliveries]);

  // Filter deliveries
  const filteredRows = useMemo(() => {
    let filtered = rows;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.customerName?.toLowerCase().includes(term) ||
          row.carName?.toLowerCase().includes(term) ||
          row.driverName?.toLowerCase().includes(term) ||
          row.id?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((row) => {
        const status = String(row.status || "").toLowerCase();
        if (statusFilter === "completed") {
          // ส่งรถสำเร็จแล้ว = ทุกสถานะยกเว้น cancelled
          return !status.includes("cancelled") && !status.includes("ยกเลิก");
        }
        return status.includes(statusFilter);
      });
    }

    return filtered;
  }, [rows, searchTerm, statusFilter]);

  const openDetail = (delivery) => {
    setSelectedDelivery(delivery);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedDelivery(null);
  };

  // Delete functions
  const openDelete = (delivery) => {
    setSelectedDeleteId(delivery.id);
    setSelectedDeleteName(delivery.customerName || delivery.id);
    setDeleteOpen(true);
  };

  const closeDelete = () => {
    setDeleteOpen(false);
    setSelectedDeleteId(null);
    setSelectedDeleteName("");
  };

  const doDelete = async () => {
    if (!selectedDeleteId) {
      alert("ไม่พบ ID ของรายการส่งมอบ");
      return;
    }

    try {
      setDeleteLoading(true);

      console.log("Sending delete request for delivery ID:", selectedDeleteId);

      const response = await fetch(
        "http://203.154.83.160/api/method/frappe.api.api.delete_dlv",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dlv_id: selectedDeleteId }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Delete failed (${response.status})`
        );
      }

      // แสดง modal ยืนยันการลบ
      setDeleteOpen(false);
      setSelectedDeleteId(null);
      setSelectedDeleteName("");

      // Refresh data
      if (onFetchDeliveries) {
        await onFetchDeliveries();
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert(err?.message || "ลบรายการส่งมอบไม่สำเร็จ");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateStatus = async (delivery, newStatus) => {
    try {
      setLoading(true);
      await onUpdateStatus(delivery, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header with Search and Filters */}
      <div className="space-y-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาการส่งมอบ..."
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
          >
            <option value="all" className="bg-slate-800 text-white">
              ทุกสถานะ
            </option>
            <option value="completed" className="bg-slate-800 text-white">
              ส่งรถสำเร็จแล้ว
            </option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={async () => {
              try {
                setLoading(true);
                if (onFetchDeliveries) {
                  await onFetchDeliveries();
                }
                console.log("ข้อมูลการส่งมอบได้รับการอัปเดตแล้ว");
              } catch (error) {
                console.error("Error refreshing deliveries:", error);
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
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-3">
          <div className="text-xl md:text-2xl font-bold text-white">
            {rows.length}
          </div>
          <div className="text-xs md:text-sm text-slate-300">
            การส่งมอบทั้งหมด
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-3">
          <div className="text-xl md:text-2xl font-bold text-green-400">
            {
              rows.filter((r) => {
                const status = String(r.status || "").toLowerCase();
                return (
                  !status.includes("cancelled") && !status.includes("ยกเลิก")
                );
              }).length
            }
          </div>
          <div className="text-xs md:text-sm text-slate-300">
            ส่งรถสำเร็จแล้ว
          </div>
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
                  พนักงานขับ
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  วันที่ส่ง
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
                    {searchTerm
                      ? "ไม่พบข้อมูลที่ค้นหา"
                      : "ไม่พบข้อมูลการส่งมอบ"}
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
                        {row.customerName || "—"}
                      </div>
                      <div className="text-sm text-slate-300">
                        {row.customerPhone || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {row.carName || "—"}
                      </div>
                      <div className="text-sm text-slate-300">
                        {row.carPlate || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {row.driverName || "—"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {fmtDateTimeLocal(row.deliveryDate)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={row.status} />
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
                        {/* Status Update Buttons - ลบออกเนื่องจากทุกสถานะเป็น ส่งรถสำเร็จแล้ว */}

                        {/* Delete Button */}
                        <button
                          onClick={() => openDelete(row)}
                          className="text-red-400 hover:text-red-300 transition-colors duration-200"
                          title="ลบรายการ"
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
              {searchTerm ? "ไม่พบข้อมูลที่ค้นหา" : "ไม่พบข้อมูลการส่งมอบ"}
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
                      <div>{fmtDateTimeLocal(row.deliveryDate)}</div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3">
                    <div className="text-sm text-slate-400 mb-1">ลูกค้า:</div>
                    <div className="text-white font-medium">
                      {row.customerName || "—"}
                    </div>
                    <div className="text-sm text-slate-300">
                      {row.customerPhone || "—"}
                    </div>
                  </div>

                  {/* Car Info */}
                  <div className="mb-3">
                    <div className="text-sm text-slate-400 mb-1">รถยนต์:</div>
                    <div className="text-white font-medium">
                      {row.carName || "—"}
                    </div>
                    <div className="text-sm text-slate-300 font-mono">
                      {row.carPlate || "—"}
                    </div>
                  </div>

                  {/* Driver Info */}
                  <div className="mb-4">
                    <div className="text-sm text-slate-400 mb-1">
                      พนักงานขับ:
                    </div>
                    <div className="text-white">{row.driverName || "—"}</div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openDetail(row)}
                      className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-200 text-sm font-medium"
                    >
                      ดูรายละเอียด
                    </button>

                    {/* Status Update Buttons - ลบออกเนื่องจากทุกสถานะเป็น ส่งรถสำเร็จแล้ว */}

                    {/* Delete Button */}
                    <button
                      onClick={() => openDelete(row)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all duration-200 text-sm font-medium"
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

      {/* Enhanced Detail Modal */}
      <Modal open={detailOpen} onClose={closeDetail}>
        <div className="w-full max-w-6xl rounded-3xl bg-gradient-to-br from-slate-900/95 via-black/95 to-slate-800/95 backdrop-blur-xl shadow-2xl text-white border border-white/20 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-2xl animate-pulse" />
            <div
              className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-2xl animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </div>

          <div className="relative z-10 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    รายละเอียดการส่งมอบ
                  </h3>
                  <p className="text-slate-300 text-sm">
                    ข้อมูลการส่งมอบรถยนต์ทั้งหมด
                  </p>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={selectedDelivery?.status} />
                </div>
              </div>
            </div>

            {selectedDelivery && (
              <div className="p-6">
                {/* Basic Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    ข้อมูลพื้นฐาน
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        ลูกค้า
                      </label>
                      <div className="text-white font-semibold text-lg">
                        {selectedDelivery.customerName || "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        เบอร์โทรศัพท์
                      </label>
                      <div className="text-white font-medium">
                        {selectedDelivery.customerPhone || "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        หมายเลขรายการ
                      </label>
                      <div className="text-white font-medium">
                        {selectedDelivery.id || "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        รถยนต์
                      </label>
                      <div className="text-white font-semibold text-lg">
                        {selectedDelivery.carName || "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        ป้ายทะเบียน
                      </label>
                      <div className="text-white font-mono font-bold text-lg bg-slate-800/50 rounded-lg px-3 py-2 inline-block">
                        {selectedDelivery.carPlate || "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        พนักงานขับ
                      </label>
                      <div className="text-white font-medium">
                        {selectedDelivery.driverName || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    ข้อมูลการส่งมอบ
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        วันที่ส่ง
                      </label>
                      <div className="text-white font-medium">
                        {fmtDateTimeLocal(selectedDelivery.deliveryDate)}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        สถานะ
                      </label>
                      <div className="mt-1">
                        <StatusBadge status={selectedDelivery.status} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    ข้อมูลเพิ่มเติม
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* ข้อมูลจาก API ที่อาจมี */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        หมายเลขการจอง
                      </label>
                      <div className="text-white font-medium">
                        {selectedDelivery.rental_no ||
                          selectedDelivery.bookingCode ||
                          "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        วันที่สร้าง
                      </label>
                      <div className="text-white font-medium">
                        {fmtDateTimeLocal(selectedDelivery.creation) || "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        สถานะการชำระเงิน
                      </label>
                      <div className="text-white font-medium">
                        {selectedDelivery.downpayment || "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        น้ำมัน
                      </label>
                      <div className="text-white font-medium">
                        {selectedDelivery.fuel || "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        ไมล์
                      </label>
                      <div className="text-white font-medium">
                        {selectedDelivery.mile || "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        เอกสาร
                      </label>
                      <div className="text-white font-medium">
                        {selectedDelivery.document || "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        หมายเหตุ
                      </label>
                      <div className="text-white font-medium">
                        {selectedDelivery.remark || "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        สถานที่รับรถ
                      </label>
                      <div className="text-white font-medium">
                        {selectedDelivery.pickup_place || "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        สถานที่คืนรถ
                      </label>
                      <div className="text-white font-medium">
                        {selectedDelivery.return_place || "—"}
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="text-sm text-slate-400 mb-2 block">
                        วันที่คืนรถ
                      </label>
                      <div className="text-white font-medium">
                        {fmtDateTimeLocal(selectedDelivery.return_date) || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Images Section */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    รูปภาพหลักฐาน
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* รูปภาพยืนยันตัวตน */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        รูปภาพยืนยันตัวตน
                      </h5>
                      <div className="space-y-2">
                        {selectedDelivery.confirm_proofs &&
                        selectedDelivery.confirm_proofs !== "—" ? (
                          <div>
                            <div className="text-green-400 text-sm font-medium mb-2">
                              มีรูปภาพ 1 รูป
                            </div>
                            {selectedDelivery.confirm_proofs &&
                              selectedDelivery.confirm_proofs !== "—" && (
                                <div className="space-y-2">
                                  <img
                                    src={`http://203.154.83.160${selectedDelivery.confirm_proofs}`}
                                    alt="รูปภาพยืนยันตัวตน"
                                    className="w-full h-32 object-cover rounded-lg border border-white/20"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.style.display =
                                        "block";
                                    }}
                                  />
                                  <div
                                    className="text-xs text-slate-300 bg-slate-800/50 rounded p-2 font-mono break-all"
                                    style={{ display: "none" }}
                                  >
                                    {selectedDelivery.confirm_proofs}
                                  </div>
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-sm">
                            ไม่มีรูปภาพ
                          </div>
                        )}
                      </div>
                    </div>

                    {/* รูปภาพรถยนต์ */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-green-400"
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
                        รูปภาพรถยนต์
                      </h5>
                      <div className="space-y-2">
                        {selectedDelivery.car_proofs &&
                        selectedDelivery.car_proofs !== "—" ? (
                          <div>
                            <div className="text-green-400 text-sm font-medium mb-2">
                              มีรูปภาพ 1 รูป
                            </div>
                            {selectedDelivery.car_proofs &&
                              selectedDelivery.car_proofs !== "—" && (
                                <div className="space-y-2">
                                  <img
                                    src={`http://203.154.83.160${selectedDelivery.car_proofs}`}
                                    alt="รูปภาพรถยนต์"
                                    className="w-full h-32 object-cover rounded-lg border border-white/20"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.style.display =
                                        "block";
                                    }}
                                  />
                                  <div
                                    className="text-xs text-slate-300 bg-slate-800/50 rounded p-2 font-mono break-all"
                                    style={{ display: "none" }}
                                  >
                                    {selectedDelivery.car_proofs}
                                  </div>
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-sm">
                            ไม่มีรูปภาพ
                          </div>
                        )}
                      </div>
                    </div>

                    {/* รูปภาพหลักฐานอื่นๆ */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-purple-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        สลิปชำระเงิน
                      </h5>
                      <div className="space-y-2">
                        {selectedDelivery.slip_proofs &&
                        selectedDelivery.slip_proofs !== "—" ? (
                          <div>
                            <div className="text-green-400 text-sm font-medium mb-2">
                              มีสลิป 1 รูป
                            </div>
                            {selectedDelivery.slip_proofs &&
                              selectedDelivery.slip_proofs !== "—" && (
                                <div className="space-y-2">
                                  <img
                                    src={`http://203.154.83.160${selectedDelivery.slip_proofs}`}
                                    alt="สลิปชำระเงิน"
                                    className="w-full h-32 object-cover rounded-lg border border-white/20"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.style.display =
                                        "block";
                                    }}
                                  />
                                  <div
                                    className="text-xs text-slate-300 bg-slate-800/50 rounded p-2 font-mono break-all"
                                    style={{ display: "none" }}
                                  >
                                    {selectedDelivery.slip_proofs}
                                  </div>
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-sm">
                            ไม่มีสลิป
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
                  <button
                    onClick={closeDetail}
                    className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 font-medium flex items-center gap-2"
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
                    ปิด
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteOpen} onClose={closeDelete}>
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
                ยืนยันการลบรายการส่งมอบ
              </h3>
              <p className="text-slate-400 text-sm">
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>

            {/* Delivery Information Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-green-400/30">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-1">
                    {selectedDeleteName || "รายการส่งมอบ"}
                  </h4>
                  {selectedDeleteId && (
                    <p className="text-slate-300 text-sm">
                      หมายเลข:{" "}
                      <span className="font-semibold text-green-400">
                        {selectedDeleteId}
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
                    การลบรายการส่งมอบจะทำให้ข้อมูลการส่งมอบและประวัติที่เกี่ยวข้องถูกลบออกจากระบบอย่างถาวร
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
                    ลบรายการ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
