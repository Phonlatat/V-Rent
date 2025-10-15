"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ERP_BASE = (
  process.env.NEXT_PUBLIC_ERP_BASE || "http://203.150.243.195"
).replace(/\/+$/, "");

export default function Header() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const computeFromStorage = () => {
    const uid = localStorage.getItem("vrent_user_id") || "";
    const nameFromStorage =
      localStorage.getItem("vrent_full_name") ||
      localStorage.getItem("vrent_user_name") ||
      "";
    const fallback = uid && uid.includes("@") ? uid.split("@")[0] : uid;
    return { uid, name: nameFromStorage || fallback };
  };

  async function hydrateFromERP() {
    try {
      // 1) หา user จาก localStorage; ถ้าไม่มีให้ถาม ERP ก่อน
      let uid = localStorage.getItem("vrent_user_id") || "";
      if (!uid) {
        const whoRes = await fetch(
          `${ERP_BASE}/api/method/frappe.auth.get_logged_user`,
          { method: "GET", credentials: "include", cache: "no-store" }
        );
        const whoJson = await whoRes.json().catch(() => ({}));
        const who = whoJson?.message || "";
        if (who && who !== "Guest") {
          uid = who;
          localStorage.setItem("vrent_user_id", uid);
        }
      }
      if (!uid) return; // ❗ ไม่มีผู้ใช้ก็ไม่ต้องเรียกต่อ

      // 2) เรียก get_user_information พร้อม query user_id
      const u = new URL(
        `${ERP_BASE}/api/method/frappe.api.api.get_user_information`
      );
      u.searchParams.set("user_id", uid);
      const r = await fetch(u.toString(), {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!r.ok) return;

      const data = await r.json();
      const msg = data?.message ?? data ?? {};

      const first = msg.first_name || msg.given_name || "";
      const last = msg.last_name || msg.surname || "";
      const fullName =
        first || last
          ? [first, last].filter(Boolean).join(" ")
          : msg.full_name || msg.fullname || msg.name || "";
      const email = msg.email || msg.user || msg.user_id || msg.username || uid;

      const rolesRaw = msg.roles || [];
      const roles = Array.isArray(rolesRaw)
        ? rolesRaw
            .map((r) => (typeof r === "string" ? r : r?.role))
            .filter(Boolean)
        : [];
      const isAdmin =
        String(email).toLowerCase() === "administrator" ||
        roles.some((r) => /^(Administrator|System Manager)$/i.test(String(r)));

      if (email) localStorage.setItem("vrent_user_id", email);
      if (fullName) localStorage.setItem("vrent_full_name", fullName);
      localStorage.setItem("vrent_is_admin", String(isAdmin));

      const { uid: sUid, name } = computeFromStorage();
      setUserId(sUid);
      setDisplayName(name);
    } catch (e) {
      // ไม่มี session/เรียกไม่สำเร็จ ก็ข้ามไปเงียบ ๆ
    }
  }

  useEffect(() => {
    const { uid, name } = computeFromStorage();
    setUserId(uid);
    setDisplayName(name);

    hydrateFromERP();

    const onStorage = () => {
      const { uid: nextUid, name: nextName } = computeFromStorage();
      setUserId(nextUid);
      setDisplayName(nextName);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch(`${ERP_BASE}/api/method/logout`, {
        method: "GET",
        credentials: "include",
      });
    } catch (err) {
      console.error("logout error:", err);
    } finally {
      localStorage.removeItem("vrent_user_id");
      localStorage.removeItem("vrent_full_name");
      localStorage.removeItem("vrent_user_name");
      localStorage.removeItem("vrent_is_admin");
      localStorage.removeItem("vrent_login_email");
      localStorage.removeItem("vrent_phone");
      localStorage.removeItem("vrent_remember");

      setUserId("");
      setDisplayName("");
      setSigningOut(false);
      router.push("/Login");
    }
  };

  return (
    <header
      className="w-full bg-white text-slate-900 px-6 py-4 flex items-center justify-between border-0 shadow-none ring-0 outline-none"
      style={{ boxShadow: "none" }}
    >
      <div className="text-3xl font-bold">
        <Link href="/mainpage" className="flex items-center gap-1">
          <span>V</span>
          <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            -
          </span>
          <span>Rent</span>
        </Link>
      </div>

      <div className="flex items-center space-x-3">
        {userId ? (
          <>
            <span
              className="px-3 py-1.5 text-sm text-slate-700 rounded-md bg-slate-100 cursor-default select-none"
              title="ชื่อผู้ใช้"
            >
              {displayName || userId}
            </span>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-3 py-1.5 text-sm rounded-md bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60 transition-colors"
            >
              {signingOut ? "กำลังออก..." : "Sign out"}
            </button>
          </>
        ) : (
          <Link
            href="/Login"
            className="px-3 py-1.5 text-sm text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
