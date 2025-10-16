// Components/admin/AdminSlideModal.jsx
"use client";

import { useState, useEffect } from "react";
import CarsTableNew from "./CarsTableNew";
import BookingsTableNew from "./BookingsTableNew";
import DeliveriesTableNew from "./DeliveriesTableNew";

export default function AdminSlideModal({
  cars = [],
  bookings = [],
  deliveries = [],
  carMapById = new Map(),
  carMapByKey = new Map(),
  nextBookingMap = {},
  now = new Date(),
  onEditCar,
  onDeleteCar,
  onConfirmPickup,
  onComplete,
  onFetchCars,
  onFetchBookings, // เพิ่มใหม่
  onFetchDeliveries, // เพิ่มใหม่
  getCarRowStatus,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTable, setActiveTable] = useState("cars");

  const tables = [
    {
      id: "cars",
      title: "ตารางรถ",
      icon: "🚗",
      count: cars.length,
      description: "จัดการข้อมูลรถทั้งหมด",
    },
    {
      id: "bookings",
      title: "การจอง",
      icon: "📋",
      count: bookings.length,
      description: "ติดตามการจองของลูกค้า",
    },
    {
      id: "deliveries",
      title: "ส่งมอบ",
      icon: "🚚",
      count: deliveries.length,
      description: "บันทึกการส่งมอบรถ",
    },
  ];

  const renderTableContent = () => {
    switch (activeTable) {
      case "cars":
        return (
          <CarsTableNew
            cars={cars}
            bookings={bookings}
            now={now}
            nextBookingMap={nextBookingMap}
            onEdit={onEditCar}
            onDelete={onDeleteCar}
            onAddCar={() => {
              // Close modal and scroll to AddCarCard
              setIsOpen(false);
              setTimeout(() => {
                const addCarElement = document.querySelector(
                  "[data-add-car-card]"
                );
                if (addCarElement) {
                  addCarElement.scrollIntoView({ behavior: "smooth" });
                }
              }, 300);
            }}
            onRefresh={onFetchCars}
            onFetchCars={onFetchCars}
            getCarRowStatus={getCarRowStatus}
          />
        );
      case "bookings":
        return (
          <BookingsTableNew
            bookings={bookings}
            carMapById={carMapById}
            carMapByKey={carMapByKey}
            onOpenDetail={() => {}}
            onConfirmPickup={async (booking) => {
              await onConfirmPickup(booking);
              if (onFetchBookings) await onFetchBookings();
            }}
            onComplete={async (booking) => {
              await onComplete(booking);
              if (onFetchBookings) await onFetchBookings();
            }}
            onFetchBookings={onFetchBookings}
          />
        );
      case "deliveries":
        return (
          <DeliveriesTableNew
            deliveries={deliveries}
            onUpdateStatus={async (delivery, newStatus) => {
              // Call API to update status
              // Then refresh
              if (onFetchDeliveries) await onFetchDeliveries();
            }}
            onFetchDeliveries={onFetchDeliveries}
          />
        );
      default:
        return null;
    }
  };

  // Lock scroll when modal is open and auto scroll to top
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Smooth scroll to top when modal opens
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  // Smooth scroll to top when switching tables
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [activeTable, isOpen]);

  return (
    <>
      {/* Trigger Cards - ปรับให้เข้ากับธีม Dark และ Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => {
              setActiveTable(table.id);
              setIsOpen(true);
            }}
            className="group relative bg-white/10 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl hover:bg-white/15 hover:border-white/30 transition-all duration-300 p-4 md:p-6 text-left hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                {table.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-bold text-white group-hover:text-yellow-400 transition-colors duration-300 truncate">
                  {table.title}
                </h3>
                <p className="text-xs md:text-sm text-slate-300 mt-1 group-hover:text-white transition-colors duration-300 line-clamp-2">
                  {table.description}
                </p>
                <div className="mt-2 md:mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400/20 to-amber-500/20 text-yellow-300 border border-yellow-400/30">
                    {table.count} รายการ
                  </span>
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-yellow-400 transition-colors duration-300 flex-shrink-0">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Slide Modal - ปรับให้เข้ากับธีม Dark */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Enhanced Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-yellow-400/10 rounded-full animate-pulse"
                style={{
                  width: `${2 + Math.random() * 4}px`,
                  height: `${2 + Math.random() * 4}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {/* Modal Container */}
          <div className="absolute inset-y-0 right-0 w-full max-w-7xl bg-gradient-to-br from-slate-900 via-black to-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out">
            {/* Enhanced Header */}
            <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-md border-b border-white/10 px-2 md:px-4 py-1 md:py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="w-5 h-5 md:w-8 md:h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-sm md:rounded-lg flex items-center justify-center text-xs md:text-sm shadow-lg flex-shrink-0">
                    {tables.find((t) => t.id === activeTable)?.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xs md:text-sm font-bold text-white truncate">
                      {tables.find((t) => t.id === activeTable)?.title}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  {/* Enhanced Close Button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-5 h-5 md:w-7 md:h-7 rounded-sm md:rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/30 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-300 hover:scale-105"
                  >
                    <svg
                      className="w-3 h-3"
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
                  </button>
                </div>
              </div>

              {/* Mobile Table Switcher */}
              <div className="mt-1 md:hidden">
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-sm p-1 border border-white/20 overflow-x-auto">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setActiveTable(table.id)}
                      className={`px-1 py-1 rounded-sm text-xs font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                        activeTable === table.id
                          ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg"
                          : "text-slate-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <span className="mr-1">{table.icon}</span>
                      {table.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Table Switcher */}
              <div className="hidden md:block mt-1">
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setActiveTable(table.id)}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 ${
                        activeTable === table.id
                          ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg"
                          : "text-slate-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <span className="mr-1">{table.icon}</span>
                      {table.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Content */}
            <div className="h-[calc(100vh-70px)] md:h-[calc(100vh-70px)] overflow-y-auto">
              <div className="p-0 md:p-3 pb-0 md:pb-3">
                <div className="bg-white/5 backdrop-blur-sm rounded-none md:rounded-lg border-none md:border border-white/10 overflow-hidden">
                  {renderTableContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
