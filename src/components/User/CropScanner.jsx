import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGeoLocation from '../../hooks/useGeoLocation'; 
import api from '../../axios';
import { saveToOutbox, getOutbox, removeFromOutbox } from '../../lib/indexedDB';

// --- MATH HELPERS (Extracted to prevent re-allocation on render) ---
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

const isPointInPolygon = (point, polygon) => {
  if (!polygon || polygon.length === 0) return false;
  const [px, py] = point;
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
};

// --- ANIMATION VARIANTS (Optimized for performance) ---
const fadeAnim = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
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
  const [isDeviceOnline, setIsDeviceOnline] = useState(navigator.onLine);
  const [outboxCount, setOutboxCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Context-Aware States
  const [locationMatch, setLocationMatch] = useState(null);
  const [selectedFallbackFarm, setSelectedFallbackFarm] = useState("");

  useEffect(() => {
    const handleOnline = () => { setIsDeviceOnline(true); triggerBackgroundSync(); };
    const handleOffline = () => setIsDeviceOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    updateOutboxCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateOutboxCount = async () => {
    const pending = await getOutbox();
    setOutboxCount(pending.length);
  };

  const triggerBackgroundSync = async () => {
    const pendingItems = await getOutbox();
    if (pendingItems.length === 0 || isSyncing) return;

    setIsSyncing(true);
    for (const item of pendingItems) {
      try {
        const scanFormData = new FormData();
        scanFormData.append('image', item.imageFile);
        const scanResponse = await api.post('/api/detections/scan/', scanFormData);

        const finalData = new FormData();
        finalData.append('image', item.imageFile);
        finalData.append('farm_id', item.farmId);
        finalData.append('pest_name', scanResponse.data.disease);
        finalData.append('severity_level', scanResponse.data.severity);

        await api.post('/api/detections/', finalData);
        await removeFromOutbox(item.id);
      } catch (err) {
        console.error("Failed syncing outbox item", err);
      }
    }
    setIsSyncing(false);
    updateOutboxCount();
  };

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
        matchResult = { type: 'NO_LOCATION' };
      }
    }
    setLocationMatch(matchResult);

    if (!navigator.onLine) {
      setTimeout(() => {
        setScanResult({
          disease: "Offline Capture Mode",
          treatment: "Scan queued locally. Analysis will run automatically upon network reconnection.",
          severity: 1,
          isOfflineMock: true
        });
        setIsScanning(false);
      }, 800);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/api/detections/scan/', formData);
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
    if (!targetFarmId) return alert("Please select a farm to link this report.");
    
    if (!isDeviceOnline || scanResult?.isOfflineMock) {
      try {
        await saveToOutbox({
          imageFile: imageFile,
          farmId: targetFarmId,
          timestamp: new Date().toISOString()
        });
        
        alert("🚨 Saved to Outbox! The app will analyze and broadcast this when you regain connection.");
        updateOutboxCount();
        resetScanner();
      } catch (err) {
        console.error("Failed storing item offline", err);
        alert("Failed to queue item locally.");
      }
      return;
    }

    try {
      const finalData = new FormData();
      finalData.append('image', imageFile);
      finalData.append('farm_id', targetFarmId);
      finalData.append('pest_name', scanResult.disease);
      finalData.append('severity_level', scanResult.severity);
      
      await api.post('/api/detections/', finalData);
      alert("Alert successfully broadcasted to regional network!");
      resetScanner();
    } catch (err) {
      console.error("Failed to broadcast", err);
      alert("Failed to broadcast alert. Please try again.");
    }
  };

  const resetScanner = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setLocationMatch(null);
  };

  return (
    <div className="relative w-full max-w-md mx-auto z-10">
      
      {/* Ambient Background Glow (Matched to Home) */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/15 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Main Glassmorphism Card */}
      <div className="bg-base-100/70 backdrop-blur-xl border border-base-content/10 shadow-xl rounded-xl overflow-hidden relative z-10">
        
        {/* Outbox Banner */}
        {outboxCount > 0 && (
          <div className="bg-warning/10 border-b border-warning/20 text-warning px-5 py-3 text-sm flex justify-between items-center backdrop-blur-md">
            <span className="font-medium flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              {outboxCount} Pending Sync{outboxCount > 1 ? 's' : ''}
            </span>
            {isDeviceOnline && (
              <button onClick={triggerBackgroundSync} disabled={isSyncing} className="text-xs font-bold hover:text-warning/70 transition-colors">
                {isSyncing ? "SYNCING..." : "SYNC NOW"}
              </button>
            )}
          </div>
        )}

        {/* Clean Header */}
        <div className="p-5 border-b border-base-content/10 bg-base-200/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-base-content tracking-tight">AI Crop Scanner</h2>
            <p className="text-xs text-base-content/60 font-medium">Capture & Broadcast Threats</p>
          </div>
          
          {/* Subtle Network Indicator */}
          <div className={`flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded-md border ${isDeviceOnline ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
            <span className={`w-2 h-2 rounded-full ${isDeviceOnline ? 'bg-success' : 'bg-error animate-pulse'}`} />
            {isDeviceOnline ? "ONLINE" : "OFFLINE"}
          </div>
        </div>

        <div className="p-6 flex flex-col items-center">
          <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageCapture} className="hidden" />

          <AnimatePresence mode="wait">
            {/* IDLE STATE: Sleek Dashed Box instead of a circle */}
            {!previewUrl && (
              <motion.button
                key="idle"
                variants={fadeAnim} initial="hidden" animate="visible" exit="exit"
                onClick={handleCameraClick}
                className="w-full aspect-[4/3] rounded-xl bg-base-200/50 border-2 border-dashed border-base-content/20 flex flex-col items-center justify-center text-base-content/60 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <div className="p-4 bg-base-100 rounded-xl shadow-sm border border-base-content/5 mb-3 group-hover:scale-105 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <span className="font-semibold tracking-wide">Initialize Camera</span>
              </motion.button>
            )}

            {/* SCANNING STATE: Sharp Image Preview */}
            {previewUrl && !scanResult && (
              <motion.div 
                key="scanning"
                variants={fadeAnim} initial="hidden" animate="visible" exit="exit"
                className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-base-content/10 shadow-inner"
              >
                <img src={previewUrl} alt="Crop scan" className="w-full h-full object-cover brightness-75" />
                <motion.div className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_2px_rgba(var(--p),0.8)]" animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 2.5, ease: "linear", repeat: Infinity }} />
                <div className="absolute inset-0 flex items-center justify-center bg-base-100/20 backdrop-blur-[2px]">
                   <span className="px-4 py-2 bg-base-100/90 text-primary font-bold text-sm rounded-lg shadow-xl border border-base-content/10">
                     {isDeviceOnline ? "Processing Vision Model..." : "Queueing Offline Storage..."}
                   </span>
                </div>
              </motion.div>
            )}

            {/* RESULT & CONTEXT STATE: Glass Cards */}
            {scanResult && (
              <motion.div key="result" variants={fadeAnim} initial="hidden" animate="visible" className="w-full mt-2">
                
                {/* AI Result Card */}
                <div className={`p-4 mb-4 rounded-xl border backdrop-blur-sm shadow-sm flex gap-3 ${scanResult.isOfflineMock ? 'bg-info/10 border-info/20 text-info-content' : scanResult.severity >= 4 ? 'bg-error/10 border-error/20 text-error-content' : 'bg-warning/10 border-warning/20 text-warning-content'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="shrink-0 h-5 w-5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <h3 className="font-bold text-base leading-tight">{scanResult.disease}</h3>
                    <p className="text-xs opacity-80 mt-1 leading-snug">{scanResult.treatment}</p>
                  </div>
                </div>

                {/* Location Context Card */}
                <div className="bg-base-200/50 backdrop-blur-md border border-base-content/10 p-4 rounded-xl mb-5">
                  {locationMatch?.type === 'MATCH' && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-success flex items-center gap-1"><span className="w-1.5 h-1.5 bg-success rounded-full"></span> Boundary Confirmed</h4>
                        <p className="text-xs text-base-content/70 mt-1">Standing inside <span className="font-semibold text-base-content">{locationMatch.farm.name}</span></p>
                      </div>
                      <button onClick={confirmAndBroadcast} className="btn btn-primary rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                        {isDeviceOnline ? "Broadcast Threat" : "Queue to Outbox"}
                      </button>
                    </div>
                  )}

                  {locationMatch?.type === 'NO_MATCH' && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-warning flex items-center gap-1"><span className="w-1.5 h-1.5 bg-warning rounded-full"></span> Manual Assignment Required</h4>
                        <p className="text-xs text-base-content/70 mt-1 mb-3">GPS indicates you are outside registered boundaries.</p>
                        <select className="select select-bordered select-sm w-full bg-base-100 rounded-lg text-sm" value={selectedFallbackFarm} onChange={(e) => setSelectedFallbackFarm(e.target.value)}>
                          <option value="" disabled>Assign to farm...</option>
                          {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={onDigitizeNew} className="btn btn-outline border-base-content/20 btn-sm rounded-lg flex-1">Draw Map</button>
                        <button onClick={confirmAndBroadcast} disabled={!selectedFallbackFarm} className="btn btn-primary btn-sm rounded-lg flex-1">
                          {isDeviceOnline ? "Broadcast" : "Queue"}
                        </button>
                      </div>
                    </div>
                  )}

                  {locationMatch?.type === 'NO_FARMS' && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-error flex items-center gap-1"><span className="w-1.5 h-1.5 bg-error rounded-full"></span> Zero Registered Land</h4>
                        <p className="text-xs text-base-content/70 mt-1">You must define your property boundaries before broadcasting spatial alerts.</p>
                      </div>
                      <button onClick={onDigitizeNew} className="btn btn-neutral rounded-xl w-full">Digitize Boundaries</button>
                    </div>
                  )}
                </div>

                <button onClick={resetScanner} className="w-full text-xs font-bold text-base-content/50 hover:text-base-content transition-colors py-2 uppercase tracking-wider">
                  Discard & Rescan
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CropScanner;