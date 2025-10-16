"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Headers from "@/Components/HeaderAd";
import Footer from "@/Components/FooterMinimal";
import DeliveriesTableNew from "@/Components/admin/DeliveriesTableNew";
import Link from "next/link";

/** ================== ERP CONFIG ================== */
const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.154.83.160";
const GET_USER_INFO_EP = "/api/method/frappe.api.api.get_user_information";

/** กลุ่ม role ที่ถือว่าเป็นแอดมิน */
const ADMIN_ROLES = new Set([
  "Administrator",
  "System Manager",
  "Admin",
  "Owner",
  "Manager",
]);

export default function DeliveriesPage() {
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
  const [deliveries, setDeliveries] = useState([]);

  // ===== API Fetch Functions =====
  const fetchDeliveries = async () => {
    try {
      const response = await fetch(
        "http://203.154.83.160/api/method/frappe.api.api.get_dlv",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Raw API response:", data);

        const deliveriesList = data?.message?.deliveries || data?.message || [];
        console.log("Deliveries list:", deliveriesList);

        if (deliveriesList.length > 0) {
          console.log("First delivery item:", deliveriesList[0]);
        }

        // Transform data - ใช้ชื่อ field ที่ตรงกับ API response
        const transformedDeliveries = deliveriesList.map((d) => ({
          // ข้อมูลพื้นฐาน
          id: d.name || d.dlv_id || d.id, // ใช้ name จาก API (เช่น "DLV-2025-031")
          customerName: d.customer || d.customer_name || d.customerName || "—",
          customerPhone:
            d.customer_tel || d.customer_phone || d.customerPhone || "—",
          carName: d.vehicle || d.vehicle_name || d.carName || "—",
          carPlate: d.plate || d.vehicle_plate || d.carPlate || "—",
          driverName: d.employee || d.driver_name || d.driverName || "—",
          deliveryDate:
            d.pickup_date || d.delivery_date || d.deliveryDate || null,
          status: d.delivery_status || d.status || "pending",

          // ข้อมูลเพิ่มเติม
          rental_no: d.rental_no || d.booking_code || d.bookingCode || "—",
          creation: d.creation || "—",
          downpayment: d.downpayment || "—",
          fuel: d.fuel || "—",
          mile: d.mile || "—",
          document: d.document || "—",
          remark: d.remark || "—",

          // ข้อมูลสถานที่
          pickup_place: d.pickup_place || "—",
          return_place: d.return_place || "—",
          return_date: d.return_date || null,

          // รูปภาพหลักฐาน
          confirm_proofs: d.confirm_proofs || "—",
          confirm_proofs_count: d.confirm_proofs_count || 0,
          car_proofs: d.car_proofs || "—",
          car_proofs_count: d.car_proofs_count || 0,
          slip_proofs: d.slip_proofs || "—",
          slip_proofs_count: d.slip_proofs_count || 0,

          // เก็บข้อมูลดิบทั้งหมด
          rawData: d,
        }));

        console.log("Transformed deliveries:", transformedDeliveries);
        setDeliveries(transformedDeliveries);
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error);
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 overflow-hidden flex flex-col">
      <title>จัดการการส่งมอบ - Admin Dashboard</title>

      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-green-400/20 rounded-full animate-pulse"
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

      <div className="relative z-10 flex flex-col flex-1">
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
                  <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    ส่งมอบ
                  </span>
                </h1>
              </div>

              {/* Right: Navigation buttons */}
              <div className="flex items-center space-x-2">
                <Link
                  href="/adminpageT/cars"
                  className="px-3 py-2 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 hover:text-yellow-200 border border-yellow-500/30 hover:border-yellow-500/50 rounded-lg transition-all duration-200"
                >
                  รถ
                </Link>
                <Link
                  href="/adminpageT/bookings"
                  className="px-3 py-2 text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-500/50 rounded-lg transition-all duration-200"
                >
                  การจอง
                </Link>
                <Link
                  href="/adminpageT"
                  className="px-3 py-2 text-sm bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 hover:text-slate-200 border border-slate-500/30 hover:border-slate-500/50 rounded-lg transition-all duration-200"
                >
                  หน้าแรก
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-3 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 h-full flex flex-col">
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl mb-4">
                  <svg
                    className="w-8 h-8 text-white"
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
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 sm:mb-4">
                  <span className="text-white">จัดการ</span>
                  <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    การส่งมอบ
                  </span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto px-4">
                  ติดตามและจัดการการส่งมอบรถให้ลูกค้า
                  <br className="sm:hidden" />
                  <span className="hidden sm:inline"> • </span>
                  บันทึกข้อมูลการส่งมอบและติดตามสถานะ
                </p>
              </div>

              {/* Table Content */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 flex-1 p-4 sm:p-6 lg:p-8">
                <DeliveriesTableNew
                  deliveries={deliveries}
                  onUpdateStatus={async (delivery, newStatus) => {
                    // Call API to update status
                    // Then refresh
                    await fetchDeliveries();
                  }}
                  onFetchDeliveries={fetchDeliveries}
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
