"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function CarDetailModal({ car, isOpen, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        if (isImageModalOpen) {
          setIsImageModalOpen(false);
        } else {
          onClose();
        }
      }
    },
    [onClose, isImageModalOpen]
  );

  const handleImageClick = () => {
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !car) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-black to-slate-800 rounded-3xl border border-white/20 shadow-2xl overflow-hidden transition-all duration-300 ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Header */}
        <div
          className="relative h-64 sm:h-80 overflow-hidden cursor-pointer group"
          onClick={handleImageClick}
        >
          <img
            src={car.image}
            alt={car.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Click to enlarge indicator */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 z-10"
          >
            <svg
              className="w-6 h-6"
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

          {/* Car Type Badge */}
          <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold z-10">
            {car.type}
          </div>

          {/* Price Badge */}
          <div className="absolute bottom-4 right-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-4 py-2 rounded-xl text-lg font-bold shadow-lg z-10">
            ฿{car.pricePerDay.toLocaleString()}/วัน
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {car.name}
            </h2>
            <p className="text-slate-300 text-lg">
              {car.brand} • ปี {car.year}
            </p>
          </div>

          {/* Car Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Transmission */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-yellow-400/20 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold">เกียร์</h3>
              </div>
              <p className="text-slate-300">{car.transmission}</p>
            </div>

            {/* Seats */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-yellow-400/20 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5V22h6zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9.5c0-.83.67-1.5 1.5-1.5S12 8.67 12 9.5V15h1.5v7h-6z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold">ที่นั่ง</h3>
              </div>
              <p className="text-slate-300">{car.seats} ที่นั่ง</p>
            </div>

            {/* Fuel Type */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-yellow-400/20 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.32 7.16A7.94 7.94 0 0 0 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46a5.9 5.9 0 0 1 2.55-1.1l5.32 5.32c.81-.42 1.41-1.15 1.68-2.02l-1.68-1.67zM12 8c-2.21 0-4 1.79-4 4 0 1.1.45 2.1 1.17 2.83l1.46-1.46A2 2 0 0 1 10 12c0-1.1.9-2 2-2s2 .9 2 2c0 .84-.53 1.56-1.28 1.85l1.46 1.46C15.55 14.1 16 13.1 16 12c0-2.21-1.79-4-4-4zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM12 18.5c-3.04 0-5.93-1.61-7.5-4.27 1.1-1.9 2.64-3.4 4.5-4.3l2.5 2.5c-1.1.4-1.9 1.4-1.9 2.57 0 1.66 1.34 3 3 3s3-1.34 3-3c0-1.17-.8-2.17-1.9-2.57l2.5 2.5c-.86.9-1.4 2.4-1.4 4.07 0 1.66 1.34 3 3 3s3-1.34 3-3c0-1.67-.54-3.17-1.4-4.07l2.5 2.5c-.9.9-2.4 1.4-4.07 1.4z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold">เชื้อเพลิง</h3>
              </div>
              <p className="text-slate-300">{car.fuel}</p>
            </div>
          </div>

          {/* Description */}
          {car.description && (
            <div className="mb-8">
              <h3 className="text-white font-semibold text-lg mb-3">
                รายละเอียด
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {car.description}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/cars?vehicle_id=${car.id}`}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-3 rounded-xl font-semibold text-center transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              เช่ารถคันนี้
            </Link>
            <button
              onClick={onClose}
              className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-white/20 hover:border-yellow-400/30"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={handleCloseImageModal}
        >
          <div className="relative max-w-7xl max-h-[95vh] w-full h-full flex items-center justify-center">
            <img
              src={car.image}
              alt={car.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Close Button */}
            <button
              onClick={handleCloseImageModal}
              className="absolute top-4 right-4 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
            >
              <svg
                className="w-8 h-8"
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

            {/* Image Info */}
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-xl p-4 text-white">
              <h3 className="text-lg font-semibold">{car.name}</h3>
              <p className="text-sm text-slate-300">
                {car.brand} • ปี {car.year}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
