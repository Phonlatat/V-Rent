"use client";

import { useEffect, useState } from "react";

const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.154.83.160";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [useMockData, setUseMockData] = useState(true); // Toggle for mock data

  // Dashboard data states
  const [vehicleReport, setVehicleReport] = useState([]);
  const [customerReport, setCustomerReport] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [allBookings, setAllBookings] = useState([]);

  // Set default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setEndDate(end.toISOString().split("T")[0]);
    setStartDate(start.toISOString().split("T")[0]);
  }, []);

  const fetchAllBookings = async () => {
    try {
      const headers = new Headers();
      headers.append("Content-Type", "application/json");

      const response = await fetch(
        `${ERP_BASE}/api/method/frappe.api.api.get_rentals_overall`,
        {
          method: "GET",
          headers,
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const bookingsList = data?.message?.bookings || data?.message || [];

        // Transform data
        const transformedBookings = bookingsList.map((b) => ({
          id: b.name || b.id,
          customerName: b.customer_name || b.customerName,
          customerPhone: b.customer_phone || b.customerPhone,
          carId: b.vehicle || b.carId,
          carName: b.vehicle_name || b.carName,
          license_plate: b.license_plate,
          pickupDate: b.pickup_date || b.pickupDate,
          returnDate: b.return_date || b.returnDate,
          totalPrice: b.total_price || b.totalPrice,
          status: b.booking_status || b.status,
          paymentStatus: b.payment_status || b.paymentStatus,
        }));

        setAllBookings(transformedBookings);
        console.log("All bookings loaded:", transformedBookings);
        return transformedBookings;
      }
    } catch (error) {
      console.error("Error fetching all bookings:", error);
    }
    return [];
  };

  const fetchDashboardData = async () => {
    if (!startDate || !endDate) {
      alert("กรุณาเลือกช่วงวันที่");
      return;
    }

    try {
      setLoading(true);

      const headers = new Headers();
      headers.append("Content-Type", "application/json");

      // Fetch all dashboard data and bookings in parallel
      const [vehicleRes, customerRes, pieRes, bookingsData] = await Promise.all(
        [
          fetch(`${ERP_BASE}/api/method/frappe.api.api.get_report_saperate`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              start_date: startDate,
              end_date: endDate,
            }),
            credentials: "include",
            redirect: "follow",
          }),
          fetch(`${ERP_BASE}/api/method/frappe.api.api.get_report_customer`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              start_date: startDate,
              end_date: endDate,
            }),
            credentials: "include",
            redirect: "follow",
          }),
          fetch(`${ERP_BASE}/api/method/frappe.api.api.get_report_piechart`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              start_date: startDate,
              end_date: endDate,
            }),
            credentials: "include",
            redirect: "follow",
          }),
          fetchAllBookings(),
        ]
      );

      // Process vehicle report
      const vehicleText = await vehicleRes.text();
      let vehicleData = [];
      try {
        const vehiclePayload = JSON.parse(vehicleText);
        vehicleData = Array.isArray(vehiclePayload?.message)
          ? vehiclePayload.message
          : vehiclePayload?.message
          ? [vehiclePayload.message]
          : [];
      } catch (e) {
        console.warn("Failed to parse vehicle report:", e);
      }

      // Process customer report
      const customerText = await customerRes.text();
      let customerData = [];
      try {
        const customerPayload = JSON.parse(customerText);
        customerData = Array.isArray(customerPayload?.message)
          ? customerPayload.message
          : customerPayload?.message
          ? [customerPayload.message]
          : [];
      } catch (e) {
        console.warn("Failed to parse customer report:", e);
      }

      // Process pie chart data
      const pieText = await pieRes.text();
      let pieData = [];
      try {
        const piePayload = JSON.parse(pieText);
        pieData = Array.isArray(piePayload?.message)
          ? piePayload.message
          : piePayload?.message
          ? [piePayload.message]
          : [];
      } catch (e) {
        console.warn("Failed to parse pie chart data:", e);
      }

      setVehicleReport(vehicleData);
      setCustomerReport(customerData);
      setPieChartData(pieData);

      console.log("Dashboard data loaded:", {
        vehicle: vehicleData,
        customer: customerData,
        pie: pieData,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูล dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration
  const mockVehicleData = [
    {
      license_plate: "งท5215สงขลา",
      rental_days: 54,
      total_amount: 54000,
      rental_count: 7,
    },
    {
      license_plate: "กข1234กรุงเทพ",
      rental_days: 32,
      total_amount: 32000,
      rental_count: 5,
    },
    {
      license_plate: "งง5678เชียงใหม่",
      rental_days: 28,
      total_amount: 28000,
      rental_count: 4,
    },
    {
      license_plate: "ฉฉ9012ภูเก็ต",
      rental_days: 45,
      total_amount: 45000,
      rental_count: 6,
    },
    {
      license_plate: "ปป3456ขอนแก่น",
      rental_days: 38,
      total_amount: 38000,
      rental_count: 5,
    },
  ];

  const mockCustomerData = [
    {
      customer_name: "Administrator",
      total_amount: 61900,
      rental_count: 9,
    },
    {
      customer_name: "สมชาย ใจดี",
      total_amount: 45000,
      rental_count: 6,
    },
    {
      customer_name: "สมหญิง รักรถ",
      total_amount: 38000,
      rental_count: 5,
    },
    {
      customer_name: "วิชัย ท่องเที่ยว",
      total_amount: 32000,
      rental_count: 4,
    },
    {
      customer_name: "นิดา ทำงาน",
      total_amount: 28000,
      rental_count: 4,
    },
  ];

  const mockPieData = [
    {
      type: "sedan",
      value: 82200,
      percent: 35.2,
    },
    {
      type: "suv",
      value: 65400,
      percent: 28.0,
    },
    {
      type: "hatchback",
      value: 45600,
      percent: 19.5,
    },
    {
      type: "pickup",
      value: 40200,
      percent: 17.3,
    },
  ];

  const mockAllBookings = [
    {
      id: "RENT-001",
      customerName: "สมชาย ใจดี",
      customerPhone: "081-234-5678",
      carName: "Toyota Camry",
      license_plate: "งท5215สงขลา",
      pickupDate: "2024-01-15T09:00:00",
      returnDate: "2024-01-20T18:00:00",
      totalPrice: 15000,
      status: "Completed",
      paymentStatus: "Paid",
    },
    {
      id: "RENT-002",
      customerName: "สมหญิง รักรถ",
      customerPhone: "082-345-6789",
      carName: "Honda Civic",
      license_plate: "กข1234กรุงเทพ",
      pickupDate: "2024-01-18T10:00:00",
      returnDate: "2024-01-25T17:00:00",
      totalPrice: 21000,
      status: "In Use",
      paymentStatus: "Partial Pay",
    },
    {
      id: "RENT-003",
      customerName: "วิชัย ท่องเที่ยว",
      customerPhone: "083-456-7890",
      carName: "Ford Ranger",
      license_plate: "งง5678เชียงใหม่",
      pickupDate: "2024-01-20T08:00:00",
      returnDate: "2024-01-22T20:00:00",
      totalPrice: 12000,
      status: "Confirmed",
      paymentStatus: "Paid",
    },
    {
      id: "RENT-004",
      customerName: "นิดา ทำงาน",
      customerPhone: "084-567-8901",
      carName: "Nissan Almera",
      license_plate: "ฉฉ9012ภูเก็ต",
      pickupDate: "2024-01-22T14:00:00",
      returnDate: "2024-01-28T16:00:00",
      totalPrice: 18000,
      status: "Completed",
      paymentStatus: "Paid",
    },
    {
      id: "RENT-005",
      customerName: "Administrator",
      customerPhone: "085-678-9012",
      carName: "Mazda CX-5",
      license_plate: "ปป3456ขอนแก่น",
      pickupDate: "2024-01-25T11:00:00",
      returnDate: "2024-01-30T19:00:00",
      totalPrice: 25000,
      status: "In Use",
      paymentStatus: "Paid",
    },
  ];

  // Auto-fetch data when dates change
  useEffect(() => {
    if (startDate && endDate) {
      if (useMockData) {
        // Use mock data for demonstration
        setVehicleReport(mockVehicleData);
        setCustomerReport(mockCustomerData);
        setPieChartData(mockPieData);
        setAllBookings(mockAllBookings);
      } else {
        // Use real API data
        fetchDashboardData();
      }
    }
  }, [startDate, endDate, useMockData]);

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString("th-TH");
  };

  const formatPercent = (percent) => {
    return Number(percent || 0).toFixed(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

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

  const getPaymentColor = (status) => {
    const s = String(status || "")
      .toLowerCase()
      .trim();
    if (s.includes("partial") || s.includes("บางส่วน")) {
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    }
    if (s.includes("paid") || s.includes("จ่ายแล้ว")) {
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    }
    return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm p-6 border-b border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">📊 Dashboard</h2>
            <p className="text-slate-300">สถิติการเช่ารถยนต์</p>
          </div>

          {/* Date Range Selector */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col">
              <label className="text-sm text-slate-300 mb-1">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-slate-300 mb-1">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => setUseMockData(!useMockData)}
                className={`px-4 py-2 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
                  useMockData
                    ? "bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30"
                    : "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30"
                }`}
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {useMockData ? "Mock Data" : "Real API"}
              </button>
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                รีเฟรช
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 animate-spin text-blue-400"
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
              <span className="text-slate-300">กำลังโหลดข้อมูล...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Vehicle Performance Report */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                สถิติรถยนต์
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicleReport.length > 0 ? (
                  vehicleReport.map((vehicle, index) => (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-white">
                          {vehicle.license_plate}
                        </h4>
                        <div className="text-xs text-slate-400 bg-white/10 px-2 py-1 rounded-full">
                          {vehicle.rental_count} ครั้ง
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-300">จำนวนวันเช่า:</span>
                          <span className="text-white font-medium">
                            {vehicle.rental_days} วัน
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">รายได้รวม:</span>
                          <span className="text-green-400 font-semibold">
                            {formatCurrency(vehicle.total_amount)} ฿
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-slate-400">
                    ไม่พบข้อมูลรถยนต์ในช่วงวันที่ที่เลือก
                  </div>
                )}
              </div>
            </div>

            {/* Customer Report */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                สถิติลูกค้า
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerReport.length > 0 ? (
                  customerReport.map((customer, index) => (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-white">
                          {customer.customer_name}
                        </h4>
                        <div className="text-xs text-slate-400 bg-white/10 px-2 py-1 rounded-full">
                          {customer.rental_count} ครั้ง
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">รายได้รวม:</span>
                        <span className="text-blue-400 font-semibold">
                          {formatCurrency(customer.total_amount)} ฿
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-slate-400">
                    ไม่พบข้อมูลลูกค้าในช่วงวันที่ที่เลือก
                  </div>
                )}
              </div>
            </div>

            {/* Pie Chart Data */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
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
                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                  />
                </svg>
                สถิติตามประเภทรถ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pieChartData.length > 0 ? (
                  pieChartData.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-white capitalize">
                          {item.type}
                        </h4>
                        <div className="text-xs text-slate-400 bg-white/10 px-2 py-1 rounded-full">
                          {formatPercent(item.percent)}%
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-300">รายได้:</span>
                          <span className="text-purple-400 font-semibold">
                            {formatCurrency(item.value)} ฿
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${item.percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-slate-400">
                    ไม่พบข้อมูลประเภทรถในช่วงวันที่ที่เลือก
                  </div>
                )}
              </div>
            </div>

            {/* All Bookings Section */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                ข้อมูลการเช่าทั้งหมด ({allBookings.length} รายการ)
              </h3>

              {allBookings.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {allBookings.map((booking, index) => (
                    <div
                      key={booking.id || index}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-1">
                            {booking.customerName}
                          </h4>
                          <p className="text-sm text-slate-300">
                            {booking.customerPhone}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            ID: {booking.id}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            {formatCurrency(booking.totalPrice)} ฿
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between">
                          <span className="text-slate-300 text-sm">
                            รถยนต์:
                          </span>
                          <span className="text-white text-sm font-medium">
                            {booking.carName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300 text-sm">
                            ป้ายทะเบียน:
                          </span>
                          <span className="text-white text-sm font-mono">
                            {booking.license_plate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300 text-sm">
                            วันที่รับ:
                          </span>
                          <span className="text-white text-sm">
                            {formatDate(booking.pickupDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300 text-sm">
                            วันที่คืน:
                          </span>
                          <span className="text-white text-sm">
                            {formatDate(booking.returnDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border ${getPaymentColor(
                            booking.paymentStatus
                          )}`}
                        >
                          {booking.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  ไม่พบข้อมูลการเช่าในช่วงวันที่ที่เลือก
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
