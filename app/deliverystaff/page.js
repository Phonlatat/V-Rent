// app/delivery/page.js
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import HeaderAd from "@/Components/HeaderAd";
import Footer from "@/Components/FooterMinimal";
import Link from "next/link";
import AccessDeniedCard from "@/Components/AccessDeniedCard";
import LoadingCard from "@/Components/LoadingCard";

/* ---------- UI helpers ---------- */
const cx = (...a) => a.filter(Boolean).join(" ");
const labelCls = "text-sm font-semibold text-white";
const inputCls =
  "w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:bg-white/20";
const cardCls =
  "bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20";

/* ---------- statuses ---------- */
const STATUS = {
  "waiting pickup": { label: "รอรับรถ", badge: "bg-amber-100 text-amber-800" },
  "pickup overdue": {
    label: "เลยเวลานัดรับ",
    badge: "bg-rose-100 text-rose-800",
  },
  "in use": { label: "กำลังเช่า", badge: "bg-blue-100 text-blue-800" },
  completed: { label: "เสร็จสิ้น", badge: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "ยกเลิก", badge: "bg-slate-200 text-slate-700" },
};

/* ---------- small utils ---------- */
const toLocalInputDT = (iso) =>
  iso ? new Date(iso).toISOString().slice(0, 16) : "";

