import Image from "next/image";
import Footer from "@/Components/FooterMinimal";

export default function PartnerIntroSpeedAuto() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white overflow-hidden">
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
      `}</style>

      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div
          className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 blur-3xl transition-all duration-1000"
          style={{
            left: "10%",
            top: "20%",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-400/20 blur-3xl transition-all duration-1000"
          style={{
            right: "10%",
            bottom: "20%",
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Top Bar */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/20 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 shadow-lg grid place-items-center font-black text-black">
              V
            </div>
            <div>
              <p className="font-semibold tracking-wide text-sm sm:text-base">
                V‑Rent
              </p>
              <p className="text-xs text-slate-400">Partner Ecosystem</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-300">
            <a
              href="#overview"
              className="hover:text-yellow-400 transition-colors duration-300"
            >
              ภาพรวมพาร์ทเนอร์
            </a>
            <a
              href="#scope"
              className="hover:text-yellow-400 transition-colors duration-300"
            >
              ขอบเขตความร่วมมือ
            </a>
            <a
              href="#benefits"
              className="hover:text-yellow-400 transition-colors duration-300"
            >
              ประโยชน์
            </a>
            <a
              href="#fleet"
              className="hover:text-yellow-400 transition-colors duration-300"
            >
              ฟลีทรถ
            </a>
            <a
              href="#sla"
              className="hover:text-yellow-400 transition-colors duration-300"
            >
              SLA & Coverage
            </a>
            <a
              href="#contact"
              className="hover:text-yellow-400 transition-colors duration-300"
            >
              ติดต่อ
            </a>
          </nav>
          <a
            href="#enable"
            className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-medium hover:from-amber-500 hover:to-yellow-400 transition-all duration-300 text-xs sm:text-sm"
          >
            เปิดใช้งานพาร์ทเนอร์
          </a>
        </div>
      </header>

      {/* Partner Hero: V‑Rent x Speed Auto */}
      <section id="overview" className="relative overflow-hidden z-10">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 py-12 sm:py-16 grid md:grid-cols-[1.2fr_0.8fr] gap-6 sm:gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              New Partner
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
              แนะนำพาร์ทเนอร์ใหม่:{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-500">
                Speed Auto
              </span>
            </h1>
            <p className="mt-4 text-slate-300 text-sm sm:text-base md:text-lg">
              Speed Auto เข้าร่วมเครือข่าย V‑Rent
              ด้วยความเชี่ยวชาญด้านการจัดหารถยนต์เช่าในราคาคุ้มค่า ครอบคลุม{" "}
              <span className="font-semibold text-yellow-400">
                ฟลีทกว่า 300 คัน
              </span>{" "}
              พร้อมระบบดูแลบำรุงรักษามาตรฐานสูง
              และทีมงานบริการที่ตอบสนองอย่างรวดเร็ว
            </p>
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-white/20 px-3 sm:px-4 py-2 bg-white/5 backdrop-blur-sm">
                <span className="text-xs text-slate-400">สถานะ</span>
                <span className="text-xs rounded-lg bg-green-500/20 text-green-300 px-2 py-1 border border-green-400/30">
                  Active
                </span>
              </div>
              <div className="text-xs sm:text-sm text-slate-400">
                เข้าร่วมเมื่อ • Sep 2025
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-6 backdrop-blur-md bg-white/10 shadow-2xl">
              <div className="flex items-center justify-between gap-4 sm:gap-6">
                <div className="flex-1 text-center">
                  <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black grid place-items-center font-black">
                    V
                  </div>
                  <p className="mt-2 text-xs text-slate-400">V‑Rent</p>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-yellow-400">
                  ×
                </div>
                <div className="flex-1 text-center">
                  <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-tr from-orange-400 to-yellow-400 text-black grid place-items-center font-black">
                    S
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Speed Auto</p>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3 text-center">
                {[
                  { k: "ฟลีทรถ", v: "300+ คัน" },
                  { k: "ประเภทรถ", v: "Sedan / SUV / Van" },
                  { k: "พื้นที่บริการ", v: "30+ จังหวัด" },
                ].map((i, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg sm:rounded-xl border border-white/20 p-2 sm:p-3 bg-white/5 backdrop-blur-sm"
                  >
                    <p className="text-xs text-slate-400">{i.k}</p>
                    <p className="text-sm sm:text-base font-semibold text-white">
                      {i.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Scope */}
      <section id="scope" className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold">ขอบเขตความร่วมมือ</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {[
            {
              t: "Regional Fleet",
              d: "เสริมฟลีทสำหรับพื้นที่ภูมิภาค ช่วยกระจายบริการไปยังจังหวัดรอง",
            },
            {
              t: "Flexible Plans",
              d: "แพ็กเกจรายวัน/รายเดือน ยืดหยุ่นเหมาะกับลูกค้ารายย่อยและองค์กรท้องถิ่น",
            },
            {
              t: "Quick Support",
              d: "ทีมงานตอบสนองรวดเร็ว พร้อมรถสำรองกรณีฉุกเฉิน",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 p-6 hover:border-white/20 transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-orange-400 to-yellow-400 mb-4 opacity-80 group-hover:opacity-100" />
              <h3 className="font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-zinc-300">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits for V‑Rent Customers */}
      <section id="benefits" className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              สิ่งที่ลูกค้า V‑Rent ได้รับ
            </h2>
            <ul className="mt-6 space-y-3 text-zinc-200">
              <li>• ตัวเลือกฟลีทเพิ่มเติมในจังหวัดรอง</li>
              <li>• ราคาคุ้มค่าและแพ็กเกจที่ยืดหยุ่น</li>
              <li>• การสนับสนุนฉุกเฉินที่ตอบสนองอย่างรวดเร็ว</li>
              <li>• การบำรุงรักษาตามมาตรฐาน</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              {["Affordable", "Regional Coverage", "Fast Support"].map(
                (b, i) => (
                  <span
                    key={i}
                    className="text-xs rounded-full border border-white/15 px-3 py-1 text-zinc-300"
                  >
                    {b}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden border border-white/10">
            <img
              src="https://picsum.photos/1200/800?random=51"
              alt="benefits"
              className="w-full h-72 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Fleet highlight */}
      <section id="fleet" className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-bold">
            รถจาก Speed Auto ที่พร้อมเชื่อมต่อ
          </h2>
          <a href="#" className="text-sm text-zinc-300 hover:text-white">
            ดูทั้งหมด
          </a>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              name: "Toyota Vios",
              tag: "Sedan • 2023",
              img: "https://picsum.photos/800/500?random=61",
            },
            {
              name: "Mitsubishi Xpander",
              tag: "MPV • 2024",
              img: "https://picsum.photos/800/500?random=62",
            },
            {
              name: "Ford Ranger",
              tag: "Pickup • 2022",
              img: "https://picsum.photos/800/500?random=63",
            },
          ].map((car, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition"
            >
              <img
                src={car.img}
                alt={car.name}
                className="h-44 w-full object-cover"
              />
              <div className="p-4">
                <p className="font-semibold">{car.name}</p>
                <p className="text-xs text-zinc-400 mt-1">{car.tag}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SLA & Coverage */}
      <section id="sla" className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold">SLA & Coverage</h2>
        <div className="mt-6 grid md:grid-cols-4 gap-6">
          {[
            { k: "เวลาเฉลี่ยส่งมอบ", v: "24–72 ชม." },
            { k: "รถทดแทน", v: "ภายใน 12 ชม." },
            { k: "Maintenance", v: "อู่และศูนย์บริการท้องถิ่น" },
            { k: "พื้นที่บริการ", v: "30+ จังหวัด" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/10 p-6">
              <p className="text-xs text-zinc-400">{s.k}</p>
              <p className="text-xl font-semibold mt-1">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Enable partner CTA */}
      <section id="enable" className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-3xl border border-white/10 p-8 bg-white/5">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <h3 className="text-xl md:text-2xl font-bold">
                เปิดใช้งาน Speed Auto บน V‑Rent ของคุณ
              </h3>
              <p className="mt-2 text-zinc-300 text-sm">
                เชื่อมต่อพาร์ทเนอร์นี้เข้ากับสาขาหรือร้านของคุณ
                ตั้งค่าโซนให้บริการ เงื่อนไขราคา และเอกสารอัตโนมัติ
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="#"
                className="px-5 py-3 rounded-xl bg-white text-zinc-900 font-semibold"
              >
                Enable Now
              </a>
              <a
                href="#contact"
                className="px-5 py-3 rounded-xl border border-white/20"
              >
                คุยกับทีม
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 p-6">
            <p className="text-xs text-zinc-400">อีเมลสำหรับพาร์ทเนอร์</p>
            <p className="font-semibold">partners@v-rent.co</p>
          </div>
          <div className="rounded-2xl border border-white/10 p-6">
            <p className="text-xs text-zinc-400">ไลน์ OA</p>
            <p className="font-semibold">@vrent-partners</p>
          </div>
          <div className="rounded-2xl border border-white/10 p-6">
            <p className="text-xs text-zinc-400">ขอเอกสาร</p>
            <p className="font-semibold">Company profile, SLA, Rate card</p>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} V‑Rent. All rights reserved.
        </p>
      </section>

      <Footer />
    </div>
  );
}
