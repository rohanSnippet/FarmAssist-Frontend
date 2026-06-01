import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  MapPin,
  Scan,
  Users,
  CloudLightning,
  Snowflake,
  Activity,
  Layers,
  Maximize,
  Minimize,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useUserLocation } from "../context/LocationContext";
import CommunityFeed from "../components/User/CommunityFeed";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { userData, user, isAuthenticated } = useAuth();
  const { curLocation } = useUserLocation();

  const firstName = userData?.first_name || user?.first_name || "Farmer";
  const locationLabel = curLocation?.label
    ? curLocation.label.split(",")[0]
    : "Location Unknown";

  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for Full-Screen Feed
  const [isFullscreen, setIsFullscreen] = useState(() => {
    const savedState = localStorage.getItem("CommunityFeedExpanded");
    return savedState === "true";
  });

  useEffect(() => {
    localStorage.setItem("CommunityFeedExpanded", isFullscreen);
  }, [isFullscreen]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const getWeatherIcon = (code) => {
    if (code === 0 || code === 1)
      return <Sun className="w-6 h-6 text-warning" />;
    if (code === 2 || code === 3)
      return <Cloud className="w-6 h-6 text-base-content/50" />;
    if ([45, 48].includes(code))
      return <Wind className="w-6 h-6 text-base-content/50" />;
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
      return <CloudRain className="w-6 h-6 text-info" />;
    if ([71, 73, 75, 77, 85, 86].includes(code))
      return <Snowflake className="w-6 h-6 text-info" />;
    if ([95, 96, 99].includes(code))
      return <CloudLightning className="w-6 h-6 text-primary" />;
    return <Sun className="w-6 h-6 text-warning" />;
  };

  // Lock background scrolling when feed is full screen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const lat = curLocation?.lat || 19.24;
        const lon = curLocation?.lng || 73.13;

        const response = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,precipitation_probability_max,weathercode&timezone=auto`,
        );

        const {
          time,
          temperature_2m_max,
          precipitation_probability_max,
          weathercode,
        } = response.data.daily;

        const formattedData = time.map((dateStr, index) => {
          const date = new Date(dateStr);
          return {
            day: date.toLocaleDateString("en-US", { weekday: "short" }),
            temp: Math.round(temperature_2m_max[index]),
            humidity: precipitation_probability_max[index],
            icon: getWeatherIcon(weathercode[index]),
            isToday: index === 0,
          };
        });
        setWeatherData(formattedData.slice(0, 7));
      } catch (error) {
        console.error("Error fetching weather:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [curLocation?.lat, curLocation?.lng]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-base-300 text-base-content font-sans pb-24">
      {/* THEME-AWARE AMBIENT LIGHTING */}
      <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vh] bg-primary/20 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[-5%] w-[40vw] h-[60vh] bg-secondary/15 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* COMMAND HEADER */}
      <header className="relative w-full pt-24 pb-8 px-4 md:px-8 xl:px-12 2xl:px-16 border-b border-base-content/10 bg-base-100/40 backdrop-blur-md z-10">
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2 uppercase tracking-widest">
              <MapPin size={16} />
              <span>{locationLabel}</span>
              <span className="text-base-content/30 px-1">•</span>
              <span className="text-base-content/70">{today}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-light tracking-tight text-base-content">
              {isAuthenticated ? (
                <>
                  Overview,{" "}
                  <span className="font-bold text-primary">{firstName}</span>
                </>
              ) : (
                <>
                  Welcome to{" "}
                  <span className="font-bold text-primary">FarmAssist</span>
                </>
              )}
            </h1>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={() => navigate("/pest-prediction")}
              className="btn btn-primary px-8 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              <Scan size={20} className="mr-2" /> Start Pest Detection
            </button>
          </motion.div>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="relative w-full px-4 md:px-8 xl:px-12 2xl:px-16 mt-8 z-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 w-full">
          {/* LEFT COLUMN: Tools & Weather */}
          <div className="col-span-1 xl:col-span-4 flex flex-col gap-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.2 }}
              className="card bg-base-100/70 backdrop-blur-xl border border-base-content/10 shadow-xl rounded-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-base-content/10 flex justify-between items-center bg-base-200/50">
                <h3 className="font-semibold text-sm tracking-wide text-base-content/80 uppercase">
                  Atmospheric Conditions
                </h3>
              </div>
              <div className="p-5">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <span className="loading loading-ring text-primary w-10"></span>
                  </div>
                ) : (
                  <div className="flex flex-row overflow-x-auto pb-2 gap-3 hide-scrollbar">
                    {weatherData.map((d, i) => (
                      <div
                        key={i}
                        className={`min-w-[85px] flex flex-col items-center justify-between p-4 rounded-xl border transition-colors ${d.isToday ? "border-primary bg-primary/10 shadow-sm" : "border-base-content/10 bg-base-100/50 hover:bg-base-200"}`}
                      >
                        <span
                          className={`text-xs font-bold mb-3 uppercase tracking-wider ${d.isToday ? "text-primary" : "text-base-content/60"}`}
                        >
                          {d.isToday ? "Now" : d.day}
                        </span>
                        {d.icon}
                        <span className="text-xl font-bold text-base-content mt-3">
                          {d.temp}°
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-info mt-2 bg-info/10 px-2 py-1 rounded-md">
                          <Droplets size={12} /> {d.humidity}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.3 }}
              className="card bg-base-100/70 backdrop-blur-xl border border-base-content/10 shadow-xl rounded-2xl p-6"
            >
              <h3 className="font-semibold text-sm tracking-wide text-base-content/80 uppercase mb-5">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                <button
                  onClick={() => navigate("/crop-recommendations")}
                  className="btn btn-outline border-base-content/10 hover:bg-base-200 hover:border-base-content/20 text-base-content h-auto py-5 justify-start px-6 rounded-xl group"
                >
                  <div className="p-2 bg-primary/10 text-primary rounded-lg mr-2 group-hover:scale-110 transition-transform">
                    <Activity size={20} />
                  </div>
                  <span className="text-base font-medium">Crop Engine</span>
                </button>
                <button
                  onClick={() =>
                    navigate(isAuthenticated ? "/my-farms" : "/login")
                  }
                  className="btn btn-outline border-base-content/10 hover:bg-base-200 hover:border-base-content/20 text-base-content h-auto py-5 justify-start px-6 rounded-xl group"
                >
                  <div className="p-2 bg-secondary/10 text-secondary rounded-lg mr-2 group-hover:scale-110 transition-transform">
                    {isAuthenticated ? (
                      <Layers size={20} />
                    ) : (
                      <Lock size={20} />
                    )}
                  </div>
                  <span className="text-base font-medium">
                    {isAuthenticated ? "My Land Data" : "Login to Manage Land"}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: The Feed */}
          <div className="col-span-1 xl:col-span-8 flex flex-col relative z-20">
            {/* Invisible Placeholder to maintain grid layout when expanded */}
            <div className="w-full h-[750px] pointer-events-none" />

            <AnimatePresence>
              {!isFullscreen && (
                <motion.div
                  layoutId="feed-container"
                  className="absolute inset-0 card bg-base-100/70 backdrop-blur-xl border border-base-content/10 shadow-xl flex flex-col overflow-hidden"
                >
                  <motion.div
                    layoutId="feed-header"
                    className="p-5 md:p-6 border-b border-base-content/10 bg-base-200/50 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0"
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        layoutId="feed-icon"
                        className="p-3 bg-primary/10 rounded-xl text-primary"
                      >
                        <Users size={24} />
                      </motion.div>
                      <div>
                        <motion.h2
                          layoutId="feed-title"
                          className="text-xl font-bold text-base-content tracking-tight"
                        >
                          Community Feed
                        </motion.h2>
                        <motion.p
                          layoutId="feed-subtitle"
                          className="text-sm text-base-content/60 mt-1 font-medium hidden sm:block"
                        >
                          Regional agricultural updates
                        </motion.p>
                      </div>
                    </div>
                    <motion.button
                      layoutId="feed-button"
                      onClick={() => setIsFullscreen(true)}
                      className="btn btn-outline border-base-content/20 rounded-xl gap-2 hover:scale-105 transition-transform"
                    >
                      <Maximize size={18} /> Explore Feed
                    </motion.button>
                  </motion.div>

                  <motion.div
                    layoutId="feed-content"
                    className="relative flex-1 bg-base-100/30 overflow-hidden"
                  >
                    <div className="absolute inset-0 p-4 md:p-6 overflow-y-auto w-full custom-scrollbar flex justify-center">
                      <div className="w-full max-w-3xl pointer-events-auto">
                        {/* Inside the Collapsed AnimatePresence */}
                        <CommunityFeed isExpanded={false} />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ================= FULLSCREEN OVERLAY ================= */}
      {/* Renders completely outside the grid to ensure 100% viewport coverage */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            layoutId="feed-container"
            className="fixed top-0 left-0 w-[100vw] h-[100dvh] z-[999999] bg-base-100/95 backdrop-blur-3xl flex flex-col m-0 p-0 shadow-2xl overflow-hidden"
          >
            <motion.div
              layoutId="feed-header"
              className="p-2 md:p-2 border-b border-base-content/10 bg-base-100/10 transition-all duration-300 backdrop-blur-md z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shrink-0 shadow-sm"
            >
              <div className="flex items-center gap-5">
                <motion.div
                  layoutId="feed-icon"
                  className="p-2 bg-primary/10 rounded-md text-primary"
                >
                  <Users size={12} />
                </motion.div>
                <div>
                  <motion.h2
                    layoutId="feed-title"
                    className="text-md md:text-lg font-bold text-base-content tracking-tight"
                  >
                    Regional Community Feed For {firstName}
                  </motion.h2>
                 {/*  <motion.p
                    layoutId="feed-subtitle"
                    className="text-base text-sm text-base-content/60 mt-1 font-medium"
                  >
                    Real-time agricultural updates, alerts, and discussions
                  </motion.p> */}
                </div>
              </div>
              <motion.button
                layoutId="feed-button"
                onClick={() => setIsFullscreen(false)}
                className="btn btn-neutral rounded-xl gap-2 hover:scale-105 transition-transform px-8"
              >
                <Minimize size={18} /> Collapse Feed
              </motion.button>
            </motion.div>

            <motion.div
              layoutId="feed-content"
              className="relative flex-1 bg-transparent overflow-hidden"
            >
              <div className="absolute inset-0 p-6 overflow-y-auto w-full custom-scrollbar flex justify-center">
                <div className="w-full max-w-7xl">
                  {/* Inside the Fullscreen AnimatePresence */}
                  <CommunityFeed isExpanded={true} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: oklch(var(--bc) / 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: oklch(var(--bc) / 0.4); }
      `,
        }}
      />
    </div>
  );
}
