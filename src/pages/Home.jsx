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
  const { t, i18n } = useTranslation();

  const { userData, user, isAuthenticated } = useAuth();
  const { curLocation, detectAndSaveLocation, loadingLoc } = useUserLocation();

  const firstName = userData?.first_name || user?.first_name || t("home.default_farmer_name", "Farmer");
  const locationLabel = curLocation?.label
    ? curLocation.label.split(",")[0]
    : t("home.location_unknown", "Location Unknown");

  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayFormatter = new Intl.DateTimeFormat(i18n.language || "en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const today = todayFormatter.format(new Date());

  // State for Full-Screen Feed
  const [isFullscreen, setIsFullscreen] = useState(() => {
    const savedState = localStorage.getItem("CommunityFeedExpanded");
    return savedState === "true";
  });

  useEffect(() => {
    localStorage.setItem("CommunityFeedExpanded", isFullscreen);
  }, [isFullscreen]);

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
            day: new Intl.DateTimeFormat(i18n.language || "en", { weekday: "short" }).format(date),
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
  }, [curLocation?.lat, curLocation?.lng, i18n.language]);

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
      <div className="absolute top-[-10%] w-[50vw] h-[50vh] bg-primary/20 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[10%] w-[40vw] h-[60vh] bg-secondary/15 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* COMMAND HEADER */}
      <header className="relative w-full pt-10 pb-5 px-4 md:pt-24 md:pb-8 md:px-8 xl:px-12 2xl:px-16 border-b border-base-content/10 bg-base-100/40 backdrop-blur-md z-10">
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="w-full md:w-auto overflow-hidden"
          >
            {/* Location & Date - Scaled down for mobile, truncated to prevent awkward wrapping */}
            <div className="flex items-center gap-1.5 md:gap-2 text-primary font-semibold text-[10px] sm:text-xs md:text-sm mb-1.5 md:mb-2 uppercase tracking-widest w-full">
              <button 
                onClick={() => detectAndSaveLocation()}
                disabled={loadingLoc}
                className="flex items-center gap-1.5 md:gap-2 hover:opacity-70 transition-opacity cursor-pointer"
                title="Click to update location"
              >
                {loadingLoc ? (
                  <span className="loading loading-spinner loading-xs shrink-0"></span>
                ) : (
                  <MapPin size={15} className="shrink-0" />
                )}
                <span className="truncate max-w-[40%] md:max-w-none text-left">
                  {locationLabel}
                </span>
              </button>
              <span className="text-base-content/30 px-0.5">•</span>
              <span className="text-base-content/70 truncate">{today}</span>
            </div>

            {/* Main Greeting - Reduced text size and tighter line spacing on mobile */}
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-light tracking-tight text-base-content leading-tight">
              {isAuthenticated ? (
                <>
                  {t("home.overview_prefix", "Overview")}, {" "}
                  <span className="font-bold text-primary">{firstName}</span>
                </>
              ) : (
                <>
                  {t("home.welcome_prefix", "Welcome to")} {" "}
                  <span className="font-bold text-primary">FarmAssist</span>
                </>
              )}
            </h1>
          </motion.div>

          {/* Primary Action - Full width on mobile, auto width on desktop */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
            className="w-full md:w-auto mt-2 md:mt-0"
          >
            <button
              onClick={() => navigate("/pest-prediction")}
              className="btn btn-primary w-full md:w-auto md:px-8 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform rounded-xl"
            >
              <Scan size={18} className="mr-2 md:w-5 md:h-5" /> {t("home.start_pest_detection", "Start Pest Detection")}
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
              className="md:card md:bg-base-100/70 md:backdrop-blur-xl md:border md:border-base-content/10 md:shadow-xl rounded-2xl md:overflow-hidden"
            >
              <div className="mb-3 md:mb-0 md:p-5 md:border-b border-base-content/10 flex justify-between items-center md:bg-base-200/50">
                <h3 className="font-semibold text-sm tracking-wide text-base-content/80 uppercase px-1 md:px-0">
                  {t("home.atmospheric_conditions", "Atmospheric Conditions")}
                </h3>
              </div>
              <div className="md:p-5">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <span className="loading loading-ring text-primary w-10"></span>
                  </div>
                ) : (
                  <div className="flex flex-row overflow-x-auto pb-4 gap-3 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                    {weatherData.map((d, i) => (
                      <div
                        key={i}
                        className={`min-w-[75px] md:min-w-[85px] flex flex-col items-center justify-between py-2 px-2 md:p-4 rounded-full md:rounded-2xl border transition-colors ${
                          d.isToday
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-base-content/10 bg-base-100/80 backdrop-blur-md shadow-sm hover:bg-base-200"
                        }`}
                      >
                        <span
                          className={`text-[10px] md:text-xs font-bold mb-1 md:mb-3 uppercase tracking-wider ${
                            d.isToday ? "text-primary" : "text-base-content/60"
                          }`}
                        >
                          {d.isToday ? t("home.now", "Now") : d.day}
                        </span>

                        <div className="scale-60 md:scale-100">{d.icon}</div>

                        <span className="text-sm md:text-xl font-bold text-base-content mt-1 md:mt-3 leading-none">
                          {d.temp}°
                        </span>

                        <div className="flex items-center gap-1 text-[9px] md:text-[11px] font-bold text-info mt-1.5 md:mt-2 bg-info/10 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full md:rounded-md">
                          <Droplets size={10} className="hidden md:block" /> {d.humidity}%
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
              className="mt-6 md:mt-0 md:card md:bg-base-100/70 md:backdrop-blur-xl md:border md:border-base-content/10 md:shadow-xl md:rounded-2xl md:p-6"
            >
              <h3 className="font-semibold text-sm tracking-wide text-base-content/80 uppercase mb-3 md:mb-5 px-1 md:px-0">
                {t("home.quick_actions", "Quick Actions")}
              </h3>

              <div className="grid grid-cols-2 xl:grid-cols-1 gap-3 md:gap-4">
                <button
                  onClick={() => navigate("/crop-recommendations")}
                  className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-2 md:gap-0 bg-base-100 md:bg-transparent py-4 px-2 md:py-5 md:px-6 rounded-2xl md:rounded-xl border border-base-content/5 md:border-base-content/10 hover:bg-base-200 transition-colors group"
                >
                  <div className="p-2.5 md:p-2 bg-primary/10 text-primary rounded-xl md:rounded-lg md:mr-2 group-hover:scale-110 transition-transform">
                    <Activity size={20} className="md:w-5 md:h-5" />
                  </div>
                  <span className="text-[11px] md:text-base font-bold md:font-medium text-center">
                    {t("home.crop_engine", "Crop Engine")}
                  </span>
                </button>

                <button
                  onClick={() =>
                    navigate(isAuthenticated ? "/my-farms" : "/login")
                  }
                  className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-2 md:gap-0 bg-base-100 md:bg-transparent py-4 px-2 md:py-5 md:px-6 rounded-2xl md:rounded-xl border border-base-content/5 md:border-base-content/10 hover:bg-base-200 transition-colors group"
                >
                  <div className="p-2.5 md:p-2 bg-secondary/10 text-secondary rounded-xl md:rounded-lg md:mr-2 group-hover:scale-110 transition-transform">
                    {isAuthenticated ? (
                      <Layers size={20} className="md:w-5 md:h-5" />
                    ) : (
                      <Lock size={20} className="md:w-5 md:h-5" />
                    )}
                  </div>
                  <span className="text-[11px] md:text-base font-bold md:font-medium text-center leading-tight">
                    {isAuthenticated ? t("home.my_land_data", "My Land Data") : t("home.login_to_manage", "Login to Manage")}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: The Feed */}
          <div className="col-span-1 xl:col-span-8 flex flex-col relative z-20">
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
