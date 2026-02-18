import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Compass, MapPin } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen w-full bg-base-200 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* --- Background Abstract Elements --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-50" />
      </div>

      {/* --- Main Glass Card --- */}
      <div className="relative z-10 w-full max-w-2xl bg-base-100/60 backdrop-blur-xl border border-base-content/10 shadow-2xl rounded-3xl p-8 md:p-12 text-center overflow-hidden">
        
        {/* --- UNIQUE ANIMATION: Drone Scanning Field --- */}
        <div className="relative h-48 w-full mb-8 flex items-end justify-center perspective-1000">
          
          {/* The Crops (Static Base) */}
          <div className="flex gap-4 items-end opacity-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ height: 20 }}
                animate={{ height: [20, 25, 20] }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 bg-gradient-to-t from-success to-success/30 rounded-t-full"
                style={{ height: 30 + i * 5 }}
              />
            ))}
          </div>

          {/* The Drone (Animated) */}
          <motion.div
            animate={{
              x: [-100, 100, -100], // Patrol movement
              y: [0, -10, 0],       // Hovering effect
            }}
            transition={{
              x: { duration: 8, repeat: Infinity, ease: "linear" },
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute bottom-16 flex flex-col items-center"
          >
            {/* Drone Body */}
            <div className="relative z-10 text-base-content">
               {/* Custom SVG Drone for modern look */}
               <svg width="64" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                 <rect x="2" y="8" width="20" height="8" rx="2" />
                 <path d="M4 8l-2-4" />
                 <path d="M20 8l2-4" />
                 <path d="M12 16v3" />
                 <circle cx="12" cy="12" r="2" className="animate-pulse fill-error stroke-none opacity-80" />
               </svg>
            </div>

            {/* Scanning Beam (Cone of Light) */}
            <motion.div 
              animate={{ opacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-24 bg-gradient-to-b from-primary/30 to-transparent clip-path-triangle mt-[-2px]"
              style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
            />
          </motion.div>
        </div>

        {/* --- Text Content --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest uppercase bg-error/10 text-error rounded-full border border-error/20">
            Error 404
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-base-content">
            Field Not Found
          </h1>
          
          <p className="text-lg text-base-content/60 mb-8 max-w-md mx-auto leading-relaxed">
            Our drones have scanned every acre, but we can't seem to locate the page you're looking for. It might have been harvested or moved to a new plot.
          </p>

          {/* --- Action Buttons --- */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/" 
              className="btn btn-primary px-8 btn-lg shadow-lg shadow-primary/30 hover:scale-105 transition-transform duration-200"
            >
              <Home size={20} />
              Return to Base
            </Link>
            
            <button 
              onClick={() => window.history.back()} 
              className="btn btn-ghost hover:bg-base-content/5 gap-2"
            >
              <Compass size={20} />
              Go Back
            </button>
          </div>
        </motion.div>

        {/* --- Footer Coordinates Decor --- */}
        <div className="mt-12 pt-6 border-t border-base-content/5 flex justify-between text-xs text-base-content/30 font-mono">
          <span className="flex items-center gap-1">
            <MapPin size={10} /> 
            SECTOR: NULL
          </span>
          <span>
            ID: 404-MISSING-CROP
          </span>
        </div>

      </div>
    </div>
  );
}

export default NotFound;