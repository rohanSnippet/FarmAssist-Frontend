import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager, Polyline, Polygon, Marker } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Edit3, Play, Square, Check, X, MapPin, Info, MousePointer2, Search, LocateFixed, Maximize, Minimize } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useGeoLocation from '../hooks/useGeoLocation';

const libraries = ['drawing', 'places'];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = { lat: 19.0760, lng: 72.8777 }; // Mumbai fallback

const panelAnim = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.2 } }
};

// Math helper to calculate distance between two GPS points in meters
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export default function FarmBoundaryMapper({ onSaveFarm, onCancel }) {
  const { t } = useTranslation();
  const { coordinates, loaded } = useGeoLocation();
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const autocompleteInstanceRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mode, setMode] = useState('select'); 
  const [isTooFarToWalk, setIsTooFarToWalk] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // GPS Walk States
  const [walkState, setWalkState] = useState('idle'); 
  const [walkPoints, setWalkPoints] = useState([]);
  const watchIdRef = useRef(null);

  // Manual Draw States
  const [manualState, setManualState] = useState('idle'); 
  const [drawingMode, setDrawingMode] = useState(null);
  const [manualGeoJsonData, setManualGeoJsonData] = useState(null);
  const [manualDisplayPath, setManualDisplayPath] = useState([]); 

  // --- FULLSCREEN LOGIC ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeFullscreen = !!document.fullscreenElement;
      setIsFullscreen(activeFullscreen);

      // DOM WORKAROUND: Relocate Google's overlay inside the fullscreen container
      const pacContainer = document.querySelector('.pac-container');
      if (pacContainer) {
        if (activeFullscreen) {
          containerRef.current?.appendChild(pacContainer);
        } else {
          document.body.appendChild(pacContainer);
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // --- AUTO-CENTERING ON LOAD ---
  useEffect(() => {
    const isValidLat = typeof coordinates.lat === 'number' && isFinite(coordinates.lat);
    const isValidLng = typeof coordinates.lng === 'number' && isFinite(coordinates.lng);

    if (mapInstance && loaded && isValidLat && isValidLng) {
      mapInstance.panTo({ lat: coordinates.lat, lng: coordinates.lng });
      mapInstance.setZoom(19); 
    }
  }, [mapInstance, loaded, coordinates.lat, coordinates.lng]);

  // --- DISTANCE CHECKER ---
  const handleMapIdle = () => {
    const isValidLat = typeof coordinates.lat === 'number' && isFinite(coordinates.lat);
    if (mapInstance && isValidLat) {
      const center = mapInstance.getCenter();
      if (center) {
        const distance = getDistance(coordinates.lat, coordinates.lng, center.lat(), center.lng());
        setIsTooFarToWalk(distance > 1500);
      }
    }
  };

  // --- DIRECT AUTOCOMPLETE WORKAROUND INITIALIZATION ---
  useEffect(() => {
    if (isLoaded && mapInstance && inputRef.current && mode === 'select') {
      // Recreating the direct JS instantiation method shown in the video reference
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          mapInstance.panTo(place.geometry.location);
          mapInstance.setZoom(17);
        }
      });

      autocompleteInstanceRef.current = autocomplete;
    }
  }, [isLoaded, mapInstance, mode]);

  // Append dropdown to local element if user opens input during active fullscreen tracking
  const handleInputFocus = () => {
    setTimeout(() => {
      const pacContainer = document.querySelector('.pac-container');
      if (pacContainer && document.fullscreenElement) {
        containerRef.current?.appendChild(pacContainer);
      }
    }, 150);
  };

  const centerOnDevice = () => {
    const isValidLat = typeof coordinates.lat === 'number' && isFinite(coordinates.lat);
    if (mapInstance && isValidLat) {
      mapInstance.panTo({ lat: coordinates.lat, lng: coordinates.lng });
      mapInstance.setZoom(19);
    }
  };

  // --- GPS TRACKING LOGIC ---
  const startWalking = () => {
    setWalkState('tracking');
    setWalkPoints([]);
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          if (accuracy < 25) {
            setWalkPoints(prev => [...prev, { lat: latitude, lng: longitude }]);
          }
        },
        (err) => console.warn("GPS Tracking Error:", err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    } else {
      alert(t('mapper.gps_error', 'GPS is not supported.'));
    }
  };

  const stopWalking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (walkPoints.length < 3) {
      alert(t('mapper.not_enough_points', 'Not enough area covered. Please walk further.'));
      setWalkState('idle');
      setWalkPoints([]);
      return;
    }
    setWalkState('review');
  };

  const confirmWalkSave = () => {
    const formattedCoords = walkPoints.map(p => [p.lng, p.lat]);
    if (formattedCoords.length > 0) formattedCoords.push([...formattedCoords[0]]);
    onSaveFarm({ type: "Polygon", coordinates: [formattedCoords] });
  };

  // --- MANUAL DRAW LOGIC ---
  const startManualDraw = () => {
    setManualState('drawing');
    setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
  };

  const stopManualDraw = () => {
    setManualState('idle');
    setDrawingMode(null); 
  };

  const onPolygonComplete = useCallback((polygon) => {
    setDrawingMode(null);
    setManualState('review');

    const path = polygon.getPath();
    const postGisCoords = []; 
    const displayCoords = []; 

    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      postGisCoords.push([point.lng(), point.lat()]); 
      displayCoords.push({ lat: point.lat(), lng: point.lng() });
    }

    if (postGisCoords.length > 0) postGisCoords.push([...postGisCoords[0]]);

    setManualGeoJsonData(postGisCoords);
    setManualDisplayPath(displayCoords);
    polygon.setMap(null); 
  }, []);

  const confirmManualSave = () => {
    if (manualGeoJsonData) onSaveFarm({ type: "Polygon", coordinates: [manualGeoJsonData] });
  };

  const retakeManualDraw = () => {
    setManualGeoJsonData(null);
    setManualDisplayPath([]);
    setManualState('idle');
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center bg-base-300 rounded-md">
        <span className="loading loading-ring loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full ${isFullscreen ? 'h-screen rounded-none' : 'h-[75vh] min-h-[550px] rounded-md'} bg-base-300 overflow-hidden shadow-2xl border border-base-content/10 transition-all`}
    >
      {/* Dynamic Embedded CSS to style the custom search results popup according to DaisyUI */}
      <style>{`
        .pac-container {
          background-color: #ffffff !important;
          color: #1f2937 !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 4px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
          font-family: inherit !important;
          z-index: 999999 !important;
        }
        .pac-item {
          padding: 8px 12px !important;
          border-top: 1px solid #f3f4f6 !important;
          cursor: pointer !important;
        }
        .pac-item:hover {
          background-color: #f3f4f6 !important;
        }
        .pac-item-query {
          color: #111827 !important;
        }
      `}</style>

      {/* TOP LEFT LAYER: CONTROLS & SEARCH */}
      <div className="absolute top-4 left-4 z-[10] w-72 sm:w-80 flex flex-col gap-2 pointer-events-none">
        {/* Title Block */}
        <div className="bg-base-100 border border-base-200 px-3 py-2.5 rounded-md shadow-lg pointer-events-auto flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          <h3 className="font-bold text-xs tracking-wide uppercase text-base-content">{t('mapper.title', 'Map Your Land')}</h3>
        </div>

        {/* Unified Search Block */}
        {mode === 'select' && (
          <motion.div 
            initial={{ opacity: 0, x: -15 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -15 }}
            className="pointer-events-auto flex gap-1.5"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                <Search size={15} />
              </div>
              <input 
                ref={inputRef}
                type="text" 
                onFocus={handleInputFocus}
                placeholder={t('mapper.search', 'Search village or city...')} 
                className="input input-sm h-10 w-full pl-9 bg-base-100 border border-base-200 shadow-md rounded-md focus:border-primary focus:outline-none text-xs text-base-content transition-all"
              />
            </div>
            <button 
              onClick={centerOnDevice} 
              className="btn btn-square h-10 min-h-0 bg-base-100 border border-base-200 shadow-md text-primary hover:bg-primary hover:text-primary-content rounded-md" 
              title={t('mapper.my_location', 'Find My Location')}
            >
              <LocateFixed size={16} />
            </button>
          </motion.div>
        )}
      </div>

      {/* TOP RIGHT LAYER: WINDOW CONTROLS */}
      <div className="absolute top-4 right-4 z-[10] flex items-center gap-1.5 pointer-events-auto">
        <button 
          onClick={toggleFullscreen} 
          className="btn btn-square btn-sm h-9 w-9 bg-base-100 border border-base-200 shadow-md hover:bg-base-200 hover:text-primary rounded-md transition-all"
          title={isFullscreen ? t('common.exit_fullscreen', 'Exit Fullscreen') : t('common.fullscreen', 'Fullscreen')}
        >
          {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
        </button>
        <button 
          onClick={onCancel} 
          className="btn btn-square btn-sm h-9 w-9 bg-base-100 border border-base-200 shadow-md hover:bg-error hover:text-error-content hover:border-error rounded-md transition-all"
          title={t('common.close', 'Close')}
        >
          <X size={15} />
        </button>
      </div>

      {/* GOOGLE MAPS INSTANCE */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={defaultCenter}
        onLoad={setMapInstance}
        onIdle={handleMapIdle} 
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeId: 'hybrid', 
        }}
      >
        {mode === 'walk' && walkPoints.length > 0 && (
          <>
            <Polyline path={walkPoints} options={{ strokeColor: '#10b981', strokeWeight: 4, strokeOpacity: 0.8 }} />
            <Marker position={walkPoints[0]} label="A" />
            {walkPoints.length > 1 && <Marker position={walkPoints[walkPoints.length - 1]} label="B" />}
            {walkState === 'review' && <Polygon paths={walkPoints} options={{ fillColor: '#10b981', fillOpacity: 0.3, strokeColor: '#10b981', strokeWeight: 2 }} />}
          </>
        )}

        {mode === 'manual' && (
          <>
            <DrawingManager
              drawingMode={drawingMode}
              onPolygonComplete={onPolygonComplete}
              options={{
                drawingControl: false,
                polygonOptions: { fillColor: '#3b82f6', fillOpacity: 0.3, strokeWeight: 3, strokeColor: '#3b82f6', clickable: false, zIndex: 1 },
              }}
            />
            {manualState === 'review' && manualDisplayPath.length > 0 && (
               <Polygon paths={manualDisplayPath} options={{ fillColor: '#3b82f6', fillOpacity: 0.3, strokeColor: '#3b82f6', strokeWeight: 3 }} />
            )}
          </>
        )}
      </GoogleMap>

      {/* BOTTOM LEFT LAYER: INSTRUCTIONS PANEL */}
      <div className="absolute bottom-4 left-4 z-[10] w-[calc(100%-2rem)] max-w-sm pointer-events-none">
        <AnimatePresence mode="wait">
          
          {mode === 'select' && (
            <motion.div key="select" variants={panelAnim} initial="hidden" animate="visible" exit="exit" className="bg-base-100 border border-base-200 shadow-xl p-4 rounded-md flex flex-col gap-3 pointer-events-auto">
              <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                {t('mapper.choose_method', 'Select Boundary Mapping Setup')}
              </p>
              
              <div className="relative">
                <button 
                  onClick={() => setMode('walk')} 
                  disabled={isTooFarToWalk || !loaded}
                  className={`btn btn-sm h-11 w-full shadow-sm gap-2 rounded-md font-medium transition-all ${isTooFarToWalk ? 'btn-disabled bg-base-200 text-base-content/30 border-base-300' : 'btn-primary text-primary-content'}`}
                >
                  <Navigation size={16} /> {t('mapper.btn_walk', 'Walk Perimeter (GPS)')}
                </button>
                {isTooFarToWalk && (
                  <p className="text-[10px] text-error text-left mt-1 font-bold uppercase tracking-wider">
                    {t('mapper.too_far', 'Too far to walk. Please use manual draw.')}
                  </p>
                )}
              </div>

              <button onClick={() => setMode('manual')} className="btn btn-outline btn-sm h-11 border-base-content/20 bg-base-100 w-full gap-2 rounded-md font-medium hover:bg-base-200 text-base-content">
                <Edit3 size={16} /> {t('mapper.btn_draw', 'Draw Manually on Map')}
              </button>
            </motion.div>
          )}

          {mode === 'manual' && manualState === 'idle' && (
            <motion.div key="manual-idle" variants={panelAnim} initial="hidden" animate="visible" exit="exit" className="bg-base-100 border-l-4 border-l-info border-y-base-200 border-r-base-200 shadow-xl p-4 rounded-md flex flex-col gap-3 pointer-events-auto">
              <div className="flex gap-2.5 items-start">
                <div className="text-info mt-0.5"><Info size={18} /></div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-base-content">{t('mapper.manual_step1_title', 'Find Your Land')}</h4>
                  <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
                    {t('mapper.manual_step1_desc', 'Drag and zoom the map to locate your farm. When ready, click Start Drawing.')}
                  </p>
                </div>
              </div>
              <button onClick={startManualDraw} className="btn btn-info btn-sm h-10 text-info-content w-full shadow-md rounded-md gap-2">
                <MousePointer2 size={16} /> {t('mapper.start_drawing', 'Start Drawing')}
              </button>
              <button onClick={() => setMode('select')} className="btn btn-ghost btn-xs text-base-content/60 font-bold uppercase tracking-wider">{t('common.back', 'Go Back')}</button>
            </motion.div>
          )}

          {mode === 'manual' && manualState === 'drawing' && (
            <motion.div key="manual-drawing" variants={panelAnim} initial="hidden" animate="visible" exit="exit" className="bg-base-100 border-l-4 border-l-info border-y-base-200 border-r-base-200 shadow-xl p-4 rounded-md flex flex-col gap-3 pointer-events-auto">
              <div className="flex gap-2.5 items-start">
                <span className="relative flex h-3 w-3 shrink-0 mt-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-info opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-info"></span>
                </span>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-base-content">{t('mapper.manual_step2_title', 'Tap to Drop Corners')}</h4>
                  <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
                    {t('mapper.manual_step2_desc', 'Tap the map at each corner of your farm. To finish, tap on your very first point to close the shape.')}
                  </p>
                </div>
              </div>
              <button onClick={stopManualDraw} className="btn btn-outline btn-sm h-10 border-base-content/20 text-base-content hover:bg-base-200 w-full rounded-md">
                {t('mapper.cancel_drawing', 'Cancel Drawing')}
              </button>
            </motion.div>
          )}

          {mode === 'manual' && manualState === 'review' && (
            <motion.div key="manual-review" variants={panelAnim} initial="hidden" animate="visible" exit="exit" className="bg-base-100 border-l-4 border-l-success border-y-base-200 border-r-base-200 shadow-xl p-4 rounded-md flex flex-col gap-3 pointer-events-auto">
              <div className="flex gap-2.5 items-start">
                <div className="text-success mt-0.5"><Check size={18} /></div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-success">{t('mapper.manual_success', 'Shape Completed')}</h4>
                  <p className="text-xs text-base-content/70 mt-1 leading-relaxed">{t('mapper.walk_review', 'Review the blue boundary on the map. Does it look accurate?')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={retakeManualDraw} className="btn btn-outline btn-sm h-10 border-base-content/20 flex-1 rounded-md text-base-content hover:bg-base-200">{t('common.retry', 'Retake')}</button>
                <button onClick={confirmManualSave} className="btn btn-success btn-sm h-10 text-success-content flex-1 shadow-md rounded-md">{t('common.save', 'Save Land')}</button>
              </div>
            </motion.div>
          )}

          {mode === 'walk' && walkState === 'idle' && (
            <motion.div key="walk-idle" variants={panelAnim} initial="hidden" animate="visible" exit="exit" className="bg-base-100 border-l-4 border-l-primary border-y-base-200 border-r-base-200 shadow-xl p-4 rounded-md flex flex-col gap-3 pointer-events-auto">
              <div className="flex gap-2.5 items-start">
                <div className="text-primary mt-0.5"><Navigation size={18} /></div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-base-content">{t('mapper.walk_step1_title', 'Step 1: Get in Position')}</h4>
                  <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
                    {t('mapper.walk_step1_desc', 'Walk to any outer edge of your farm. Once you are standing exactly on the boundary, press Start.')}
                  </p>
                </div>
              </div>
              <button onClick={startWalking} className="btn btn-primary btn-sm h-10 text-primary-content w-full shadow-md rounded-md flex items-center justify-center gap-2">
                <Play size={14} fill="currentColor" /> {t('mapper.start_tracking', 'Start Tracking')}
              </button>
              <button onClick={() => setMode('select')} className="btn btn-ghost btn-xs text-base-content/60 font-bold uppercase tracking-wider">{t('common.back', 'Go Back')}</button>
            </motion.div>
          )}

          {mode === 'walk' && walkState === 'tracking' && (
            <motion.div key="walk-tracking" variants={panelAnim} initial="hidden" animate="visible" exit="exit" className="bg-base-100 border-l-4 border-l-warning border-y-base-200 border-r-base-200 shadow-xl p-4 rounded-md flex flex-col gap-3 pointer-events-auto">
              <div className="flex gap-2.5 items-start">
                <span className="relative flex h-3 w-3 shrink-0 mt-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
                </span>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-base-content">{t('mapper.walk_step2_title', 'Step 2: Walk the Edge')}</h4>
                  <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
                    {t('mapper.walk_step2_desc', 'Walk straight along your farm boundary. Return to where you started, then press Finish.')}
                  </p>
                </div>
              </div>
              <button onClick={stopWalking} className="btn btn-warning btn-sm h-10 text-warning-content w-full shadow-md rounded-md flex items-center justify-center gap-2">
                <Square size={14} fill="currentColor" /> {t('mapper.stop_tracking', 'Finish Boundary')}
              </button>
            </motion.div>
          )}

          {mode === 'walk' && walkState === 'review' && (
            <motion.div key="walk-review" variants={panelAnim} initial="hidden" animate="visible" exit="exit" className="bg-base-100 border-l-4 border-l-success border-y-base-200 border-r-base-200 shadow-xl p-4 rounded-md flex flex-col gap-3 pointer-events-auto">
              <div className="flex gap-2.5 items-start">
                <div className="text-success mt-0.5"><Check size={18} /></div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-success">{t('mapper.walk_success', 'Perimeter Mapped')}</h4>
                  <p className="text-xs text-base-content/70 mt-1 leading-relaxed">{t('mapper.walk_review', 'Review the green boundary on the map. Does it look accurate?')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setWalkState('idle'); setWalkPoints([]); }} className="btn btn-outline btn-sm h-10 border-base-content/20 flex-1 rounded-md text-base-content hover:bg-base-200">{t('common.retry', 'Retake')}</button>
                <button onClick={confirmWalkSave} className="btn btn-success btn-sm h-10 text-success-content flex-1 shadow-md rounded-md">{t('common.save', 'Save Land')}</button>
              </div>
            </motion.div>
          )}
          
        </AnimatePresence>
      </div>
    </div>
  );
}