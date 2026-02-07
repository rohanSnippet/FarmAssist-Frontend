import React from "react";
import { MapPin, Navigation, X } from "lucide-react";

const LocationModal = ({ isOpen, onClose, location, onDetect, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-base-100 w-full max-w-md rounded-xl shadow-2xl border border-base-200 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-base-200 transition-colors"
        >
          <X size={20} className="text-base-content/60" />
        </button>

        {/* Header */}
        <div className="p-8 pb-0 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your Location</h2>
          <p className="text-base-content/60 text-sm">
            We use this to provide accurate weather forecasts and crop recommendations for your farm.
          </p>
        </div>

        {/* Current Status */}
        <div className="p-8 space-y-4">
          <div className="bg-base-200/50 p-4 rounded-lg border border-base-200 text-center">
            <p className="text-xs uppercase tracking-wider text-base-content/40 font-bold mb-1">
              Current Setting
            </p>
            <p className="text-lg font-semibold text-primary">
              {location?.label || "Not Set"}
            </p>
            {location?.lat && (
              <p className="text-xs font-mono text-base-content/40 mt-1">
                {location?.lat?.toFixed(4)}, {location?.lng?.toFixed(4)}
              </p>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={onDetect}
            disabled={loading}
            className="btn btn-primary w-full h-12 text-base font-medium shadow-lg shadow-primary/20 gap-3"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Navigation size={18} className={loading ? "" : "fill-current"} />
            )}
            {loading ? "Detecting Satellite Signal..." : "Detect My Location"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;