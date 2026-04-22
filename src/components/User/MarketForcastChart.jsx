import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot 
} from 'recharts';
import { TrendingUp, Database, Activity } from 'lucide-react';
import { useTranslation } from "react-i18next";
import axios from '../../axios'; // Ensure this points to your configured instance

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Determine if we are hovering over forecast or historical
    const isForecast = payload[0].dataKey === 'forecastPrice' || (payload[1] && payload[1].dataKey === 'forecastPrice');
    const value = payload[0].value || (payload[1] && payload[1].value);
    
    return (
      <div className="bg-base-100/90 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-base-300">
        <p className="font-bold text-base-content mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isForecast ? 'bg-secondary' : 'bg-primary'}`}></div>
          <p className="text-sm font-medium text-base-content/80">
            {isForecast ? 'AI Forecast' : 'Market Price'}: 
            <span className="ml-2 font-bold text-lg text-base-content">₹{value}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function MarketForecastChart() {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('');

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await axios.get('/market-forecast/?commodity=Mango&market=Kamthi APMC&state=Maharashtra');
        setChartData(response.data.data);
        setDataSource(response.data.source);
      } catch (err) {
        console.error("Failed to load market data", err);
        // Fallback dummy data so UI doesn't break if API limit is reached during dev
        setChartData([
            { displayDate: "Apr 15", historicalPrice: 2500, forecastPrice: null },
            { displayDate: "Apr 16", historicalPrice: 2650, forecastPrice: null },
            { displayDate: "Apr 17", historicalPrice: 2700, forecastPrice: null },
            { displayDate: "Apr 18", historicalPrice: 2600, forecastPrice: null },
            { displayDate: "Apr 19", historicalPrice: 2800, forecastPrice: null },
            { displayDate: "Apr 20", historicalPrice: 2770, forecastPrice: 2770 }, // Transition point
            { displayDate: "Apr 21", historicalPrice: null, forecastPrice: 2720 },
            { displayDate: "Apr 22", historicalPrice: null, forecastPrice: 2650 },
            { displayDate: "Apr 23", historicalPrice: null, forecastPrice: 2500 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  const transitionPoint = chartData.find(d => d.historicalPrice !== null && d.forecastPrice !== null);

  return (
    // Note: Wrapping in the 8-col grid format so it drops directly into Home.jsx
    <div className="col-span-1 lg:col-span-8 flex flex-col h-full">
      <div className="card bg-base-100 shadow-2xl border border-base-200 h-full relative overflow-hidden">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 bg-base-100/50 backdrop-blur-sm flex flex-col items-center justify-center">
             <span className="loading loading-bars loading-lg text-primary"></span>
             <p className="mt-4 text-sm font-medium text-base-content/70 animate-pulse">Running AI Price Prediction...</p>
          </div>
        )}

        <div className="card-body p-6 md:p-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h3 className="card-title text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" /> 
                {/* Fallback to English if translation key is missing */}
                {t("dashboard.market_title") !== "dashboard.market_title" ? t("dashboard.market_title") : "Live Market Intelligence"}
              </h3>
              <p className="text-sm opacity-60 mt-1">
                Kamthi APMC • Mango • Modal Price
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
               <div className="badge badge-primary badge-outline gap-1.5 p-3 font-medium">
                 {dataSource === 'redis_cache' ? <Database size={12}/> : <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
                 {dataSource === 'redis_cache' ? 'Redis Cached' : 'Live Sync'}
               </div>
               <div className="badge badge-secondary gap-1.5 p-3 font-medium text-white shadow-lg shadow-secondary/30 border-none">
                 <Activity size={14} /> AI Forecast
               </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                {/* Stunning Gradient Definitions */}
                <defs>
                  <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(var(--p))" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="oklch(var(--p))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(var(--s))" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="oklch(var(--s))" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
                <XAxis dataKey="displayDate" stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} dy={10} minTickGap={20} />
                <YAxis stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.2 }} />
                
                {/* Historical Area (Solid, Primary Theme Color) */}
                <Area 
                  type="monotone" 
                  dataKey="historicalPrice" 
                  stroke="oklch(var(--p))" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorHistorical)" 
                  activeDot={{ r: 6, fill: "oklch(var(--p))", stroke: "oklch(var(--b1))", strokeWidth: 2 }}
                  animationDuration={1500}
                />
                
                {/* Forecast Area (Dashed, Secondary Theme Color) */}
                <Area 
                  type="monotone" 
                  dataKey="forecastPrice" 
                  stroke="oklch(var(--s))" 
                  strokeWidth={4} 
                  strokeDasharray="8 6"
                  fillOpacity={1} 
                  fill="url(#colorForecast)" 
                  activeDot={{ r: 6, fill: "oklch(var(--s))", stroke: "oklch(var(--b1))", strokeWidth: 2 }}
                  animationDuration={1500}
                  animationBegin={1000} // Cascading animation effect
                />

                {/* Pulsing Transition Dot where History meets Future */}
                {transitionPoint && (
                  <ReferenceDot 
                    x={transitionPoint.displayDate} 
                    y={transitionPoint.historicalPrice} 
                    r={6} 
                    fill="oklch(var(--s))" 
                    stroke="oklch(var(--b1))" 
                    strokeWidth={3}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}