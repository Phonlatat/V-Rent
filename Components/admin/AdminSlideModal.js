// Components/admin/AdminSlideModal.jsx
"use client";

import { useState, useEffect } from "react";
import CarsTable from "./CarsTable";
import BookingsTable from "./BookingsTable";
import DeliveriesTable from "./DeliveriesTable";

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
          <CarsTable
            cars={cars}
            bookings={bookings}
            now={now}
            nextBookingMap={nextBookingMap}
            onEdit={onEditCar}
            onDelete={onDeleteCar}
            getCarRowStatus={getCarRowStatus}
          />
        );
      case "bookings":
        return (
          <BookingsTable
            bookings={bookings}
            carMapById={carMapById}
            carMapByKey={carMapByKey}
            onOpenDetail={() => {}}
            onConfirmPickup={onConfirmPickup}
            onComplete={onComplete}
          />
        );
      case "deliveries":
        return <DeliveriesTable />;
      default:
        return null;
    }
  };

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
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

  return (
    <>
      {/* Trigger Button */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => {
              setActiveTable(table.id);
              setIsOpen(true);
            }}
            className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 text-left hover:border-slate-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center text-2xl">
                {table.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700">
                  {table.title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {table.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {table.count} รายการ
                  </span>
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-slate-600">
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Slide Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="absolute inset-y-0 right-0 w-full max-w-7xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center text-xl">
                    {tables.find(t => t.id === activeTable)?.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {tables.find(t => t.id === activeTable)?.title}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {tables.find(t => t.id === activeTable)?.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Table Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    {tables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => setActiveTable(table.id)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeTable === table.id
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span className="mr-2">{table.icon}</span>
                        {table.title}
                      </button>
                    ))}
                  </div>
                  
                  {/* Close Button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="h-[calc(100vh-80px)] overflow-y-auto">
              <div className="p-6">
                {renderTableContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
