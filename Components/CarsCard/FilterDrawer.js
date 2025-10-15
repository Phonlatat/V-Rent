// Components/FilterDrawer.jsx
"use client";

import { useEffect } from "react";

export default function FilterDrawer({
  open,
  onClose,
  title = "ตัวกรอง",
  children,
}) {
  // lock scroll
  useEffect(() => {
    const html = document.documentElement;
    if (open) {
      const prev = html.style.overflow;
      html.style.overflow = "hidden";
      return () => {
        html.style.overflow = prev;
      };
    }
  }, [open]);

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Enhanced Overlay with backdrop blur */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Enhanced Drawer with dark theme */}
      <aside
        role="dialog"
        aria-modal="true"
        className={[
          "fixed inset-y-0 left-0 z-50 w-[86%] max-w-sm bg-gradient-to-br from-slate-900 via-black to-slate-800 shadow-2xl border-r border-white/20",
          "transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
          "flex flex-col backdrop-blur-md",
        ].join(" ")}
      >
        {/* Enhanced Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 bg-white/5 backdrop-blur-sm">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Enhanced Content Area */}
        <div className="min-h-0 flex-1 overflow-auto p-4 bg-gradient-to-br from-slate-900/50 to-black/50">
          {children}
        </div>
      </aside>
    </>
  );
}
