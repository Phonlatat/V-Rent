// Components/admin/AdminTabs.jsx
"use client";

import { useState } from "react";
import CarsTable from "./CarsTable";
import BookingsTable from "./BookingsTable";
import DeliveriesTable from "./DeliveriesTable";

export default function AdminTabs({
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
  const [activeTab, setActiveTab] = useState("cars");

  const tabs = [
    {
      id: "cars",
      label: "ตารางรถ",
      icon: "🚗",
      count: cars.length,
    },
    {
      id: "bookings",
      label: "การจอง",
      icon: "📋",
      count: bookings.length,
    },
    {
      id: "deliveries",
      label: "ส่งมอบ",
      icon: "🚚",
      count: deliveries.length,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-yellow-400 to-amber-500">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-white hover:text-slate-100 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === tab.id
                      ? "bg-slate-100 text-slate-700"
                      : "bg-white/20 text-white"
                  }`}
                >
                  {tab.count}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-0">
        {renderTabContent()}
      </div>
    </div>
  );
}
