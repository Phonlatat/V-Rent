"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const readUserFromStorage = () => {
    const uid = localStorage.getItem("vrent_user_id") || "";
    const name =
      localStorage.getItem("vrent_full_name") ||
      localStorage.getItem("vrent_user_name") ||
      (uid && uid.includes("@") ? uid.split("@")[0] : uid);
    return { uid, name };
  };

  useEffect(() => {
    const { uid, name } = readUserFromStorage();
    setUserId(uid);
    setDisplayName(name);

    // เผื่อมีการ login/logout จากแท็บอื่น
    const onStorage = () => {
      const { uid: nextUid, name: nextName } = readUserFromStorage();
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
      // ลบ session cookie ที่ ERPNext
      await fetch("http://203.154.83.160/api/method/logout", {
        method: "GET",
        credentials: "include",
      });
    } catch (e) {
      console.error("logout api failed (continue clearing local):", e);
    } finally {
      // ล้างข้อมูลฝั่ง client เสมอ
      try {
        localStorage.removeItem("vrent_user_id");
        localStorage.removeItem("vrent_full_name");
        localStorage.removeItem("vrent_user_name");
        localStorage.removeItem("vrent_is_admin");
        localStorage.removeItem("vrent_login_email");
        localStorage.removeItem("vrent_remember");
      } catch {}
      setUserId("");
      setDisplayName("");
      setSigningOut(false);
      router.push("/Login");
    }
  };

  return (
    <header className="w-full bg-black text-white px-6 py-4 flex items-center justify-between shadow-md">
      {/* ด้านซ้าย */}
      <div className="text-2xl font-bold">
        <Link href="/adminpageT">V-Rent-Admin</Link>
      </div>

      {/* ด้านขวา */}
      <div className="flex items-center space-x-3">
        {userId ? (
          <>
            <span
              className="px-3 py-1.5 text-sm text-gray-300 rounded-md bg-gray-800 cursor-default select-none"
              title="ชื่อผู้ใช้"
            >
              {displayName || userId}
            </span>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-3 py-1.5 text-sm rounded-md bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60 transition-colors"
              aria-label="Sign out"
              title="ออกจากระบบ"
            >
              {signingOut ? "กำลังออก..." : "Sign out"}
            </button>
          </>
        ) : (
          <Link
            href="/Login"
            className="px-3 py-1.5 text-sm text-gray-200 rounded-md hover:bg-gray-800 transition-colors"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
