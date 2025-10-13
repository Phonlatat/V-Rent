// app/admin/page.jsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Headers from "@/Components/HeaderAd";
import Footer from "@/Components/Footer";
import Link from "next/link";

import EmployeeCard from "@/Components/admin/EmployeeCard";
import AddCarCard from "@/Components/admin/AddCarCard";
import AdminSlideModal from "@/Components/admin/AdminSlideModal";

/** ================== ERP CONFIG ================== */
const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "http://203.150.243.195";
// endpoint แนะนำให้ใช้ตัวนี้เพื่อดู role ผู้ใช้
const GET_USER_INFO_EP = "/api/method/erpnext.api.get_user_information";

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

// …อยู่เหนือ export default หรือวางในไฟล์เดียวกันก็ได้
function AccessDeniedCard({ onBack }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Headers />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="text-2xl font-semibold text-black mb-1">
            เข้าถึงไม่ได้
          </div>
          <p className="text-gray-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Link
              href="/Login"
              className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

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
  const [userId, setUserId] = useState("");

  // ===== Page state (ของเดิม) =====
  const [cars, setCars] = useState([]);
  const [bookings] = useState([]);
  const [deliveries] = useState([]);
  const [now] = useState(new Date());

  const nextBookingMap = useMemo(() => ({}), []);
  const carMapById = useMemo(() => new Map(), []);
  const carMapByKey = useMemo(() => new Map(), []);

  // โหลด user_id จาก localStorage
  const ADMIN_ROLES_LC = useMemo(
    () =>
      new Set(["administrator", "system manager", "admin", "owner", "manager"]),
    []
  );

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
          setAuthError("ไม่พบผู้ใช้ (กรุณาเข้าสู่ระบบ)");
          setAllowed(false);
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

        setAllowed(hasAdminRole);
        if (!hasAdminRole) {
          setAuthError("บัญชีของคุณไม่มีสิทธิ์เข้าถึงหน้าแอดมิน");
        }
      } catch (e) {
        setAuthError(e?.message || "เกิดข้อผิดพลาดในการตรวจสิทธิ์");
        setAllowed(false);
      } finally {
        if (!abort) setAuthLoading(false);
      }
    };

    checkAccess();
    return () => {
      abort = true;
      controller.abort();
    };
  }, [userId]);

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

  // ===== UI: Gate states =====
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="rounded-xl border bg-white px-6 py-5 shadow-sm">
          <p className="text-sm text-gray-700">กำลังตรวจสอบสิทธิ์เข้าถึง…</p>
        </div>
      </div>
    );
  }

  // แทนที่บล็อกเดิมทั้งก้อน if (!allowed) { ... }
  if (!allowed) {
    return <AccessDeniedCard onBack={() => router.push("/")} />;
  }

  // ===== Allowed UI (เวอร์ชันใหม่) =====
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <title>AdminPage - V-Rent</title>
      <Headers />
      
      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative">
          {/* แถบเหลืองครึ่งบนของโซนเนื้อหา */}
          <div className="absolute inset-x-0 top-0 h-[120px] bg-gradient-to-r from-yellow-400 to-amber-500" />
          
          {/* เนื้อหาจริง ให้อยู่เหนือแถบเหลือง */}
          <div className="relative p-4 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
                  <span className="text-slate-900">Admin</span>
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    Dashboard
                  </span>
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  จัดการระบบ V-Rent อย่างครบวงจร พร้อมติดตามข้อมูลการจองและการส่งมอบ
                </p>
              </div>

              {/* กล่องเนื้อหาหลัก */}
              <div className="rounded-3xl bg-white shadow-xl ring-1 ring-black/5 min-h-[70vh] p-6 sm:p-8">
                {/* การ์ดพนักงานและฟอร์มเพิ่มรถ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                  {/* การ์ดพนักงาน */}
                  <div className="lg:col-span-4">
                    <EmployeeCard userId={userId} />
                  </div>

                  {/* ฟอร์มเพิ่มรถ */}
                  <div className="lg:col-span-8">
                    <AddCarCard
                      form={carForm}
                      setForm={setCarForm}
                      onAddCar={onAddCar}
                      onImageChange={onImageChange}
                    />
                  </div>
                </div>

                {/* ตารางข้อมูล (Slide Modal) */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    จัดการข้อมูลระบบ
                  </h2>
                  <p className="text-slate-600 mb-6">
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
                    onDeleteCar={() => {}}
                    onConfirmPickup={handleConfirmPickup}
                    onComplete={handleComplete}
                    getCarRowStatus={getCarRowStatus}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
