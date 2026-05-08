import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGeoLocation from '../../hooks/useGeoLocation'; // Your custom hook
import api from '../../axios';

// --- MATH HELPERS ---
// 1. Safely extract PostGIS/GeoJSON boundaries into a flat [lng, lat] array
const extractPolygon = (boundaries) => {
  if (!boundaries) return [];
  if (typeof boundaries === 'object' && boundaries.coordinates) {
    return boundaries.coordinates[0].map(c => [parseFloat(c[0]), parseFloat(c[1])]);
  }
  if (typeof boundaries === 'string' && boundaries.includes('POLYGON')) {
    const match = boundaries.match(/\(\(([^)]+)\)\)/);
    if (match && match[1]) {
      return match[1].split(',').map(point => {
        const [lng, lat] = point.trim().split(' ');
        return [parseFloat(lng), parseFloat(lat)];
      });
    }
  }
  return [];
};

// 2. Ray-Casting Algorithm: Checks if a GPS point is inside a polygon
const isPointInPolygon = (point, polygon) => {
  if (!polygon || polygon.length === 0) return false;
  const [px, py] = point; // [lng, lat]
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
};

// --- MAIN COMPONENT ---
const CropScanner = ({ farms = [], onDigitizeNew }) => {
  const { coordinates, loaded, error } = useGeoLocation();
  const fileInputRef = useRef(null);

  // States
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  // Context-Aware States
  const [locationMatch, setLocationMatch] = useState(null);
  const [selectedFallbackFarm, setSelectedFallbackFarm] = useState("");

  const handleCameraClick = () => fileInputRef.current.click();

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
      processContextAndScan(file);
    }
  };

  const processContextAndScan = async (file) => {
    setIsScanning(true);

    // 1. RUN CONTEXT-AWARE MATH INSTANTLY IN THE BACKGROUND
    let matchResult = { type: 'NO_FARMS' };
    
    if (farms.length > 0) {
      if (loaded && !error && coordinates.lat && coordinates.lng) {
        const userPoint = [coordinates.lng, coordinates.lat];
        let foundMatch = false;

        for (const farm of farms) {
          const poly = extractPolygon(farm.boundaries);
          if (isPointInPolygon(userPoint, poly)) {
            matchResult = { type: 'MATCH', farm: farm };
            foundMatch = true;
            break;
          }
        }
        if (!foundMatch) matchResult = { type: 'NO_MATCH' };
      } else {
        matchResult = { type: 'NO_LOCATION' }; // Fallback if GPS fails
      }
    }
    setLocationMatch(matchResult);

    // 2. SEND TO AI ENGINE (Simulated Delay)
    try {
      // NOTE: Replace this setTimeout with your actual api.post() call when ready
      
      const formData = new FormData();
      formData.append('image', file);

      // Hits the @action we just built in Django!
      const response = await api.post('/api/detections/scan/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setScanResult(response.data);
    } catch (err) {
      console.error("Scanning failed", err);
      alert("Failed to analyze image.");
    } finally {
      setIsScanning(false);
    }
  };

  const confirmAndBroadcast = async () => {
    const targetFarmId = locationMatch?.type === 'MATCH' ? locationMatch.farm.id : selectedFallbackFarm;
    if (!targetFarmId) return alert("Please select a farm to broadcast the alert.");
    
    try {
      // Build the final payload with the image AND the confirmed data
      const finalData = new FormData();
      finalData.append('image', imageFile);
      finalData.append('farm_id', targetFarmId);
      finalData.append('pest_name', scanResult.disease);
      finalData.append('severity_level', scanResult.severity);
      
      // If we have GPS, send it. Otherwise Django defaults to the farm's center
      if (coordinates.lng && coordinates.lat) {
        finalData.append('detection_location', JSON.stringify({
          type: "Point",
          coordinates: [coordinates.lng, coordinates.lat]
        }));
      }

      // Hits the perform_create method in Django!
      await api.post('/api/detections/', finalData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert("Alert successfully broadcasted to nearby farmers!");
      resetScanner();

    } catch (err) {
      console.error("Failed to broadcast", err);
      alert(err.response?.data?.farm_id?.[0] || "Failed to broadcast alert.");
    }
  };

  const resetScanner = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setLocationMatch(null);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-base-100 rounded-2xl shadow-2xl border border-base-300 overflow-hidden relative">
      <div className="p-4 bg-primary/10 border-b border-primary/20 text-center">
        <h2 className="text-xl font-bold flex items-center justify-center gap-2 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Crop Health Scanner
        </h2>
      </div>

      <div className="p-6 flex flex-col items-center">
        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageCapture} className="hidden" />

        <AnimatePresence mode="wait">
          {/* STATE 1: IDLE */}
          {!previewUrl && (
            <motion.button
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              onClick={handleCameraClick}
              className="w-48 h-48 rounded-full bg-primary/10 border-4 border-dashed border-primary/40 flex flex-col items-center justify-center text-primary hover:bg-primary/20 hover:scale-105 transition-all cursor-pointer group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
              <span className="font-bold">Tap to Scan</span>
            </motion.button>
          )}

          {/* STATE 2: SCANNING */}
          {previewUrl && !scanResult && (
            <motion.div 
              key="scanning"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-primary/30"
            >
              <img src={previewUrl} alt="Crop scan" className="w-full h-full object-cover grayscale-[20%]" />
              <motion.div className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_15px_3px_rgba(var(--p),0.8)]" animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 2, ease: "linear", repeat: Infinity }} />
              <div className="absolute bottom-4 left-0 right-0 text-center"><span className="badge badge-primary badge-lg font-bold shadow-lg animate-bounce">Analyzing...</span></div>
            </motion.div>
          )}

          {/* STATE 3: RESULT & CONTEXT UI */}
          {scanResult && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              
              {/* Diagnosis Header */}
              <div className={`alert ${scanResult.severity >= 4 ? 'alert-error' : 'alert-warning'} shadow-lg mb-4 rounded-xl`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div>
                  <h3 className="font-bold text-lg">{scanResult.disease}</h3>
                  <div className="text-xs opacity-80">Treatment: {scanResult.treatment}</div>
                </div>
              </div>

              {/* CONTEXT-AWARE LOCATION CARD */}
              <div className="bg-base-200 border border-base-300 p-4 rounded-xl mb-4">
                {locationMatch?.type === 'MATCH' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">📍</span>
                      <div>
                        <h4 className="font-bold text-sm text-success">Location Verified</h4>
                        <p className="text-xs text-base-content/70">You are standing in <span className="font-bold">{locationMatch.farm.name}</span>.</p>
                      </div>
                    </div>
                    <button onClick={confirmAndBroadcast} className="btn btn-primary w-full shadow-lg">Confirm & Broadcast Alert</button>
                  </div>
                )}

                {locationMatch?.type === 'NO_MATCH' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">📍</span>
                      <div>
                        <h4 className="font-bold text-sm text-warning">Outside Known Boundaries</h4>
                        <p className="text-xs text-base-content/70 mb-2">We couldn't verify which farm you are in. Please select one or digitize this land.</p>
                        <select 
                          className="select select-bordered select-sm w-full bg-base-100" 
                          value={selectedFallbackFarm} 
                          onChange={(e) => setSelectedFallbackFarm(e.target.value)}
                        >
                          <option value="" disabled>Select Farm...</option>
                          {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button onClick={onDigitizeNew} className="btn btn-outline btn-sm flex-1">Map New Land</button>
                      <button onClick={confirmAndBroadcast} disabled={!selectedFallbackFarm} className="btn btn-primary btn-sm flex-1">Broadcast</button>
                    </div>
                  </div>
                )}

                {locationMatch?.type === 'NO_FARMS' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <h4 className="font-bold text-sm text-error">No Digitized Land</h4>
                        <p className="text-xs text-base-content/70">To warn nearby farmers about this pest, you must map your land boundary first.</p>
                      </div>
                    </div>
                    <button onClick={onDigitizeNew} className="btn btn-secondary w-full shadow-lg">Digitize My Land Now</button>
                  </div>
                )}
                
                {locationMatch?.type === 'NO_LOCATION' && (
                  <div className="text-center text-sm text-base-content/70 py-2">
                    GPS Signal Lost. Please check your device location permissions.
                  </div>
                )}
              </div>

              <button onClick={resetScanner} className="btn btn-ghost btn-block text-base-content/50 hover:text-base-content">
                Discard & Scan Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CropScanner;