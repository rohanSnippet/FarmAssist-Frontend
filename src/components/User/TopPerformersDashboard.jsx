import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  MapPin,
  Activity,
  Sparkles,
  Search,
  AlertTriangle,
  Calendar,
  TrendingUp,
} from "lucide-react";
import axios from "../../axios";

const CHART_COLORS = ["#10b981", "#8b5cf6", "#f59e0b", "#0ea5e9", "#f43f5e"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-base-100/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-base-300 min-w-[200px] z-50">
        <p className="font-bold text-base-content mb-3 border-b border-base-200 pb-2 flex items-center gap-2">
          <Calendar size={14} /> {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => {
            if (
              entry.strokeOpacity === 0.1 ||
              entry.strokeOpacity === 0 ||
              entry.value == null
            )
              return null;

            const isForecast = entry.dataKey.includes("Forecast");
            const cropName = entry.dataKey.split("_")[0];
            return (
              <div
                key={index}
                className="flex items-center justify-between gap-6"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: entry.color, color: entry.color }}
                  ></div>
                  <span className="text-base-content/80 text-sm font-medium">
                    {cropName}{" "}
                    <span
                      className={`text-[10px] uppercase font-bold ml-1 ${isForecast ? "text-secondary" : "opacity-50"}`}
                    >
                      {isForecast ? "AI Predict" : "Recorded"}
                    </span>
                  </span>
                </div>
                <span className="text-base-content font-bold">
                  ₹{entry.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function TopPerformersDashboard() {
  const [rawData, setRawData] = useState({
    chart_data: [],
    top_crops: [],
    all_crops: [],
    transition_date: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [selectedMarket, setSelectedMarket] = useState("Pune");
  const [timeScale, setTimeScale] = useState("weekly"); // daily=30days, weekly=90days, monthly=all
  const [hoveredCrop, setHoveredCrop] = useState(null);
  const [selectedOtherCrop, setSelectedOtherCrop] = useState("");

  const markets = {
    Maharashtra: ["Kamthi APMC", "Pune", "Nashik", "Mumbai", "Nagpur"],
    Gujarat: ["Surat", "Ahmedabad"],
    Punjab: ["Amritsar", "Ludhiana"],
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `/top-market-forecast/?state=${selectedState}&market=${selectedMarket}`,
        );
        setRawData(response.data.data);
        setSelectedOtherCrop("");
      } catch (err) {
        console.error("Failed to load multi-crop data", err);
        setError(
          err.response?.data?.error ||
            "Failed to establish secure connection to market databases.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedState, selectedMarket, timeScale]);

  // Professional Viewport Scaling (Instead of destructive math)
  const displayData = useMemo(() => {
    if (!rawData.chart_data || rawData.chart_data.length === 0) return [];

    // Total dataset length (usually ~100 to 200 days + 14 days forecast)
    const totalLength = rawData.chart_data.length;

    // Determine how far back in time we want to show based on the toggle
    if (timeScale === "daily") {
      // Show last 30 days of history + forecast
      return rawData.chart_data.slice(Math.max(totalLength - 44, 0));
    } else if (timeScale === "weekly") {
      // Show last 90 days + forecast
      return rawData.chart_data.slice(Math.max(totalLength - 104, 0));
    }
    // Monthly = Show all available historical data
    return rawData.chart_data;
  }, [rawData, timeScale]);

  const activeCrop = hoveredCrop || selectedOtherCrop;

  return (
    <div className="col-span-1 lg:col-span-8 flex flex-col h-full">
      <div className="card bg-base-100 shadow-2xl border border-base-200 h-full relative overflow-hidden">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-30 bg-base-100/80 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-300">
            <span className="loading loading-bars loading-lg text-primary"></span>
            <p className="mt-4 text-sm font-medium text-base-content/80 animate-pulse">
              Synchronizing Live APMC Databases...
            </p>
          </div>
        )}

        {/* Error State Fallback */}
        {!loading && error && (
          <div className="absolute inset-0 z-20 bg-base-100 flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-error mb-4 opacity-80" />
            <h3 className="text-xl font-bold text-base-content mb-2">
              Market Data Unavailable
            </h3>
            <p className="text-base-content/60 max-w-md">{error}</p>
            <button
              onClick={() => setTimeScale("daily")}
              className="btn btn-outline btn-primary mt-6"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-6">
            <div>
              <h3 className="card-title text-xl md:text-2xl font-bold flex items-center gap-2 text-base-content">
                <TrendingUp className="w-6 h-6 text-primary" />
                Market Top Performers
              </h3>
              <p className="text-sm text-base-content/60 mt-1 flex items-center gap-1.5 font-medium">
                <Activity size={14} className="text-secondary" /> AI Price
                Projection Engine
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
              {/* Viewport Scale Selector */}
              <div className="join shadow-sm border border-base-300 rounded-lg">
                <button
                  className={`join-item btn btn-sm ${timeScale === "daily" ? "btn-primary" : "bg-base-200 text-base-content/70"}`}
                  onClick={() => setTimeScale("daily")}
                >
                  30 Days
                </button>
                <button
                  className={`join-item btn btn-sm ${timeScale === "weekly" ? "btn-primary" : "bg-base-200 text-base-content/70"}`}
                  onClick={() => setTimeScale("weekly")}
                >
                  90 Days
                </button>
                <button
                  className={`join-item btn btn-sm ${timeScale === "monthly" ? "btn-primary" : "bg-base-200 text-base-content/70"}`}
                  onClick={() => setTimeScale("monthly")}
                >
                  All History
                </button>
              </div>

              {/* Location Selectors */}
              <div className="join shadow-sm border border-base-300 rounded-lg">
                <div className="flex items-center bg-base-200 px-3 text-base-content/60 border-r border-base-300">
                  <MapPin size={16} />
                </div>
                <select
                  className="select select-sm join-item bg-base-100 text-base-content w-full lg:w-32 focus:outline-none"
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedMarket(markets[e.target.value][0]);
                  }}
                >
                  {Object.keys(markets).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <select
                  className="select select-sm join-item bg-base-100 text-base-content border-l border-base-300 w-full lg:w-40 focus:outline-none"
                  value={selectedMarket}
                  onChange={(e) => setSelectedMarket(e.target.value)}
                >
                  {markets[selectedState].map((market) => (
                    <option key={market} value={market}>
                      {market}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {!loading && !error && rawData.all_crops?.length > 0 && (
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 mb-6 px-2 justify-between bg-base-200/50 p-3 rounded-xl border border-base-200">
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-sm font-semibold text-base-content/50 my-auto mr-2">
                  Top 5:
                </span>
                {rawData.top_crops.map((crop, index) => (
                  <div
                    key={crop}
                    className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full transition-all duration-300 ${selectedOtherCrop ? "opacity-30" : "hover:bg-base-300"}`}
                    style={{
                      backgroundColor:
                        hoveredCrop === crop
                          ? `${CHART_COLORS[index]}20`
                          : "transparent",
                      border: `1px solid ${hoveredCrop === crop ? CHART_COLORS[index] : "transparent"}`,
                    }}
                    onMouseEnter={() => setHoveredCrop(crop)}
                    onMouseLeave={() => setHoveredCrop(null)}
                  >
                    <div
                      className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                      style={{
                        backgroundColor: CHART_COLORS[index],
                        color: CHART_COLORS[index],
                      }}
                    ></div>
                    <span
                      className={`text-sm font-bold ${hoveredCrop === crop ? "text-base-content" : "text-base-content/70"}`}
                    >
                      {crop}
                    </span>
                  </div>
                ))}
              </div>

              {rawData.all_crops.length > 5 && (
                <div className="relative flex items-center shadow-sm rounded-lg border border-base-300 bg-base-100 pr-2">
                  <div className="pl-3 pr-2 text-base-content/50">
                    <Search size={14} />
                  </div>
                  <select
                    className="select select-sm bg-transparent border-none focus:outline-none text-base-content/80 font-bold pl-0"
                    value={selectedOtherCrop}
                    onChange={(e) => setSelectedOtherCrop(e.target.value)}
                  >
                    <option value="">Compare other crop...</option>
                    {rawData.all_crops
                      .filter((c) => !rawData.top_crops.includes(c))
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {!loading && !error && (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={displayData}
                  margin={{ top: 20, right: 20, left: -10, bottom: 0 }}
                >
                  {/* Neon Glow SVGs */}
                  <defs>
                    {CHART_COLORS.map((color, idx) => (
                      <filter
                        id={`neon-glow-${idx}`}
                        key={idx}
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                      >
                        <feDropShadow
                          dx="0"
                          dy="2"
                          stdDeviation="4"
                          floodColor={color}
                          floodOpacity="0.6"
                        />
                      </filter>
                    ))}
                    <filter
                      id={`neon-glow-other`}
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="2"
                        stdDeviation="4"
                        floodColor="#06b6d4"
                        floodOpacity="0.6"
                      />
                    </filter>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="opacity-10"
                    vertical={false}
                  />

                  {/* MinTickGap ensures dates don't overlap when viewing Monthly (All History) */}
                  <XAxis
                    dataKey="displayDate"
                    stroke="currentColor"
                    className="text-xs font-medium opacity-60"
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-xs font-medium opacity-60"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                    dx={-10}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      stroke: "currentColor",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                      opacity: 0.2,
                    }}
                  />

                  {/* Perfect Demarcation Line */}
                  {/* {rawData.transition_date && (
                    <ReferenceLine
                      x={rawData.transition_date}
                      stroke="oklch(var(--p))"
                      strokeDasharray="4 4"
                      label={{
                        position: "insideTopLeft",
                        value: "← Today | AI Prediction →",
                        fill: "pink",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    />
                  )} */}

                  {rawData.all_crops?.map((crop) => {
                    const isTop5 = rawData.top_crops.includes(crop);
                    const top5Index = rawData.top_crops.indexOf(crop);
                    const color = isTop5
                      ? CHART_COLORS[top5Index % CHART_COLORS.length]
                      : "#06b6d4";
                    const glowFilter = isTop5
                      ? `url(#neon-glow-${top5Index % CHART_COLORS.length})`
                      : "url(#neon-glow-other)";

                    let lineOpacity = 0;
                    let strokeWidth = 3;
                    let zIndex = 1;

                    if (activeCrop) {
                      if (activeCrop === crop) {
                        lineOpacity = 1;
                        strokeWidth = 5;
                        zIndex = 10;
                      } else if (isTop5) {
                        lineOpacity = 0.1;
                        strokeWidth = 2;
                      }
                    } else {
                      if (isTop5) lineOpacity = 1;
                    }

                    if (lineOpacity === 0) return null;

                    return (
                      <React.Fragment key={crop}>
                        <Line
                          type="monotoneX" /* Smooths the jagged APMC data natively */
                          dataKey={`${crop}_History`}
                          stroke={color}
                          strokeWidth={strokeWidth}
                          strokeOpacity={lineOpacity}
                          filter={lineOpacity === 1 ? glowFilter : undefined}
                          dot={{ r: 1.5, fill: color, strokeWidth: 0 }}
                          activeDot={{
                            r: 6,
                            fill: color,
                            stroke: "oklch(var(--b1))",
                            strokeWidth: 2,
                          }}
                          animationDuration={1500}
                          connectNulls={true}
                          style={{ zIndex }}
                        />
                        <Line
                          type="monotoneX"
                          dataKey={`${crop}_Forecast`}
                          stroke={color}
                          strokeWidth={strokeWidth}
                          strokeOpacity={lineOpacity}
                          strokeDasharray="6 6"
                          filter={lineOpacity === 1 ? glowFilter : undefined}
                          dot={false}
                          activeDot={{
                            r: 6,
                            fill: color,
                            stroke: "oklch(var(--b1))",
                            strokeWidth: 2,
                          }}
                          animationDuration={1500}
                          animationBegin={1000}
                          connectNulls={true}
                          style={{ zIndex }}
                        />
                      </React.Fragment>
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
