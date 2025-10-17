"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { cars } from "@/data/cars";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [animatedStats, setAnimatedStats] = useState({});
  const [openFAQ, setOpenFAQ] = useState(null);
  const sectionRefs = useRef({});

  // Hero image carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    // Delay to ensure DOM is ready
    setTimeout(() => {
      Object.values(sectionRefs.current).forEach((ref) => {
        if (ref) observer.observe(ref);
      });
    }, 100);

    return () => observer.disconnect();
  }, []);

  // Fallback: Show all sections after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      const allSectionIds = [
        "stats-section",
        "trust-badges",
        "how-it-works",
        "popular-cars",
        "features",
        "testimonials",
        "faq",
        "security",
        "cta",
        "footer",
      ];
      setVisibleSections(new Set(allSectionIds));
    }, 1500); // Show all sections after 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  // Animated number counter
  useEffect(() => {
    if (visibleSections.has("stats-section")) {
      const statsToAnimate = [
        { key: "cars", end: 500, duration: 2000 },
        { key: "customers", end: 1000, duration: 2500 },
        { key: "support", end: 24, duration: 1500 },
        { key: "rating", end: 5, duration: 1000 },
      ];

      statsToAnimate.forEach(({ key, end, duration }) => {
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(easeOut * end);

          setAnimatedStats((prev) => ({ ...prev, [key]: current }));

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      });
    }
  }, [visibleSections]);

  useEffect(() => {
    setIsLoaded(true);

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Parallax effect for background elements
      const parallaxElements = document.querySelectorAll("[data-parallax]");
      parallaxElements.forEach((el) => {
        const speed = el.dataset.parallax || 0.5;
        el.style.transform = `translateY(${scrollY * speed}px)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    { name: "คุณสมชาย", text: "บริการดีมาก รถสะอาด ราคาเป็นธรรม", rating: 5 },
    { name: "คุณสมหญิง", text: "สะดวก รวดเร็ว พนักงานใจดี", rating: 5 },
    {
      name: "คุณสมศักดิ์",
      text: "เช่าแล้วประทับใจมาก ครั้งหน้าจะเช่าอีก",
      rating: 5,
    },
  ];

  const stats = [
    {
      number: animatedStats.cars || 0,
      suffix: "+",
      label: "รถให้เช่า",
      icon: "🚗",
      key: "cars",
    },
    {
      number: animatedStats.customers || 0,
      suffix: "+",
      label: "ลูกค้าพอใจ",
      icon: "😊",
      key: "customers",
    },
    {
      number: animatedStats.support || 0,
      suffix: "/7",
      label: "บริการช่วยเหลือ",
      icon: "🛟",
      key: "support",
    },
    {
      number: animatedStats.rating || 0,
      suffix: "★",
      label: "คะแนนเฉลี่ย",
      icon: "⭐",
      key: "rating",
    },
  ];

  // Popular cars data
  const popularCars = [
    cars.find((c) => c.id === 1), // Toyota Corolla Cross
    cars.find((c) => c.id === 4), // Nissan Skyline R34
    cars.find((c) => c.id === 2), // Mitsubishi Evolution
    cars.find((c) => c.id === 3), // Toyota AE86
    cars.find((c) => c.id === 7), // Nissan Silvia S13
    cars.find((c) => c.id === 8), // Subaru WRX STI
  ].filter(Boolean);

  // Hero images for carousel
  const heroImages = [
    "/images/cars/toyota-corolla-cross.jpg",
    "/images/cars/Evo.jpg",
    "/images/cars/JDM-7.jpg",
  ];

  // FAQ data
  const faqData = [
    {
      question: "มีประกันอะไรบ้าง?",
      answer:
        "เรามีประกันภัยชั้นหนึ่งครอบคลุมทุกสถานการณ์ รวมถึงประกันอุบัติเหตุส่วนบุคคล และประกันความเสียหายต่อทรัพย์สินของบุคคลที่สาม",
    },
    {
      question: "ยกเลิกการจองได้อย่างไร?",
      answer:
        "สามารถยกเลิกการจองได้ฟรีก่อนเวลารับรถ 24 ชั่วโมง ผ่านระบบออนไลน์หรือติดต่อศูนย์บริการลูกค้า",
    },
    {
      question: "ต้องวางเงินมัดจำไหม?",
      answer:
        "ไม่ต้องวางเงินมัดจำ เพียงชำระค่าธรรมเนียมการเช่าตามระยะเวลาที่กำหนด และมีการตรวจสอบบัตรเครดิตเพื่อความปลอดภัย",
    },
    {
      question: "รถเสียระหว่างทางทำยังไง?",
      answer:
        "ติดต่อศูนย์บริการช่วยเหลือ 24 ชั่วโมง เราจะจัดรถสำรองให้ทันที หรือส่งช่างไปแก้ไขตามความเหมาะสม",
    },
    {
      question: "มีบริการส่งรถถึงที่ไหม?",
      answer:
        "มีบริการส่งรถถึงที่ในเขตกรุงเทพฯ และปริมณฑล มีค่าใช้จ่ายเพิ่มเติมตามระยะทางและเวลาที่ร้องขอ",
    },
    {
      question: "เช่าขั้นต่ำกี่วัน?",
      answer:
        "สามารถเช่าได้ขั้นต่ำ 1 วัน สำหรับรถประเภททั่วไป และขั้นต่ำ 3 วันสำหรับรถสปอร์ตหรือรถคลาสสิก",
    },
  ];

  // Trust badges data
  const trustBadges = [
    { name: "ประกันชั้น 1", icon: "🛡️" },
    { name: "SSL Security", icon: "🔒" },
    { name: "ISO 9001", icon: "⭐" },
    { name: "24/7 Support", icon: "📞" },
  ];

  // How it works steps
  const howItWorksSteps = [
    {
      step: 1,
      title: "เลือกรถและวันที่",
      description: "เลือกรถที่ต้องการและกำหนดวันที่รับ-คืนรถ",
      icon: "🚗",
    },
    {
      step: 2,
      title: "กรอกข้อมูลและชำระเงิน",
      description: "กรอกข้อมูลส่วนตัวและชำระเงินผ่านระบบปลอดภัย",
      icon: "💳",
    },
    {
      step: 3,
      title: "รับการยืนยัน",
      description: "รับเอกสารยืนยันและรายละเอียดการรับรถ",
      icon: "✅",
    },
    {
      step: 4,
      title: "รับรถตามเวลาที่กำหนด",
      description: "มารับรถที่จุดนัดหมายพร้อมเอกสารที่จำเป็น",
      icon: "🚙",
    },
  ];

  // Security features
  const securityFeatures = [
    {
      title: "ประกันภัยครบถ้วน",
      description: "ประกันชั้น 1 ครอบคลุมทุกสถานการณ์",
      icon: "🛡️",
    },
    {
      title: "ชำระเงินปลอดภัย",
      description: "ระบบชำระเงินมาตรฐานสากล SSL",
      icon: "🔒",
    },
    {
      title: "นโยบายการยกเลิก",
      description: "ยกเลิกฟรีก่อน 24 ชั่วโมง",
      icon: "🔄",
    },
    {
      title: "มาตรฐานความปลอดภัย",
      description: "ผ่านการตรวจสอบและรับรองมาตรฐาน",
      icon: "✅",
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 overflow-hidden">
      <title>V-Rent</title>

      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div
          className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 blur-3xl transition-all duration-1000"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />

        {/* Reduced animated geometric shapes */}
        <div
          className="absolute top-20 left-10 w-24 h-24 border border-yellow-400/15 rounded-full animate-spin"
          style={{ animationDuration: "25s" }}
          data-parallax="0.3"
        />
        <div
          className="absolute bottom-32 right-16 w-20 h-20 border border-amber-500/15 rounded-lg rotate-45 animate-pulse"
          data-parallax="0.2"
        />
        <div
          className="absolute top-1/3 right-1/4 w-12 h-12 bg-gradient-to-r from-yellow-400/8 to-amber-500/8 rounded-full animate-bounce"
          style={{ animationDelay: "1s" }}
          data-parallax="0.4"
        />
      </div>

      {/* Reduced Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full opacity-50 animate-pulse`}
            style={{
              left: `${15 + i * 10}%`,
              top: `${25 + i * 8}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + i * 0.3}s`,
            }}
            data-parallax="0.1"
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        {/* Hero Image Carousel */}
        <div className="relative w-full max-w-4xl mb-8">
          <div className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
            {heroImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentHeroImage ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={image}
                  alt={`Hero car ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            ))}
            {/* Carousel indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentHeroImage
                      ? "bg-yellow-400 w-6"
                      : "bg-white/50"
                  }`}
                  onClick={() => setCurrentHeroImage(index)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Logo with Animation */}
        <div
          className={`transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-center mb-6 sm:mb-8">
            <span className="text-white">V</span>
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent animate-pulse">
              -
            </span>
            <span className="text-white">Rent</span>
          </h1>

          {/* Enhanced Subtitle with typing effect */}
          <div className="text-lg sm:text-xl md:text-2xl text-slate-300 text-center mb-8 sm:mb-12 md:mb-16 font-light tracking-wide px-4">
            <p className="mb-2">เช่ารถยนต์คุณภาพสูง</p>
            <p className="text-yellow-400/80 animate-pulse">
              พร้อมบริการครบครัน • ปลอดภัย • สะดวก • รวดเร็ว
            </p>
          </div>
        </div>

        {/* Statistics Section */}
        <div
          id="stats-section"
          ref={(el) => (sectionRefs.current["stats-section"] = el)}
          className={`grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-4xl w-full px-4 transition-all duration-1000 delay-200 ${
            visibleSections.has("stats-section") || isLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:border-yellow-400/30"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {stat.number}
                  {stat.suffix}
                </div>
                <div className="text-slate-300 text-xs sm:text-sm">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges Section */}
        <div
          id="trust-badges"
          ref={(el) => (sectionRefs.current["trust-badges"] = el)}
          className={`w-full max-w-4xl px-4 mb-8 sm:mb-12 transition-all duration-1000 delay-300 ${
            visibleSections.has("trust-badges") || isLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-semibold text-center mb-6">
              ความน่าเชื่อถือที่ได้รับการรับรอง
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {trustBadges.map((badge, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center p-4 rounded-xl bg-white/10 hover:bg-white/15 transition-all duration-300 hover:scale-105"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="text-2xl mb-2">{badge.icon}</div>
                  <span className="text-slate-300 text-xs text-center">
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div
          id="how-it-works"
          ref={(el) => (sectionRefs.current["how-it-works"] = el)}
          className={`w-full max-w-6xl px-4 mb-8 sm:mb-12 md:mb-16 transition-all duration-1000 delay-400 ${
            visibleSections.has("how-it-works") || isLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              วิธีการเช่ารถง่ายๆ เพียง 4 ขั้นตอน
            </h2>
            <p className="text-slate-300">
              กระบวนการที่เรียบง่าย รวดเร็ว และปลอดภัย
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSteps.map((step, index) => (
              <div
                key={index}
                className="relative group"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Step connector line */}
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-yellow-400/50 to-transparent z-0" />
                )}
                <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-yellow-400/30 group-hover:shadow-xl">
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full text-black font-bold text-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {step.step}
                    </div>
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                    <h3 className="text-white font-semibold mb-2 group-hover:text-yellow-400 transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-slate-300 text-sm">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Cars Showcase */}
        <div
          id="popular-cars"
          ref={(el) => (sectionRefs.current["popular-cars"] = el)}
          className={`w-full max-w-6xl px-4 mb-8 sm:mb-12 md:mb-16 transition-all duration-1000 delay-500 ${
            visibleSections.has("popular-cars") || isLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              รถยอดนิยม
            </h2>
            <p className="text-slate-300">รถคัดสรรคุณภาพสูง พร้อมให้บริการ</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularCars.map((car, index) => (
              <div
                key={car.id}
                className="group bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:border-yellow-400/30 hover:shadow-xl"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                    {car.type}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-1 group-hover:text-yellow-400 transition-colors duration-300">
                    {car.name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-3">
                    {car.brand} • {car.year} • {car.transmission}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-400 font-bold text-lg">
                      ฿{car.pricePerDay.toLocaleString()}/วัน
                    </span>
                    <Link
                      href={`/car/${car.id}`}
                      className="opacity-0 group-hover:opacity-100 bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105"
                    >
                      ดูรายละเอียด
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/cars"
              className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl hover:bg-white/20 hover:border-yellow-400/30 transition-all duration-300 hover:scale-105"
            >
              ดูรถทั้งหมด
              <svg
                className="ml-2 w-4 h-4"
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
            </Link>
          </div>
        </div>

        {/* Enhanced Feature Cards */}
        <div
          id="features"
          ref={(el) => (sectionRefs.current["features"] = el)}
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 md:mb-16 max-w-6xl w-full px-4 transition-all duration-1000 delay-600 ${
            visibleSections.has("features") || isLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          {[
            {
              icon: (
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                </svg>
              ),
              title: "รถคุณภาพ",
              desc: "ตรวจสภาพทุกคัน",
              detail:
                "รถทุกคันผ่านการตรวจสอบอย่างละเอียด พร้อมใบรับรองความปลอดภัย",
            },
            {
              icon: (
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-1.09A3.5 3.5 0 0 1 8 12.5a1 1 0 0 1 2 0 1.5 1.5 0 1 0 3 0c0-.83-.67-1.5-1.5-1.5H10a1 1 0 0 1 0-2h2V7h2v1.09A3.5 3.5 0 0 1 16 11.5a3.5 3.5 0 0 1-3 3.45V17Z" />
                </svg>
              ),
              title: "ราคาโปร่งใส",
              desc: "ไม่มีค่าใช้จ่ายแอบแฝง",
              detail: "ราคาที่แสดงคือราคาสุดท้าย ไม่มีค่าธรรมเนียมเพิ่มเติมใดๆ",
            },
            {
              icon: (
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
              ),
              title: "ปลอดภัย",
              desc: "ประกันครบถ้วน",
              detail:
                "ประกันภัยครอบคลุมทุกสถานการณ์ พร้อมบริการช่วยเหลือ 24 ชั่วโมง",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="group bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-xl sm:hover:shadow-2xl hover:scale-105 hover:border-yellow-400/30 hover:shadow-yellow-500/10"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-2xl group-hover:from-yellow-400/30 group-hover:to-amber-500/30 transition-all duration-300 group-hover:scale-110">
                <div className="text-yellow-400 group-hover:text-amber-300 transition-colors duration-300">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-white font-semibold text-base sm:text-lg mb-2 text-center group-hover:text-yellow-400 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm text-center mb-2">
                {feature.desc}
              </p>
              <p className="text-slate-400 text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {feature.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonials Section */}
        <div
          id="testimonials"
          ref={(el) => (sectionRefs.current["testimonials"] = el)}
          className={`w-full max-w-3xl mb-8 sm:mb-12 transition-all duration-1000 delay-700 ${
            visibleSections.has("testimonials") || isLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
            <div className="flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-yellow-400 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
              </svg>
              <h3 className="text-white font-semibold text-xl">
                เสียงตอบรับจากลูกค้า
              </h3>
            </div>
            <div className="relative h-24 flex items-center justify-center">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ${
                    index === currentTestimonial
                      ? "opacity-100 translate-x-0"
                      : index < currentTestimonial
                      ? "opacity-0 -translate-x-8"
                      : "opacity-0 translate-x-8"
                  }`}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black font-bold text-lg mr-4">
                      {testimonial.name.charAt(2)}
                    </div>
                    <div>
                      <p className="text-slate-300 text-sm sm:text-base mb-2">
                        "{testimonial.text}"
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <svg
                              key={i}
                              className="w-4 h-4 text-yellow-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-yellow-400/80 text-sm font-medium">
                          {testimonial.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? "bg-yellow-400 scale-125"
                      : "bg-white/30 hover:bg-white/50"
                  }`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div
          id="faq"
          ref={(el) => (sectionRefs.current["faq"] = el)}
          className={`w-full max-w-4xl px-4 mb-8 sm:mb-12 transition-all duration-1000 delay-800 ${
            visibleSections.has("faq") || isLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              คำถามที่พบบ่อย
            </h2>
            <p className="text-slate-300">
              คำตอบสำหรับคำถามที่ลูกค้าสอบถามบ่อย
            </p>
          </div>
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-300"
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                >
                  <h3 className="text-white font-semibold text-sm sm:text-base">
                    {faq.question}
                  </h3>
                  <svg
                    className={`w-5 h-5 text-yellow-400 transition-transform duration-300 ${
                      openFAQ === index ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFAQ === index
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Insurance Section */}
        <div
          id="security"
          ref={(el) => (sectionRefs.current["security"] = el)}
          className={`w-full max-w-4xl px-4 mb-8 sm:mb-12 transition-all duration-1000 delay-900 ${
            visibleSections.has("security") || isLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              ความปลอดภัยและการประกันภัย
            </h2>
            <p className="text-slate-300">
              มาตรฐานความปลอดภัยสูงสุดสำหรับลูกค้าทุกท่าน
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-yellow-400/30"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2 group-hover:text-yellow-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div
          id="cta"
          ref={(el) => (sectionRefs.current["cta"] = el)}
          className={`relative w-full max-w-4xl px-4 mb-8 sm:mb-12 transition-all duration-1000 delay-1000 ${
            visibleSections.has("cta") || isLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="relative bg-gradient-to-r from-yellow-400/10 to-amber-500/10 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-yellow-400/30 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-amber-500/5 rounded-3xl" />
            <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 rounded-full blur-xl" />
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-r from-amber-500/10 to-yellow-400/10 rounded-full blur-lg" />

            <div className="relative text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                เริ่มต้นการเดินทางของคุณวันนี้
              </h2>
              <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                เช่ารถคุณภาพสูง พร้อมบริการครบครัน ปลอดภัย และเชื่อถือได้
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/mainpage"
                  className="group relative px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-base sm:text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25 hover:from-amber-500 hover:to-yellow-400 w-full sm:w-auto text-center animate-pulse"
                  style={{ animationDuration: "2s" }}
                >
                  <span className="relative z-10">เริ่มต้นเช่ารถ</span>
                </Link>
                <Link
                  href="/cars"
                  className="group relative px-8 sm:px-12 py-4 sm:py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-base sm:text-lg font-semibold rounded-2xl transition-all duration-300 hover:scale-105 hover:bg-white/20 hover:border-yellow-400/30 w-full sm:w-auto text-center"
                >
                  <span className="relative z-10">ดูรถทั้งหมด</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        id="footer"
        ref={(el) => (sectionRefs.current["footer"] = el)}
        className="relative w-full bg-black/50 backdrop-blur-md border-t border-white/10 mt-16"
      >
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* About */}
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">V-Rent</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                บริการเช่ายานพาหนะคุณภาพสูง ปลอดภัย สะดวก รวดเร็ว
              </p>
              <div className="flex space-x-3">
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-black transition-all duration-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-black transition-all duration-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-black transition-all duration-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">ลิงก์ด่วน</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/cars"
                    className="text-slate-300 text-sm hover:text-yellow-400 transition-colors duration-300"
                  >
                    รถทั้งหมด
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mainpage"
                    className="text-slate-300 text-sm hover:text-yellow-400 transition-colors duration-300"
                  >
                    หน้าแรก
                  </Link>
                </li>
                <li>
                  <Link
                    href="/Login"
                    className="text-slate-300 text-sm hover:text-yellow-400 transition-colors duration-300"
                  >
                    เข้าสู่ระบบ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/Signup"
                    className="text-slate-300 text-sm hover:text-yellow-400 transition-colors duration-300"
                  >
                    สมัครสมาชิก
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">ติดต่อเรา</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span>123 ถนนตัวอย่าง เขตตัวเมือง กรุงเทพฯ 10110</span>
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  <span>02-123-4567</span>
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <span>info@vrent.com</span>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">เวลาทำการ</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div>จันทร์ - ศุกร์: 08:00 - 20:00</div>
                <div>เสาร์ - อาทิตย์: 09:00 - 18:00</div>
                <div className="text-yellow-400 font-medium">
                  บริการช่วยเหลือ 24 ชั่วโมง
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} V-Rent. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Enhanced Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