/* ───────────────── CameraBox ───────────────── */
function CameraBox({ title, onCapture, buttonLabel = "ถ่ายรูป", disabled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [err, setErr] = useState("");
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [camKey, setCamKey] = useState(0);

  const stopStream = () => {
    try {
      videoRef.current && (videoRef.current.srcObject = null);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    } catch {}
  };

  const listDevices = async () => {
    try {
      const cams = (await navigator.mediaDevices.enumerateDevices()).filter(
        (d) => d.kind === "videoinput"
      );
      setDevices(cams);
      if (!deviceId && cams[0]?.deviceId) setDeviceId(cams[0].deviceId);
    } catch {}
  };

  const openCamera = async (id = deviceId) => {
    setErr("");
    if (!window.isSecureContext && location.hostname !== "localhost")
      return setErr(
        "กล้องต้องใช้บน HTTPS หรือ http://localhost เท่านั้น\n" +
          "วิธีแก้: ใช้ https หรือเปิดผ่าน localhost"
      );

    if (!navigator.mediaDevices?.getUserMedia)
      return setErr("เบราว์เซอร์นี้ไม่รองรับ getUserMedia");

    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: id ? { deviceId: { exact: id } } : { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      await listDevices();

      const track = stream.getVideoTracks()?.[0];
      const devId = track?.getSettings?.().deviceId;
      if (devId) setDeviceId(devId);

      setCamKey((k) => k + 1);
      setIsOpen(true);
      setTimeout(async () => {
        if (!videoRef.current) return;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {}
      }, 0);
    } catch (e) {
      const name = e?.name || "";
      setErr(
        name === "NotAllowedError"
          ? "ถูกปฏิเสธสิทธิ์กล้อง กรุณาอนุญาตใน Site settings"
          : name === "NotFoundError" || name === "OverconstrainedError"
          ? "ไม่พบอุปกรณ์กล้องที่ใช้งานได้"
          : "เปิดกล้องไม่สำเร็จ: " + (e.message || String(e))
      );
      setIsOpen(false);
      stopStream();
    }
  };

  const switchCamera = async () => {
    if (devices.length < 2) return;
    const i = devices.findIndex((d) => d.deviceId === deviceId);
    const next = devices[(i + 1) % devices.length];
    await openCamera(next.deviceId);
  };

  const takeShot = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;

    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    c.width = w;
    c.height = h;
    c.getContext("2d").drawImage(v, 0, 0, w, h);

    c.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture?.({
          blob,
          url: URL.createObjectURL(blob),
          dataUrl: c.toDataURL("image/jpeg", 0.9),
        });
        setIsOpen(false);
        stopStream();
      },
      "image/jpeg",
      0.9
    );
  };

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") {
        setIsOpen(false);
        stopStream();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => () => stopStream(), []);
  useEffect(() => {
    listDevices();
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className={labelCls}>{title}</p>
        <button
          type="button" /* ป้องกัน submit ฟอร์ม */
          onClick={() => openCamera()}
          disabled={disabled}
          className={cx(
            "px-3 py-1.5 rounded-lg border text-sm",
            disabled
              ? "border-slate-200 text-slate-400"
              : "border-slate-300 hover:bg-slate-50"
          )}
        >
          เปิดกล้อง
        </button>
      </div>

      <div className="flex items-center gap-2">
        <select
          className={cx(inputCls, "max-w-full")}
          value={deviceId}
          onChange={async (e) => {
            const val = e.target.value;
            setDeviceId(val);
            if (isOpen) await openCamera(val);
          }}
        >
          {devices.length === 0 && <option>ไม่พบอุปกรณ์กล้อง</option>}
          {devices.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `กล้อง ${i + 1}`}
            </option>
          ))}
        </select>
        <button
          type="button" /* ป้องกัน submit ฟอร์ม */
          onClick={switchCamera}
          disabled={devices.length < 2}
          className={cx(
            "px-3 py-2 rounded-lg border text-sm",
            devices.length < 2
              ? "border-slate-200 text-slate-400"
              : "border-slate-300 hover:bg-slate-50"
          )}
          title={devices.length < 2 ? "มีกล้องตัวเดียว" : "สลับกล้อง"}
        >
          สลับ
        </button>
      </div>

      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 cursor-pointer text-sm">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            onCapture?.({
              blob: file,
              url: URL.createObjectURL(file),
              dataUrl: null,
            });
            e.currentTarget.value = "";
          }}
          disabled={disabled}
        />
        อัปโหลดรูป / เปิดกล้อง IPhone
      </label>

      {err && <p className="text-xs whitespace-pre-line text-red-600">{err}</p>}

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 grid place-items-center">
          <div className="relative w-[92vw] max-w-[720px] rounded-2xl overflow-hidden border border-white/20">
            <video
              key={camKey}
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-[60vh] object-contain bg-black"
            />
            <div className="p-3 bg-black/60 flex items-center justify-between">
              <button
                type="button" /* ป้องกัน submit ฟอร์ม */
                onClick={() => {
                  setIsOpen(false);
                  stopStream();
                }}
                className="px-3 py-2 rounded-lg text-white/90 hover:text-white"
              >
                ปิด
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button" /* ป้องกัน submit ฟอร์ม */
                  onClick={switchCamera}
                  disabled={devices.length < 2}
                  className={cx(
                    "px-3 py-2 rounded-lg border text-white/90 hover:text-white",
                    devices.length < 2
                      ? "border-white/20 text-white/50"
                      : "border-white/40"
                  )}
                >
                  สลับกล้อง
                </button>
                <button
                  type="button" /* ป้องกัน submit ฟอร์ม */
                  onClick={takeShot}
                  className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-slate-200"
                >
                  {buttonLabel}
                </button>
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}

