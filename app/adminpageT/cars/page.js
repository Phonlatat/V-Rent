"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Headers from "@/Components/HeaderAd";
import Footer from "@/Components/FooterMinimal";
import CarsTableNew from "@/Components/admin/CarsTableNew";
import Link from "next/link";

/** ================== ERP CONFIG ================== */
const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.154.83.160";
const GET_USER_INFO_EP = "/api/erp-proxy/frappe.api.api.get_user_information";

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

/* สร้าง key เทียบรถจาก name/plate */
const carMatchKey = (name, plate) =>
  String(plate || name || "")
    .trim()
    .toLowerCase();

export default function CarsPage() {
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
  const [userId, setUserId] = useState("admin@vrent.com");

  // ===== Page state =====
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [now] = useState(new Date());

  const nextBookingMap = useMemo(() => ({}), []);
  const carMapById = useMemo(() => new Map(), []);
  const carMapByKey = useMemo(() => new Map(), []);

  // ===== API Fetch Functions =====
  const fetchCars = async () => {
    try {
      const response = await fetch("/api/admin/vehicles-admin", {
        method: "GET",
        credentials: "include",
      });

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
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/admin/rentals", {
        method: "GET",
        credentials: "include",
      });

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
    }
  };

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
          setTimeout(() => {
            setAuthError("ไม่พบผู้ใช้ (กรุณาเข้าสู่ระบบ)");
            setAllowed(false);
            setAuthLoading(false);
          }, 2000);
          return;
        }

        // เรียก ERP เพื่อดู role ผู้ใช้ - ใช้ API route ที่มีอยู่
        const url = `/api/erp/me?user_id=${encodeURIComponent(uid)}`;

        const res = await fetch(url, {
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

        const pickRoles = (arr) =>
          (Array.isArray(arr) ? arr : [])
            .map((r) =>
              typeof r === "string" ? r : r?.role || r?.name || r?.title || ""
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

        const isAdminFlag =
          !!msg?.is_admin ||
          !!msg?.is_system_manager ||
          !!msg?.isAdministrator ||
          !!msg?.[5];

        const idIsAdministrator =
          String(uid || msg?.user || msg?.user_id || "")
            .trim()
            .toLowerCase() === "administrator";

        const hasAdminRole =
          isAdminFlag ||
          idIsAdministrator ||
          rolesLC.some((r) =>
            [
              "administrator",
              "system manager",
              "admin",
              "owner",
              "manager",
            ].includes(r)
          );

        setTimeout(() => {
          setAllowed(hasAdminRole);
          if (!hasAdminRole) {
            setAuthError("บัญชีของคุณไม่มีสิทธิ์เข้าถึงหน้าแอดมิน");
          }
          if (!abort) setAuthLoading(false);
        }, 2000);
      } catch (e) {
        setTimeout(() => {
          setAuthError(e?.message || "เกิดข้อผิดพลาดในการตรวจสิทธิ์");
          setAllowed(false);
          if (!abort) setAuthLoading(false);
        }, 2000);
      }
    };

    checkAccess();
    return () => {
      abort = true;
      controller.abort();
    };
  }, [userId]);

  // Fetch data when allowed and userId is available
  useEffect(() => {
    if (allowed && userId) {
      fetchCars();
      fetchBookings();
    }
  }, [allowed, userId]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        setUserId(localStorage.getItem("vrent_user_id") || "");
      }
    } catch {}
  }, []);

  /* เมื่อ booking เข้าสู่ "กำลังเช่า" → ปรับ UI ของรถเป็น "ถูกยืมอยู่" */
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

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">กำลังตรวจสอบสิทธิ์เข้าถึง...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!allowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-red-400 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-2">เข้าถึงไม่ได้</h2>
          <p className="text-slate-300 mb-4">{authError}</p>
          <button
            onClick={() => router.push("/Login")}
            className="px-6 py-2 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
          >
            ไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 overflow-hidden">
      <title>จัดการรถ - Admin Dashboard</title>

      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Floating Elements */}
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
              {/* Left: Back button & Title */}
              <div className="flex items-center min-w-0 flex-1">
                <Link
                  href="/adminpageT"
                  className="mr-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200 flex-shrink-0"
                >
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </Link>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate">
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    จัดการรถ
                  </span>
                </h1>
              </div>

              {/* Right: Navigation buttons */}
              <div className="flex items-center space-x-2">
                <Link
                  href="/adminpageT/bookings"
                  className="px-3 py-2 text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-500/50 rounded-lg transition-all duration-200"
                >
                  การจอง
                </Link>
                <Link
                  href="/adminpageT/deliveries"
                  className="px-3 py-2 text-sm bg-green-500/20 hover:bg-green-500/30 text-green-300 hover:text-green-200 border border-green-500/30 hover:border-green-500/50 rounded-lg transition-all duration-200"
                >
                  ส่งมอบ
                </Link>
                <Link
                  href="/adminpageT"
                  className="px-3 py-2 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 hover:text-yellow-200 border border-yellow-500/30 hover:border-yellow-500/50 rounded-lg transition-all duration-200"
                >
                  หน้าแรก
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1">
          <div className="p-3 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6">
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl mb-4">
                  <svg
                    className="w-8 h-8 text-black"
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
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 sm:mb-4">
                  <span className="text-white">จัดการ</span>
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    รถ
                  </span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto px-4">
                  ดูและจัดการข้อมูลรถทั้งหมดในระบบ
                  <br className="sm:hidden" />
                  <span className="hidden sm:inline"> • </span>
                  เพิ่ม แก้ไข หรือลบข้อมูลรถได้ที่นี่
                </p>
              </div>

              {/* Table Content */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 min-h-[60vh] p-4 sm:p-6 lg:p-8">
                <CarsTableNew
                  cars={cars}
                  bookings={bookings}
                  now={now}
                  nextBookingMap={nextBookingMap}
                  onEdit={() => {}}
                  onDelete={fetchCars}
                  onAddCar={() => {
                    // Navigate back to adminpageT with scroll to add car form
                    router.push("/adminpageT#add-car");
                  }}
                  onRefresh={fetchCars}
                  onFetchCars={fetchCars}
                  getCarRowStatus={getCarRowStatus}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
