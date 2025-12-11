import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  TrendingUp,
  Leaf,
  Droplets,
  Calendar,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";

// --- Mock Data ---
const weatherData = [
  {
    day: "Mon",
    temp: 24,
    humidity: 45,
    icon: <Sun className="w-5 h-5 text-warning" />,
  },
  {
    day: "Tue",
    temp: 22,
    humidity: 50,
    icon: <Cloud className="w-5 h-5 text-neutral-content" />,
  },
  {
    day: "Wed",
    temp: 19,
    humidity: 60,
    icon: <CloudRain className="w-5 h-5 text-info" />,
  },
  {
    day: "Thu",
    temp: 21,
    humidity: 55,
    icon: <Sun className="w-5 h-5 text-warning" />,
  },
  {
    day: "Fri",
    temp: 25,
    humidity: 40,
    icon: <Sun className="w-5 h-5 text-warning" />,
  },
  {
    day: "Sat",
    temp: 23,
    humidity: 48,
    icon: <Wind className="w-5 h-5 text-neutral-content" />,
  },
  {
    day: "Sun",
    temp: 26,
    humidity: 42,
    icon: <Sun className="w-5 h-5 text-warning" />,
  },
];

const marketData = [
  { name: "W1", Wheat: 2400, Rice: 3100 },
  { name: "W2", Wheat: 2350, Rice: 3200 },
  { name: "W3", Wheat: 2500, Rice: 3150 },
  { name: "W4", Wheat: 2600, Rice: 3300 },
  { name: "W5", Wheat: 2550, Rice: 3400 },
];

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-base-100 flex flex-col font-sans">
      {/* --- HERO SECTION --- */}
      <div
        className="hero min-h-[85vh] relative"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1625246333195-58f214f76328?q=80&w=2574&auto=format&fit=crop")',
          backgroundAttachment: "fixed",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        {/* Overlays for readability */}
        <div className="hero-overlay bg-black/40 mix-blend-multiply"></div>
        <div className="hero-overlay bg-gradient-to-t from-base-100 via-base-100/20 to-transparent"></div>

        <div className="hero-content text-center text-neutral-content z-10 w-full max-w-5xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="w-full"
          >
            {/* Tagline */}
            <motion.div
              variants={fadeInUp}
              className="flex justify-center mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-base-100/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
                <Activity size={16} className="text-primary" />
                AI-Powered Precision Agriculture
              </div>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              variants={fadeInUp}
              className="mb-6 text-5xl md:text-7xl font-extrabold leading-tight text-white tracking-tight"
            >
              Data Driven. <br />
              <span className="text-primary">Yield Focused.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="mb-10 text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed"
            >
              Leverage historical weather data and real-time market trends to
              predict your next best crop.
            </motion.p>

            {/* CTA Button */}
            <motion.div variants={fadeInUp}>
              <a
                onClick={() => navigate("/crop-recommendations")}
                className="btn btn-primary btn-lg shadow-xl hover:shadow-primary/50 hover:scale-105 transition-all duration-300 border-none"
              >
                Start Analysis <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* --- DASHBOARD PREVIEW SECTION (Overlapping Hero) --- */}
      <section className="relative z-20 px-4 pb-24">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* 1. WEATHER WIDGET (Left Side) */}
            <div className="col-span-1 lg:col-span-4 flex flex-col">
              <div className="card bg-base-100 shadow-2xl border border-base-200 h-full overflow-hidden">
                <div className="card-body p-0">
                  <div className="p-6 bg-base-200/50 border-b border-base-200">
                    <h3 className="card-title text-base font-bold flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Field History (7 Days)
                    </h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {weatherData.map((d, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm p-3 rounded-lg hover:bg-base-200 transition-colors group cursor-default"
                      >
                        <span className="font-bold w-10 opacity-70 group-hover:opacity-100">
                          {d.day}
                        </span>
                        <div className="flex items-center gap-3">
                          {d.icon}
                          <span className="font-medium text-lg">{d.temp}°</span>
                        </div>
                        <span className="text-xs opacity-50 flex items-center gap-1 group-hover:text-primary transition-colors">
                          <Droplets size={14} /> {d.humidity}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. MARKET TRENDS CHART (Right Side) */}
            <div className="col-span-1 lg:col-span-8 flex flex-col">
              <div className="card bg-base-100 shadow-2xl border border-base-200 h-full">
                <div className="card-body p-6 md:p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="card-title text-xl font-bold flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-secondary" /> Market
                        Intelligence
                      </h3>
                      <p className="text-sm opacity-60 mt-1">
                        Real-time price fluctuations (INR/Quintal)
                      </p>
                    </div>
                    <div className="badge badge-outline p-3">Last 5 Weeks</div>
                  </div>

                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={marketData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorWheat"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="oklch(var(--p))"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="oklch(var(--p))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorRice"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="oklch(var(--s))"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="oklch(var(--s))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="currentColor"
                          className="opacity-10"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          stroke="currentColor"
                          className="text-xs opacity-50"
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          stroke="currentColor"
                          className="text-xs opacity-50"
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `₹${value}`}
                          dx={-10}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "oklch(var(--b1))",
                            borderColor: "oklch(var(--b3))",
                            borderRadius: "0.5rem",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="Wheat"
                          stroke="oklch(var(--p))"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorWheat)"
                        />
                        <Area
                          type="monotone"
                          dataKey="Rice"
                          stroke="oklch(var(--s))"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorRice)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="footer footer-center p-10 bg-base-200 text-base-content mt-auto">
        <aside>
          <Leaf className="w-8 h-8 text-primary mb-2 opacity-80" />
          <p className="font-bold">
            FarmAssist AI <br />
            Providing reliable tech since 2024
          </p>
          <p className="opacity-60">Copyright © 2024 - All right reserved</p>
        </aside>
      </footer>
    </div>
  );
}