/* ───────────────── AdminDeliveryContent ───────────────── */
function AdminDeliveryContent() {
  const [form, setForm] = useState({
    bookingCode: "",
    carPlate: "",
    carName: "",
    customerName: "",
    customerPhone: "",
    customerId: "",
    pickupLocation: "",
    pickupTime: "",
    returnLocation: "",
    returnTime: "",
    notes: "",
    verifyType: "citizen_id",
    depositReceived: false,
    fuelLevel: "full",
    odometer: "",
  });
  const [idProofs, setIdProofs] = useState([]);
  const [carProofs, setCarProofs] = useState([]);
  const [slipProofs, setSlipProofs] = useState([]); // ✅ สำหรับรูปสลิปโอนยอดเต็ม

  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueErr, setQueueErr] = useState("");

  // 🔒 ล็อกปุ่มระหว่างส่ง
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState({ open: false, warn: "" });

  /* ---- fetch rentals ---- */
  const fetchRentals = async () => {
    setQueueLoading(true);
    setQueueErr("");

    try {
      const response = await fetch(
        "http://203.154.83.160/api/method/frappe.api.api.get_rentals",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform the API data to match the expected format
      const transformedData = (data.message || []).map((rental) => ({
        bookingCode: rental.name || rental.rental_no || "",
        customerName: rental.customer_name || "",
        customerPhone: rental.customer_tel || rental.customer_phone || "",
        carName: rental.car_name || "",
        carPlate: rental.car_plate || "",
        pickupPlace: rental.pickup_location || "",
        returnPlace: rental.return_location || "",
        pickupLocation: rental.pickup_location || "",
        returnLocation: rental.return_location || "",
        pickupTime: rental.pickup_time || "",
        returnTime: rental.return_time || "",
        rawStatus: rental.status || "waiting pickup",
        uiStatus: rental.status || "waiting pickup",
      }));

      setQueue(transformedData);
    } catch (error) {
      console.error("Error fetching rentals:", error);
      setQueueErr(error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setQueue([]);
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const onField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const clearFiles = (arr) => {
    arr.forEach((p) => {
      try {
        if (p?.url?.startsWith("blob:")) URL.revokeObjectURL(p.url);
      } catch {}
    });
  };

  // 🔄 อัปเดตสถานะใบจองเป็น In Use
  const updateRentalStatus = async (vid, status = "In Use") => {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    const res = await fetch(
      "http://203.154.83.160/api/method/frappe.api.api.edit_rentals_status",
      {
        method: "POST",
        headers,
        credentials: "include",
        redirect: "follow",
        body: JSON.stringify({ vid, status }),
      }
    );

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    if (!res.ok) {
      throw new Error(json?.message || json?.exception || `HTTP ${res.status}`);
    }
    return json;
  };

  /* ---- ✅ เชื่อม API ส่งฟอร์ม + รีเฟรชหน้า ---- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const required = ["bookingCode", "customerName", "customerPhone"];
    const missing = required.filter((k) => !form[k]?.trim());
    if (missing.length) {
      alert("กรุณากรอก: " + missing.join(", "));
      return;
    }

    if (idProofs.length === 0) {
      alert("กรุณาแนบรูปยืนยันตัวตนอย่างน้อย 1 รูป");
      return;
    }

    const verifyLabel =
      {
        citizen_id: "บัตรประชาชน",
        driver_license: "ใบขับขี่",
        passport: "Passport",
      }[form.verifyType] ||
      form.verifyType ||
      "";

    const fd = new FormData();
    fd.append("rental_no", form.bookingCode || "");
    fd.append("remark", form.notes || "");
    const employeeName =
      (typeof window !== "undefined" &&
        (localStorage.getItem("vrent_full_name") ||
          localStorage.getItem("vrent_user_name"))) ||
      "";
    fd.append("employee", employeeName);
    fd.append("downpayment", form.depositReceived ? "received" : "pending");
    fd.append("customer", form.customerName || "");
    fd.append("customer_tel", form.customerPhone || "");
    fd.append("document", verifyLabel);

    if (form.carPlate) fd.append("car_plate", form.carPlate);
    if (form.carName) fd.append("car_name", form.carName);
    if (form.pickupLocation) fd.append("pickup_location", form.pickupLocation);
    if (form.pickupTime)
      fd.append("pickup_time", new Date(form.pickupTime).toISOString());
    if (form.returnLocation) fd.append("return_location", form.returnLocation);
    if (form.returnTime)
      fd.append("return_time", new Date(form.returnTime).toISOString());
    if (form.fuelLevel) fd.append("fuel_level", form.fuelLevel);
    if (form.odometer)
      fd.append("odometer", String(form.odometer).replace(/,/g, ""));

    idProofs.forEach((p, i) => {
      if (p?.blob) fd.append("confirm_proofs", p.blob, `id_proof_${i + 1}.jpg`);
    });
    carProofs.forEach((p, i) => {
      if (p?.blob) fd.append("car_proofs", p.blob, `car_proof_${i + 1}.jpg`);
    });
    // ✅ แนบสลิปโอนยอดเต็ม
    slipProofs.forEach((p, i) => {
      if (p?.blob) fd.append("slip_proofs", p.blob, `slip_${i + 1}.jpg`);
    });

    setSubmitting(true);
    try {
      // 1) บันทึกส่งมอบ
      const res = await fetch(
        "http://203.154.83.160/api/method/frappe.api.api.create_dlv",
        {
          method: "POST",
          body: fd,
          credentials: "include",
          redirect: "follow",
          cache: "no-store",
        }
      );
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }
      if (!res.ok) {
        console.error("DLV_CREATE_ERROR", json);
        alert(
          "บันทึกล้มเหลว: " +
            (json?.exception || json?.message || `HTTP ${res.status}`)
        );
        return;
      }

      // 2) เปลี่ยนสถานะใบจองเป็น In Use
      let warn = "";
      try {
        await updateRentalStatus(form.bookingCode, "In Use");
      } catch (e) {
        console.error("RENTAL_STATUS_UPDATE_ERROR", e);
        warn = "แต่เปลี่ยนสถานะใบจองไม่สำเร็จ: " + (e.message || String(e));
      }

      // 3) เปิด popup เรียบ ๆ ให้ผู้ใช้กดไปต่อก่อนรีหน้า
      setSuccess({ open: true, warn });
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- fill form when click "เปิดฟอร์ม" ---- */
  const loadToForm = (j) => {
    setForm((f) => ({
      ...f,
      bookingCode: j.bookingCode || "",
      carPlate: j.carPlate || "",
      carName: j.carName || "",
      customerName: j.customerName || "",
      customerPhone: j.customerPhone || "",
      pickupLocation: j.pickupPlace ?? j.pickupLocation ?? "",
      pickupTime: toLocalInputDT(j.pickupTime),
      returnLocation: j.returnPlace ?? j.returnLocation ?? "",
      returnTime: toLocalInputDT(j.returnTime),
    }));
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 sm:gap-6 lg:gap-8">
      {/* ซ้าย: ฟอร์ม */}
      <section className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 md:p-8 group hover:bg-white/15 transition-all duration-300">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mr-3 sm:mr-4">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-black"
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
          </div>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white group-hover:text-yellow-400 transition-colors duration-300">
              Delivery Staff
            </h1>
            <span className="inline-block px-2 sm:px-3 py-1 text-xs bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-full font-semibold mt-1">
              Admin Panel
            </span>
          </div>
        </div>
        <p className="text-sm sm:text-base text-slate-300 group-hover:text-white transition-colors duration-300 mb-4 sm:mb-6">
          บันทึกข้อมูลการส่งมอบรถให้ลูกค้า
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> • </span>
          พร้อมถ่ายหลักฐาน/เอกสารยืนยันตัวตน
        </p>

        <form
          className="mt-4 sm:mt-6 grid gap-4 sm:gap-6"
          onSubmit={handleSubmit}
        >
          {/* booking / car */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className={labelCls}>รหัสการจอง *</label>
              <input
                name="bookingCode"
                className={inputCls}
                value={form.bookingCode}
                onChange={onField}
                required
                placeholder="เช่น VR-2025-000123"
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>ทะเบียนรถ</label>
              <input
                name="carPlate"
                className={inputCls}
                value={form.carPlate}
                onChange={onField}
                placeholder="1กก-1234"
              />
            </div>
            <div className="space-y-2 sm:col-span-2 md:col-span-1">
              <label className={labelCls}>รุ่นรถ</label>
              <input
                name="carName"
                className={inputCls}
                value={form.carName}
                onChange={onField}
                placeholder="Toyota Corolla Cross"
              />
            </div>
          </div>

          {/* customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className={labelCls}>ชื่อลูกค้า *</label>
              <input
                name="customerName"
                className={inputCls}
                value={form.customerName}
                onChange={onField}
                required
                placeholder="ชื่อ–นามสกุล"
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>เบอร์ติดต่อ *</label>
              <input
                name="customerPhone"
                className={inputCls}
                value={form.customerPhone}
                onChange={onField}
                required
                placeholder="080-000-0000"
              />
            </div>
            <div className="space-y-2 sm:col-span-2 md:col-span-1">
              <label className={labelCls}>เลขประจำตัว/เอกสาร</label>
              <input
                name="customerId"
                className={inputCls}
                value={form.customerId}
                onChange={onField}
                placeholder="เลขบัตร/ใบขับขี่/Passport"
              />
            </div>
          </div>

          {/* pickup / return */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className={labelCls}>สถานที่ส่งมอบ</label>
              <input
                name="pickupLocation"
                className={inputCls}
                value={form.pickupLocation}
                onChange={onField}
                placeholder="เช่น สนามบินเชียงใหม่ (CNX)"
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>วัน–เวลาส่งมอบ</label>
              <input
                type="datetime-local"
                name="pickupTime"
                className={inputCls}
                value={form.pickupTime}
                onChange={onField}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className={labelCls}>สถานที่นัดคืนรถ</label>
              <input
                name="returnLocation"
                className={inputCls}
                value={form.returnLocation}
                onChange={onField}
                placeholder="เช่น สาขาสีลม"
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>วัน–เวลาคืนรถ</label>
              <input
                type="datetime-local"
                name="returnTime"
                className={inputCls}
                value={form.returnTime}
                onChange={onField}
              />
            </div>
          </div>

          {/* numbers / flags */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>ระดับน้ำมัน</label>
              <select
                name="fuelLevel"
                className={inputCls}
                value={form.fuelLevel}
                onChange={onField}
              >
                <option value="full">เต็มถัง</option>
                <option value="3/4">3/4</option>
                <option value="1/2">1/2</option>
                <option value="1/4">1/4</option>
                <option value="empty">เกือบหมด</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelCls}>เลขไมล์ (กม.)</label>
              <input
                name="odometer"
                className={inputCls}
                value={form.odometer}
                onChange={onField}
                placeholder="เช่น 35,420"
              />
            </div>
            <div className="space-y-2"></div>
          </div>

          {/* verify type */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>เอกสารที่ใช้ยืนยัน</label>
              <select
                name="verifyType"
                className={inputCls}
                value={form.verifyType}
                onChange={onField}
              >
                <option value="citizen_id">บัตรประชาชน</option>
                <option value="driver_license">ใบขับขี่</option>
                <option value="passport">Passport</option>
              </select>
            </div>
          </div>

          {/* proofs: id */}
          <div className="space-y-3">
            <CameraBox
              title="ถ่ายรูปเอกสารยืนยันตัวตน (บัตร/ใบขับขี่/Passport)"
              onCapture={(img) =>
                setIdProofs((p) => [
                  ...p,
                  { url: img.url, blob: img.blob, dataUrl: img.dataUrl },
                ])
              }
              buttonLabel="ถ่ายหลักฐาน"
            />
            {!!idProofs.length && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {idProofs.map((p, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden border border-slate-300"
                  >
                    <img
                      src={p.dataUrl || p.url}
                      alt={`ID Proof ${i + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setIdProofs((prev) => {
                          const cp = [...prev];
                          try {
                            if (cp[i]?.url?.startsWith("blob:"))
                              URL.revokeObjectURL(cp[i].url);
                          } catch {}
                          cp.splice(i, 1);
                          return cp;
                        })
                      }
                      className="absolute top-1 right-1 px-2 py-0.5 text-xs rounded bg-black/70 text-white"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* proofs: car */}
          <div className="space-y-3">
            <CameraBox
              title="ถ่ายรูปสภาพรถตอนส่งมอบ (รอย/ล้อ/มุมต่าง ๆ)"
              onCapture={(img) =>
                setCarProofs((p) => [
                  ...p,
                  { url: img.url, blob: img.blob, dataUrl: img.dataUrl },
                ])
              }
              buttonLabel="ถ่ายรูปสภาพรถ"
            />
            {!!carProofs.length && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {carProofs.map((p, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden border border-slate-300"
                  >
                    <img
                      src={p.dataUrl || p.url}
                      alt={`Car Proof ${i + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCarProofs((prev) => {
                          const cp = [...prev];
                          try {
                            if (cp[i]?.url?.startsWith("blob:"))
                              URL.revokeObjectURL(cp[i].url);
                          } catch {}
                          cp.splice(i, 1);
                          return cp;
                        })
                      }
                      className="absolute top-1 right-1 px-2 py-0.5 text-xs rounded bg-black/70 text-white"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ✅ proofs: slip */}
          <div className="space-y-3">
            <CameraBox
              title="ถ่ายรูปสลิปการโอนยอดเต็มของลูกค้า"
              onCapture={(img) =>
                setSlipProofs((p) => [
                  ...p,
                  { url: img.url, blob: img.blob, dataUrl: img.dataUrl },
                ])
              }
              buttonLabel="ถ่ายรูปสลิป"
            />
            {!!slipProofs.length && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {slipProofs.map((p, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden border border-slate-300"
                  >
                    <img
                      src={p.dataUrl || p.url}
                      alt={`Slip Proof ${i + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSlipProofs((prev) => {
                          const cp = [...prev];
                          try {
                            if (cp[i]?.url?.startsWith("blob:"))
                              URL.revokeObjectURL(cp[i].url);
                          } catch {}
                          cp.splice(i, 1);
                          return cp;
                        })
                      }
                      className="absolute top-1 right-1 px-2 py-0.5 text-xs rounded bg-black/70 text-white"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* notes */}
          <div className="space-y-2">
            <label className={labelCls}>หมายเหตุเพิ่มเติม</label>
            <textarea
              name="notes"
              className={inputCls}
              rows={4}
              value={form.notes}
              onChange={onField}
              placeholder="เช่น มีรอยขีดข่วนบริเวณกันชนหน้า..."
            />
          </div>

          {/* action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                setForm({
                  bookingCode: "",
                  carPlate: "",
                  carName: "",
                  customerName: "",
                  customerPhone: "",
                  customerId: "",
                  pickupLocation: "",
                  pickupTime: "",
                  returnLocation: "",
                  returnTime: "",
                  notes: "",
                  verifyType: "citizen_id",
                  depositReceived: false,
                  fuelLevel: "full",
                  odometer: "",
                });
                clearFiles(idProofs);
                clearFiles(carProofs);
                setIdProofs([]);
                setCarProofs([]);
              }}
              className="px-4 sm:px-6 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white font-semibold hover:bg-white/15 hover:border-white/30 transition-all duration-300 text-sm sm:text-base"
            >
              ล้างฟอร์ม
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 text-sm sm:text-base"
            >
              {submitting ? "กำลังบันทึก..." : "บันทึกข้อมูลส่งมอบ"}
            </button>
          </div>
        </form>

        {success.open && (
          <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[360px] rounded-xl shadow-2xl border border-slate-200 p-5 text-center">
              <div className="text-3xl">✅</div>
              <h4 className="mt-2 text-lg font-bold">บันทึกสำเร็จ</h4>

              {!!success.warn && (
                <p className="mt-1 text-xs text-slate-600 whitespace-pre-line">
                  {success.warn}
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setSuccess({ open: false, warn: "" });
                  window.location.reload();
                }}
                className="mt-4 w-full rounded-lg bg-black text-white py-2 hover:bg-slate-900"
              >
                ไปต่อ
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ขวา: สรุปโดยย่อ */}
      <aside className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8 h-fit group hover:bg-white/15 transition-all duration-300">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors duration-300">
            สรุปโดยย่อ
          </h3>
        </div>
        <div className="mt-4 text-sm space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-300">รหัสการจอง</span>
            <span className="font-medium text-white">
              {form.bookingCode || "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">ลูกค้า</span>
            <span className="font-medium text-white">
              {form.customerName || "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">โทร</span>
            <span className="text-white">{form.customerPhone || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">ส่งมอบ</span>
            <span className="text-right text-white">
              {form.pickupLocation || "-"}
              <br className="hidden sm:block" />
              <span className="text-slate-300">{form.pickupTime || "-"}</span>
            </span>
          </div>
          <hr className="my-3 border-white/20" />
          <div className="flex justify-between">
            <span className="text-slate-300">ประเภทเอกสาร</span>
            <span className="text-white">
              {
                {
                  citizen_id: "บัตรประชาชน",
                  driver_license: "ใบขับขี่",
                  passport: "Passport",
                }[form.verifyType]
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">รูปที่แนบทั้งหมด</span>
            <span className="text-white">
              {idProofs.length + carProofs.length + slipProofs.length} รูป
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">สลิปโอนยอดเต็ม</span>
            <span className="text-white">
              {slipProofs.length ? "แนบแล้ว" : "-"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-300">น้ำมัน</span>
            <span className="text-white">{form.fuelLevel}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-300">เงินมัดจำ</span>
            <span className="text-white">รับแล้ว</span>
          </div>
        </div>
      </aside>

      {/* ขวา: คิววันนี้ */}
      <aside className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8 h-fit group hover:bg-white/15 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors duration-300">
                คิววันนี้ (Today)
              </h3>
              <p className="text-slate-300 text-sm mt-1">
                แสดงเฉพาะงานรับรถที่นัดหมาย &quot;วันนี้&quot;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchRentals}
            disabled={queueLoading}
            className="px-3 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/15 hover:border-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="รีเฟรชข้อมูล"
          >
            <svg
              className={`w-4 h-4 ${queueLoading ? "animate-spin" : ""}`}
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
          </button>
        </div>
        <TodayQueue
          queue={queue}
          onPick={loadToForm}
          loading={queueLoading}
          error={queueErr}
        />
      </aside>
    </div>
  );
}

/* ───────────────── TodayQueue ───────────────── */
function TodayQueue({ queue, onPick, loading, error }) {
  const sameDate = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const fmtTime = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const todayQueue = useMemo(() => {
    const now = new Date();

    return queue
      .filter((j) => {
        if (!j.pickupTime) return false;

        // เฉพาะงานที่นัด "วันนี้"
        if (!sameDate(new Date(j.pickupTime), now)) return false;

        const s = String(j.uiStatus || "").toLowerCase();

        // ตัดสถานะที่ไม่เกี่ยว
        if (s === "completed" || s === "cancelled" || s === "in use")
          return false;

        // ✅ รับสองสถานะ: waiting pickup และ pickup overdue (ถ้ามีจากต้นทาง)
        return s === "waiting pickup" || s === "pickup overdue";
      })
      .map((j) => {
        // ถ้างานยังเป็น waiting pickup แต่เวลานัด < ตอนนี้ => ยกระดับเป็น pickup overdue
        const pick = new Date(j.pickupTime);
        const overdue = isFinite(pick.getTime()) && pick < new Date();

        if (
          overdue &&
          String(j.uiStatus || "").toLowerCase() === "waiting pickup"
        ) {
          return { ...j, uiStatus: "pickup overdue" };
        }
        return j;
      });
  }, [queue]);

  if (loading) {
    return (
      <div className="mt-3">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-slate-300">
            <svg
              className="animate-spin h-5 w-5"
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
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-400 mb-2">
              <svg
                className="w-8 h-8 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-red-300 text-sm">เกิดข้อผิดพลาด: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="mb-2 text-[11px] sm:text-xs text-slate-300">
        ทั้งหมด {todayQueue.length} งานในวันนี้
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm">
        <table className="w-full text-[10px] sm:text-xs leading-tight">
          <thead className="bg-white/10 backdrop-blur-sm sticky top-0 z-10">
            <tr className="text-slate-300">
              <th className="px-1.5 py-1 sm:px-2 sm:py-2 text-left w-14">
                เวลา
              </th>
              <th className="px-1.5 py-1 sm:px-2 sm:py-2 text-left w-24">
                รหัส
              </th>
              <th className="px-1.5 py-1 sm:px-2 sm:py-2 text-left">
                รถ / ป้าย
              </th>
              <th className="px-1.5 py-1 sm:px-2 sm:py-2 text-left hidden sm:table-cell">
                ลูกค้า
              </th>
              <th className="px-1.5 py-1 sm:px-2 sm:py-2 text-left hidden md:table-cell">
                สถานที่
              </th>
              <th className="px-1.5 py-1 sm:px-2 sm:py-2 text-left w-24">
                สถานะ
              </th>
              <th className="px-1.5 py-1 sm:px-2 sm:py-2 text-left w-20">
                จัดการ
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {todayQueue
              .slice()
              .sort((a, b) => new Date(a.pickupTime) - new Date(b.pickupTime))
              .map((j) => {
                const stat = STATUS[j.uiStatus] ?? STATUS["waiting pickup"];
                return (
                  <tr
                    key={j.bookingCode}
                    className="hover:bg-white/10 transition-colors duration-200"
                  >
                    <td className="px-1.5 py-1 sm:px-2 sm:py-2 whitespace-nowrap font-mono text-white">
                      {fmtTime(j.pickupTime)}
                    </td>

                    <td className="px-1.5 py-1 sm:px-2 sm:py-2 font-medium whitespace-nowrap truncate max-w-[88px] text-white">
                      {j.bookingCode}
                    </td>

                    <td className="px-1.5 py-1 sm:px-2 sm:py-2">
                      <div className="font-medium truncate max-w-[120px] sm:max-w-none text-white">
                        {j.carName || "-"}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-300 truncate">
                        {j.carPlate || "-"}
                      </div>
                    </td>

                    <td className="px-1.5 py-1 sm:px-2 sm:py-2 hidden sm:table-cell">
                      <div className="truncate text-white">
                        {j.customerName || "-"}
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">
                        {j.customerPhone || "-"}
                      </div>
                    </td>

                    <td className="px-1.5 py-1 sm:px-2 sm:py-2 hidden md:table-cell">
                      <div className="truncate text-white">
                        {j.pickupPlace || j.pickupLocation || "-"}
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">
                        คืน: {j.returnPlace || j.returnLocation || "-"}
                      </div>
                    </td>

                    <td className="px-1.5 py-1 sm:px-2 sm:py-2">
                      <span
                        className={cx(
                          "inline-flex items-center rounded-full px-1.5 py-[2px] text-[10px] sm:text-[11px] font-medium",
                          j.uiStatus === "pickup overdue"
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : j.uiStatus === "waiting pickup"
                            ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                            : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                        )}
                      >
                        {stat.label}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => onPick(j)}
                        className="h-6 sm:h-7 px-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/15 hover:border-white/30 transition-all duration-200"
                        title="เปิดฟอร์มด้วยข้อมูลนี้"
                      >
                        เปิดฟอร์ม
                      </button>
                    </td>
                  </tr>
                );
              })}

            {!todayQueue.length && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-5 text-center text-slate-400"
                >
                  วันนี้ยังไม่มีคิวรับรถ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────── Gate ───────────────── */
export default function DeliveryStaffPage() {
  const [auth, setAuth] = useState({
    loading: true,
    isAdmin: false,
    name: "",
    email: "",
  });

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

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 overflow-hidden">
      <title>Delivery Staff - V-Rent</title>

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-white">
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    Delivery Staff
                  </span>
                </h1>
                <span className="ml-3 px-2 py-1 text-xs bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-full font-semibold">
                  Admin
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-300">ยินดีต้อนรับ</span>
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-semibold text-sm">DS</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-grow">
          {/* 🚧 TEMPORARY: ข้ามหน้า Loading และ Access Denied เพื่อแก้ไข UX/UI */}
          {false ? ( // auth.loading
            <LoadingCard
              title="กำลังตรวจสอบสิทธิ์..."
              subtitle="กรุณารอสักครู่ ระบบกำลังตรวจสอบสิทธิ์ผู้ใช้งาน"
            />
          ) : false ? ( // !auth.isAdmin
            <AccessDeniedCard
              title="เข้าถึงไม่ได้ - Delivery Staff"
              subtitle="หน้านี้สำหรับผู้ดูแลระบบเท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ"
              customActions={
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/Login"
                    className="group relative px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-lg font-semibold rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25 hover:from-amber-500 hover:to-yellow-400"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      เข้าสู่ระบบ
                    </span>
                  </Link>

                  <Link
                    href="/"
                    className="group relative px-8 py-3 bg-white/10 backdrop-blur-md text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      กลับหน้าหลัก
                    </span>
                  </Link>
                </div>
              }
            />
          ) : (
            <AdminDeliveryContent />
          )}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
