// app/admin/page.jsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Headers from "@/Components/HeaderAd";
import Footer from "@/Components/FooterMinimal";
import Link from "next/link";

import EmployeeCard from "@/Components/admin/EmployeeCard";
import AddCarCard from "@/Components/admin/AddCarCard";
import AdminSlideModal from "@/Components/admin/AdminSlideModal";

/** ================== ERP CONFIG ================== */
const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.154.83.160";
// endpoint แนะนำให้ใช้ตัวนี้เพื่อดู role ผู้ใช้
const GET_USER_INFO_EP = "/api/method/frappe.api.api.get_user_information";

/** กลุ่ม role ที่ถือว่าเป็นแอดมิน */
const ADMIN_ROLES = new Set([
  "Administrator",
  "System Manager",
  "Admin",
  "Owner",
  "Manager",
]);

/* แปลง EN → TH สำหรับสถานะรถ (ไว้แสดงในตาราง) */
const mapStatusToThai = (en) => {
  const v0 = String(en ?? "")
    .normalize("NFKC")
    .replace(/\u00A0|\u200B|\u200C|\u200D/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const compact = v0.replace(/\s+/g, ""); // "inrent", "inuse"

  if (
    v0 === "in use" ||
    compact === "inuse" ||
    v0 === "rented" ||
    v0 === "กำลังเช่า" ||
    v0 === "ถูกยืมอยู่"
  )
    return "ถูกยืมอยู่";
  if (
    v0 === "maintenance" ||
    v0 === "maintainance" ||
    v0 === "ซ่อมบำรุง" ||
    v0 === "ซ่อมแซม"
  )
    return "ซ่อมบำรุง";
  if (
    v0 === "in rent" ||
    compact === "inrent" ||
    v0 === "reserved" ||
    v0 === "booked" ||
    v0 === "ถูกจอง"
  )
    return "ถูกจอง";
  return "ว่าง";
};

// Import the new AccessDeniedCard and LoadingCard components
import AccessDeniedCard from "@/Components/AccessDeniedCard";
import LoadingCard from "@/Components/LoadingCard";

/* สร้าง key เทียบรถจาก name/plate */
const carMatchKey = (name, plate) =>
  String(plate || name || "")
    .trim()
    .toLowerCase();

export default function AdminPage() {
  const router = useRouter();

  // ===== Auth state =====
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [allowed, setAllowed] = useState(false);
  const [auth, setAuth] = useState({
    loading: true,
    isAdmin: false,
    name: "",
    email: "",
  });
  // 🚧 TEMPORARY: Mock userId สำหรับทดสอบ UX/UI
  const [userId, setUserId] = useState("admin@vrent.com");

  // ===== Page state =====
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  // Loading states
  const [carsLoading, setCarsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [now] = useState(new Date());

  const nextBookingMap = useMemo(() => ({}), []);
  const carMapById = useMemo(() => new Map(), []);
  const carMapByKey = useMemo(() => new Map(), []);

  // ===== Auth Effect =====
  useEffect(() => {
    let ignore = false;

    // preload quick UX
    try {
      const isAdminLocal =
        (localStorage.getItem("vrent_is_admin") || "false").toLowerCase() ===
        "true";
      const fullNameLS =
        localStorage.getItem("vrent_full_name") ||
        localStorage.getItem("vrent_user_name") ||
        "";
      const emailLS =
        localStorage.getItem("vrent_login_email") ||
        localStorage.getItem("vrent_user_id") ||
        "";
      setAuth((p) =>
        p.loading
          ? {
              loading: true,
              isAdmin: isAdminLocal,
              name: fullNameLS,
              email: emailLS,
            }
          : p
      );
    } catch {}

    // verify with backend
    (async () => {
      try {
        const userIdLS = (localStorage.getItem("vrent_user_id") || "").trim();
        const emailLS =
          (localStorage.getItem("vrent_login_email") || "").trim() ||
          (localStorage.getItem("vrent_user_id") || "").trim();

        const qp = new URLSearchParams();
        if (userIdLS) qp.set("user_id", userIdLS);
        if (emailLS) qp.set("email", emailLS);

        const headers = {};
        if (userIdLS) headers["x-user-id"] = userIdLS;
        if (emailLS) headers["x-email"] = emailLS;

        const r = await fetch(`/api/erp/me?${qp.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers,
        });
        const j = await r.json().catch(() => null);
        if (ignore) return;

        const u = j?.user || {};
        setAuth({
          loading: false,
          isAdmin: !!u.isAdmin,
          name: u.fullName || "",
          email: u.email || "",
        });

        try {
          if (u.fullName) localStorage.setItem("vrent_full_name", u.fullName);
          if (u.email) localStorage.setItem("vrent_login_email", u.email);
          localStorage.setItem("vrent_is_admin", String(!!u.isAdmin));
        } catch {}
      } catch {
        if (!ignore) setAuth((p) => ({ ...p, loading: false }));
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  // ===== API Fetch Functions =====
  const fetchCars = async () => {
    try {
      setCarsLoading(true);
      const response = await fetch(
        "http://203.154.83.160/api/method/frappe.api.api.get_vehicles",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const vehicles = data?.message?.vehicles || data?.message || [];

        // Transform data to match expected format
        const transformedCars = vehicles.map((v) => ({
          id: v.name || v.id,
          name: v.vehicle_name || v.name,
          brand: v.brand,
          pricePerDay: Number(v.price || v.price_per_day || v.pricePerDay || 0),
          price_per_day: Number(v.price || v.price_per_day || 0),
          price: Number(v.price || 0),
          rate: Number(v.rate || 0),
          rate_per_day: Number(v.rate_per_day || 0),
          status: v.vehicle_stage || v.status,
          image: v.image || v.vehicle_image,
          imageData: v.image || v.vehicle_image,
          type: v.vehicle_type || v.type,
          licensePlate: v.license_plate || v.licensePlate,
          key: v.name || v.id,
        }));

        setCars(transformedCars);
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
    } finally {
      setCarsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const response = await fetch(
        "http://203.154.83.160/api/method/frappe.api.api.get_rentals_overall",
        {
          method: "GET",
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
          carKey: b.vehicle_key || b.carKey,
          carName: b.vehicle_name || b.carName,
          pickupDate: b.pickup_date || b.pickupDate,
          returnDate: b.return_date || b.returnDate,
          totalPrice: b.total_price || b.totalPrice,
          status: b.booking_status || b.status,
          paymentStatus: b.payment_status || b.paymentStatus,
        }));

        setBookings(transformedBookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setDeliveriesLoading(true);
      const response = await fetch(
        "http://203.154.83.160/api/method/frappe.api.api.get_dlv",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const deliveriesList = data?.message?.deliveries || data?.message || [];

        // Transform data
        const transformedDeliveries = deliveriesList.map((d) => ({
          id: d.dlv_id || d.id,
          customerName: d.customer_name || d.customerName,
          customerPhone: d.customer_phone || d.customerPhone,
          carName: d.vehicle_name || d.carName,
          carPlate: d.vehicle_plate || d.carPlate,
          driverName: d.driver_name || d.driverName,
          deliveryDate: d.delivery_date || d.deliveryDate,
          status: d.delivery_status || d.status,
        }));

        setDeliveries(transformedDeliveries);
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  // โหลด user_id จาก localStorage
  const ADMIN_ROLES_LC = useMemo(
    () =>
      new Set(["administrator", "system manager", "admin", "owner", "manager"]),
    []
  );

  // Fetch data when allowed and userId is available
  useEffect(() => {
    if (allowed && userId) {
      fetchCars();
      fetchBookings();
      fetchDeliveries();
    }
  }, [allowed, userId]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        setUserId(localStorage.getItem("vrent_user_id") || "");
      }
    } catch {}
  }, []);

  // ===== Role Gate: ตรวจสิทธิ์เข้าถึงหน้า Admin =====
  useEffect(() => {
    let abort = false;
    const controller = new AbortController();

    const checkAccess = async () => {
      try {
        setAuthLoading(true);
        setAuthError("");

        const uid =
          userId ||
          (typeof window !== "undefined"
            ? localStorage.getItem("vrent_user_id") || ""
            : "");

        if (!uid) {
          // หน่วงเวลาให้แสดง LoadingCard สักพัก
          setTimeout(() => {
            setAuthError("ไม่พบผู้ใช้ (กรุณาเข้าสู่ระบบ)");
            setAllowed(false);
            setAuthLoading(false);
          }, 2000); // หน่วงเวลา 2 วินาที
          return;
        }

        // เรียก ERP เพื่อดู role ผู้ใช้
        const u = new URL(`${ERP_BASE}${GET_USER_INFO_EP}`);
        u.searchParams.set("user_id", uid);

        const res = await fetch(u.toString(), {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 403) {
            setAuthError("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (403)");
            setAllowed(false);
            return;
          }
          throw new Error(`ตรวจสิทธิ์ล้มเหลว (HTTP ${res.status})`);
        }

        const j = await res.json();
        const msg = j?.message ?? j?.data ?? j;

        // ---- ดึง role ให้ robust ----
        const pickRoles = (arr) =>
          (Array.isArray(arr) ? arr : [])
            .map(
              (r) =>
                typeof r === "string" ? r : r?.role || r?.name || r?.title || "" // รองรับหลายฟอร์แมต
            )
            .filter(Boolean);

        let roles = [];
        if (Array.isArray(msg?.roles)) roles = pickRoles(msg.roles);
        else if (Array.isArray(msg?.user_roles))
          roles = pickRoles(msg.user_roles);
        else if (Array.isArray(msg?.role_list))
          roles = pickRoles(msg.role_list);
        else if (typeof msg?.role === "string") roles = [msg.role];

        const rolesLC = roles.map((r) => String(r).trim().toLowerCase());

        // flags จากเซิร์ฟเวอร์ (ถ้ามี)
        const isAdminFlag =
          !!msg?.is_admin ||
          !!msg?.is_system_manager ||
          !!msg?.isAdministrator ||
          !!msg?.[5];

        // เคส id เป็น administrator โดยตรง
        const idIsAdministrator =
          String(uid || msg?.user || msg?.user_id || "")
            .trim()
            .toLowerCase() === "administrator";

        const hasAdminRole =
          isAdminFlag ||
          idIsAdministrator ||
          rolesLC.some((r) => ADMIN_ROLES_LC.has(r));

        // หน่วงเวลาให้แสดง LoadingCard สักพัก
        setTimeout(() => {
          setAllowed(hasAdminRole);
          if (!hasAdminRole) {
            setAuthError("บัญชีของคุณไม่มีสิทธิ์เข้าถึงหน้าแอดมิน");
          }
          if (!abort) setAuthLoading(false);
        }, 2000); // หน่วงเวลา 2 วินาที
      } catch (e) {
        // หน่วงเวลาให้แสดง LoadingCard สักพัก
        setTimeout(() => {
          setAuthError(e?.message || "เกิดข้อผิดพลาดในการตรวจสิทธิ์");
          setAllowed(false);
          if (!abort) setAuthLoading(false);
        }, 2000); // หน่วงเวลา 2 วินาที
      }
    };

    checkAccess();
    return () => {
      abort = true;
      controller.abort();
    };
  }, [userId, ADMIN_ROLES_LC]);

  // ===== ฟอร์มเพิ่มรถ (ของเดิม) =====
  const [carForm, setCarForm] = useState({
    name: "",
    brand: "",
    pricePerDay: "",
    imageData: "",
  });

  const onImageChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const MAX_MB = 3;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`ไฟล์ใหญ่เกิน ${MAX_MB}MB`);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setCarForm((f) => ({ ...f, imageData: reader.result || "" }));
    reader.readAsDataURL(file);
  };

  const onAddCar = (e) => {
    e.preventDefault();
    const name = carForm.name?.trim();
    if (!name) return alert("กรุณากรอกชื่อรถ");
    const price = Number(carForm.pricePerDay || 0) || 0;
    const newCar = {
      id: `tmp_${Date.now()}`,
      name,
      brand: carForm.brand?.trim() || "",
      price_per_day: price,
      pricePerDay: price,
      image: carForm.imageData || "",
      status: "Available",
      type: "",
      key: "",
    };
    setCars((prev) => [newCar, ...prev]);
    setCarForm({ name: "", brand: "", pricePerDay: "", imageData: "" });
  };

  /* เมื่อ booking เข้าสู่ “กำลังเช่า” → ปรับ UI ของรถเป็น “ถูกยืมอยู่”
     (การยิง API ไปเปลี่ยน stage ของรถ ทำใน BookingsTable) */
  const handleConfirmPickup = ({ carPlate = "", carName = "" }) => {
    const key = carMatchKey(carName, carPlate);
    setCars((list) =>
      list.map((c) => {
        const k = carMatchKey(c.name, c.plate || c.licensePlate);
        if (k !== key) return c;
        return {
          ...c,
          status: "In Use",
          stage: "borrowed",
          stageLabel: mapStatusToThai("In Use"),
        };
      })
    );
  };

  const handleComplete = ({ carPlate = "", carName = "" }) => {
    const key = carMatchKey(carName, carPlate);
    setCars((list) =>
      list.map((c) => {
        const k = carMatchKey(c.name, c.plate || c.licensePlate);
        if (k !== key) return c;
        return {
          ...c,
          status: "Available",
          stage: "available",
          stageLabel: mapStatusToThai("Available"),
        };
      })
    );
  };

  const getCarRowStatus = (car) =>
    car?.stageLabel || mapStatusToThai(car?.status) || "ว่าง";

  // ===== Scroll to Add Car Form Effect =====
  useEffect(() => {
    if (!allowed) return; // Only run when user is allowed

    const handleHashChange = () => {
      if (window.location.hash === "#add-car") {
        setTimeout(() => {
          const addCarElement = document.querySelector("[data-add-car-card]");
          if (addCarElement) {
            addCarElement.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    };

    // Check on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [allowed]);

  // ===== UI: Gate states =====
  // 🚧 TEMPORARY: ข้ามหน้า Loading เพื่อแก้ไข UX/UI
  if (false) {
    // authLoading
    return (
      <LoadingCard
        title="กำลังตรวจสอบสิทธิ์เข้าถึง..."
        subtitle="กรุณารอสักครู่ ระบบกำลังตรวจสอบสิทธิ์ผู้ใช้งาน"
      />
    );
  }

  // 🚧 TEMPORARY: บังคับเข้าไปหน้า Admin Dashboard เพื่อแก้ไข UX/UI
  if (false) {
    // !allowed
    return (
      <AccessDeniedCard
        title="เข้าถึงไม่ได้ - Admin Dashboard"
        subtitle="คุณไม่มีสิทธิ์เข้าถึงหน้าแอดมิน กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ"
      />
    );
  }

  // ===== Allowed UI (เวอร์ชันใหม่) =====
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 overflow-hidden">
      <title>AdminPage - V-Rent</title>

      {/* Enhanced Background Pattern - ตามธีมของเว็บไซต์ */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Floating Elements - ตามธีมของเว็บไซต์ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-yellow-400/20 rounded-full animate-pulse"
            style={{
              width: `${1 + Math.random() * 3}px`,
              height: `${1 + Math.random() * 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Left: Title */}
              <div className="flex items-center min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate">
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    <span className="hidden xs:inline">Admin Dashboard</span>
                    <span className="xs:hidden">Admin</span>
                  </span>
                </h1>
                <span className="ml-1.5 sm:ml-2 lg:ml-3 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-full font-semibold hidden xs:inline-block">
                  Admin
                </span>
              </div>

              {/* Right: User Info & Logout */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 ml-2 sm:ml-3 lg:ml-4">
                {/* User Info - Hidden on very small screens */}
                <div className="hidden xs:flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3">
                  <div className="text-right min-w-0">
                    <div className="text-xs sm:text-sm text-slate-300 truncate">
                      ยินดีต้อนรับ
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-white truncate max-w-[80px] sm:max-w-[100px] lg:max-w-[120px]">
                      {auth?.name || userId || "Admin User"}
                    </div>
                  </div>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-black font-semibold text-xs sm:text-sm">
                      {(auth?.name || userId || "AD").charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Avatar only for very small screens */}
                <div className="xs:hidden w-6 h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-semibold text-xs">
                    {(auth?.name || userId || "AD").charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    // ล้างข้อมูล localStorage
                    try {
                      localStorage.removeItem("vrent_user_id");
                      localStorage.removeItem("vrent_full_name");
                      localStorage.removeItem("vrent_user_name");
                      localStorage.removeItem("vrent_login_email");
                      localStorage.removeItem("vrent_is_admin");
                    } catch {}
                    // ไปหน้า login
                    router.push("/Login");
                  }}
                  className="px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all duration-200 hover:scale-105 whitespace-nowrap"
                  title="ออกจากระบบ"
                >
                  <span className="hidden sm:inline">ออกจากระบบ</span>
                  <span className="sm:hidden">ออก</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative">
            {/* เนื้อหาจริง */}
            <div className="relative p-3 sm:p-6 lg:p-8">
              <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
                    <span className="text-white">Admin</span>
                    <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                      Dashboard
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto px-4">
                    จัดการระบบ V-Rent อย่างครบวงจร
                    <br className="sm:hidden" />
                    <span className="hidden sm:inline"> • </span>
                    พร้อมติดตามข้อมูลการจองและการส่งมอบ
                  </p>
                </div>

                {/* กล่องเนื้อหาหลัก */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 min-h-[60vh] sm:min-h-[70vh] p-4 sm:p-6 lg:p-8 group hover:bg-white/15 transition-all duration-300">
                  {/* การ์ดพนักงานและฟอร์มเพิ่มรถ */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* การ์ดพนักงาน */}
                    <div className="lg:col-span-4">
                      <EmployeeCard userId={userId} />
                    </div>

                    {/* ฟอร์มเพิ่มรถ */}
                    <div className="lg:col-span-8" data-add-car-card>
                      <AddCarCard
                        form={carForm}
                        setForm={setCarForm}
                        onAddCar={onAddCar}
                        onImageChange={onImageChange}
                      />
                    </div>
                  </div>

                  {/* ตารางข้อมูล (Slide Modal) */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-black"
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
                      </div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors duration-300">
                        จัดการข้อมูลระบบ
                      </h2>
                    </div>
                    <p className="text-sm sm:text-base text-slate-300 group-hover:text-white transition-colors duration-300 mb-4 sm:mb-6 px-2 sm:px-0">
                      คลิกที่การ์ดด้านล่างเพื่อเปิดดูและจัดการข้อมูลในแต่ละหมวด
                    </p>

                    <AdminSlideModal
                      cars={cars}
                      bookings={bookings}
                      deliveries={deliveries}
                      carMapById={carMapById}
                      carMapByKey={carMapByKey}
                      nextBookingMap={nextBookingMap}
                      now={now}
                      onEditCar={() => {}}
                      onDeleteCar={fetchCars} // Refresh after delete
                      onConfirmPickup={handleConfirmPickup}
                      onComplete={handleComplete}
                      onFetchCars={fetchCars}
                      onFetchBookings={fetchBookings} // เพิ่มใหม่
                      onFetchDeliveries={fetchDeliveries} // เพิ่มใหม่
                      getCarRowStatus={getCarRowStatus}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
