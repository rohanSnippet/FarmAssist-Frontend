import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Polygon } from "@react-google-maps/api";
import { motion } from "framer-motion";
import api from "../axios"; // <-- MISSING IMPORT ADDED

// <-- MISSING CONSTANT ADDED (Must be outside the component!)
const libraries = ["drawing"];

const mapContainerStyle = { width: "100%", height: "100%" };

// Upgraded converter that handles both GeoJSON Objects and Django WKT Strings
const convertGeoJsonToGoolePaths = (boundaries) => {
  if (!boundaries) return [];

  // Case 1: Django sent standard GeoJSON (Object)
  if (typeof boundaries === "object" && boundaries.coordinates) {
    return boundaries.coordinates[0].map((coord) => ({
      lat: parseFloat(coord[1]),
      lng: parseFloat(coord[0]),
    }));
  }

  // Case 2: Django sent a raw WKT String (e.g., "SRID=4326;POLYGON ((72.8 19.0, ...))")
  if (typeof boundaries === "string" && boundaries.includes("POLYGON")) {
    const match = boundaries.match(/\(\(([^)]+)\)\)/);
    if (match && match[1]) {
      const points = match[1].split(",");
      return points.map((point) => {
        const [lng, lat] = point.trim().split(" ");
        return { lat: parseFloat(lat), lng: parseFloat(lng) };
      });
    }
  }

  return [];
};

// --- Framer Motion Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

// --- Sub-Component: The Animated Farm Card ---
const FarmCard = ({ farm, onSelect }) => {
  // PASS THE WHOLE BOUNDARIES OBJECT INSTEAD OF .coordinates
  const paths = convertGeoJsonToGoolePaths(farm.boundaries);

  const handleMapLoad = useCallback(
    (map) => {
      if (paths.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        paths.forEach((point) => bounds.extend(point));
        map.fitBounds(bounds);
      }
    },
    [paths],
  );

  const activeSeason = farm.seasons?.find((s) => s.is_active);

  return (
    <motion.div variants={itemVariants} className="h-full">
      <div className="group card rounded-lg w-full h-full bg-base-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-base-300">
        <figure className="relative h-40 md:h-48 w-full bg-base-300 z-0 overflow-hidden">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            onLoad={handleMapLoad}
            // mapTypeId="satellite"
            center={{ lat: 19.2403, lng: 73.1305 }} // Local fallback center
            zoom={paths.length === 0 ? 12 : undefined} // Zoom if no bounds are drawn
            options={{
              mapTypeId: "satellite",
              disableDefaultUI: true,
              gestureHandling: "none",
              keyboardShortcuts: false,
            }}
          >
            <Polygon
              paths={paths}
              options={{
                fillColor: "var(--fallback-p, oklch(var(--p)))", // Primary color
                fillOpacity: 0.4,
                strokeColor: "var(--fallback-p, oklch(var(--p)))",
                strokeWeight: 2,
                clickable: false,
              }}
            />
          </GoogleMap>

          {/* Hover Action Overlay (Matches Team Section style) */}
          <div className="absolute inset-0 bg-gradient-to-t from-base-300/90 via-base-300/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-10 backdrop-blur-[2px]">
            <button
              onClick={() => onSelect(farm)}
              className="btn btn-primary shadow-lg hover:scale-105 transition-transform"
            >
              View Details
            </button>
          </div>
        </figure>

        {/* Bottom Half: Info & Badges */}
        <div className="card-body p-4 md:p-5">
          <h2 className="card-title text-lg md:text-xl truncate text-base-content">
            {farm.name}
          </h2>

          <div className="flex flex-col gap-2 mt-2">
            {activeSeason ? (
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/70 flex items-center gap-1">
                  🌱 Growing
                </span>
                <div className="badge badge-secondary badge-outline font-medium">
                  {activeSeason.crop_name}
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/50">
                  Resting Phase
                </span>
                <div className="badge badge-ghost font-medium">Fallow</div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-base-content/40 mt-auto pt-4">
            Digitized: {new Date(farm.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Dashboard Component ---
const MyFarmsDashboard = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  // Add an error state at the top of your component alongside farms, selectedFarm, and loading
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Season Form State
  const [cropName, setCropName] = useState("");
  const [harvestDate, setHarvestDate] = useState("");

  // Pest Form State
  const [pestName, setPestName] = useState("");
  const [severity, setSeverity] = useState(1);

  // 1. Define the async function inside the useEffect
  const fetchFarms = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/api/farms/");

      // 3. Save the data to state
      setFarms(response.data);

      // 4. Auto-select the first farm if the user has any saved
      if (response.data.length > 0) {
        setSelectedFarm(response.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch farms", err);
      setError(
        "Could not load your land parcels. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 5. Call the function
    fetchFarms();
  }, []);

  const handleDeleteFarm = async () => {
    if (
      !window.confirm(
        `Are you absolutely sure you want to delete ${selectedFarm.name}? This will erase all crop and pest history.`,
      )
    )
      return;

    try {
      setIsSubmitting(true);
      await api.delete(`/api/farms/${selectedFarm.id}/`);

      // Update UI: Remove from list, close modal, clear selection
      setFarms(farms.filter((f) => f.id !== selectedFarm.id));
      document.getElementById("farm_detail_modal").close();
      setSelectedFarm(null);
    } catch (err) {
      console.error("Error deleting farm:", err);
      alert("Failed to delete farm.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 2. START NEW SEASON HANDLER ---
  const handleStartSeason = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        farm: selectedFarm.id,
        crop_name: cropName,
        expected_harvest_date: harvestDate,
        is_active: true,
      };

      // Assuming you have a nested router or an endpoint for seasons
      await api.post("/api/seasons/", payload);

      alert("Crop planted successfully!");
      document.getElementById("season_modal").close();
      setCropName("");
      setHarvestDate("");

      // Refresh the farms to show the new active status
      fetchFarms();
    } catch (err) {
      console.error("Error starting season:", err);
      alert("Failed to start new season.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. LOG PEST / TRIGGER CELERY ENGINE ---
  const handleLogPest = async (e) => {
    e.preventDefault();
    const activeSeason = selectedFarm?.seasons?.find((s) => s.is_active);
    if (!activeSeason) {
      alert("You must plant a crop before you can log a pest!");
      return;
    }

    try {
      setIsSubmitting(true);

      // We grab the first coordinate of the farm polygon to act as the "Point" of detection
      const defaultLngLat = selectedFarm.boundaries.coordinates[0][0];

      const payload = {
        farm_season: activeSeason.id,
        pest_name: pestName,
        severity_level: severity,
        // PostGIS strictly requires standard GeoJSON Point format
        detection_location: {
          type: "Point",
          coordinates: defaultLngLat,
        },
      };

      // This POST request triggers your Django view, which triggers the Celery spread task!
      await api.post("/api/detections/", payload);

      alert("Pest logged! Nearby farmers are being alerted.");
      document.getElementById("pest_modal").close();
      setPestName("");
      setSeverity(1);
    } catch (err) {
      console.error("Error logging pest:", err);
      alert("Failed to log pest.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openFarmDetails = (farm) => {
    setSelectedFarm(farm);
    document.getElementById("farm_detail_modal").showModal();
  };

  if (loading || !isLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  const selectedPaths = selectedFarm
    ? convertGeoJsonToGoolePaths(selectedFarm.boundaries)
    : [];
  const activeDetailSeason = selectedFarm?.seasons?.find((s) => s.is_active);

  return (
    <div className="w-full relative overflow-hidden rounded-md p-2 md:p-6 bg-base-200">
      {/* Abstract Background Blobs (Matches About.jsx Hero) */}
      <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-60 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-72 h-72 bg-secondary/10 rounded-full blur-3xl opacity-60 animate-pulse delay-1000 pointer-events-none"></div>

      <div className="relative z-10 mb-8 mt-2 text-center md:text-left">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl md:text-4xl font-bold"
        >
          My{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Digitized Land
          </span>
        </motion.h2>
        <p className="text-base-content/70 mt-2">
          Manage your farm boundaries and monitor crop activity.
        </p>
      </div>

      {/* Grid: 2 on Mobile, 3 on Tablet, 4 on Desktop */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 relative z-10"
      >
        {farms.map((farm) => (
          <FarmCard key={farm.id} farm={farm} onSelect={openFarmDetails} />
        ))}
      </motion.div>

      {/* Detailed Farm Modal */}
      <dialog
        id="farm_detail_modal"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box w-11/12 max-w-5xl h-[85vh] p-0 flex flex-col bg-base-100 shadow-2xl overflow-hidden border border-base-300">
          {/* Modal Header */}
          <div className="px-6 py-4 bg-base-200 border-b border-base-300 flex justify-between items-center z-20">
            <h3 className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              {selectedFarm?.name}
            </h3>
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost hover:bg-error hover:text-white transition-colors">
                ✕
              </button>
            </form>
          </div>

          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            {/* Left: Interactive Map */}
            <div className="w-full lg:w-3/5 h-64 lg:h-full relative bg-base-300">
              {selectedFarm && (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  onLoad={(map) => {
                    const bounds = new window.google.maps.LatLngBounds();
                    selectedPaths.forEach((point) => bounds.extend(point));
                    map.fitBounds(bounds);
                  }}
                  options={{
                    mapTypeId: "satellite",
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                  }}
                >
                  <Polygon
                    paths={selectedPaths}
                    options={{
                      fillColor: "#22c55e",
                      fillOpacity: 0.35,
                      strokeColor: "#16a34a",
                      strokeWeight: 3,
                    }}
                  />
                </GoogleMap>
              )}
            </div>

            {/* Right: Detailed Info Panel */}
            <div className="w-full lg:w-2/5 p-6 md:p-8 overflow-y-auto bg-base-100 flex flex-col gap-8">
              {/* Current Status Section */}
              <div className="bg-base-200 p-5 rounded-xl border border-base-300">
                <h4 className="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-3">
                  Current Status
                </h4>
                {activeDetailSeason ? (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full bg-success animate-pulse"></div>
                      <span className="text-lg font-bold text-base-content">
                        {activeDetailSeason.crop_name}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/70 mt-2">
                      Planted on:{" "}
                      <span className="font-medium text-base-content">
                        {new Date(
                          activeDetailSeason.planted_date,
                        ).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-base-content/30"></div>
                    <span className="text-lg font-medium text-base-content/70">
                      Fallow Land
                    </span>
                  </div>
                )}
              </div>

              {/* Geographical Details */}
              <div>
                <h4 className="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-3">
                  Geographical Info
                </h4>
                <ul className="space-y-3 text-sm text-base-content">
                  <li className="flex justify-between items-center pb-2 border-b border-base-200">
                    <span className="opacity-70">Boundary Points</span>
                    <span className="font-mono bg-base-200 px-2 py-1 rounded">
                      {selectedPaths.length} Nodes
                    </span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-base-200">
                    <span className="opacity-70">Digitized On</span>
                    <span className="font-medium">
                      {selectedFarm
                        ? new Date(selectedFarm.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Actions Engine */}
              <div className="mt-auto pt-6 flex flex-col gap-3 border-t border-base-200">
                {activeDetailSeason ? (
                  // If land has crops, they can log pests
                  <button 
                    onClick={() => document.getElementById('pest_modal').showModal()}
                    className="btn btn-primary w-full shadow-lg"
                  >
                    Log Pest / Disease
                  </button>
                ) : (
                  // If land is fallow, they must plant a crop first
                  <button 
                    onClick={() => document.getElementById('season_modal').showModal()}
                    className="btn btn-secondary w-full shadow-lg"
                  >
                    🌱 Plant New Crop
                  </button>
                )}
                
                <button 
                  onClick={handleDeleteFarm}
                  disabled={isSubmitting}
                  className="btn btn-outline btn-error w-full"
                >
                  Delete Farm Record
                </button>
              </div>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* ========================================= */}
      {/* MODAL: START NEW CROP SEASON              */}
      {/* ========================================= */}
      <dialog id="season_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-base-100">
          <h3 className="font-bold text-lg text-secondary">Plant New Crop</h3>
          <p className="py-4 text-base-content/70">What are you growing in <span className="font-bold">{selectedFarm?.name}</span> this season?</p>
          
          <form onSubmit={handleStartSeason} className="space-y-4">
            <div>
              <label className="label"><span className="label-text">Crop Name</span></label>
              <input 
                type="text" required
                value={cropName} onChange={(e) => setCropName(e.target.value)}
                placeholder="e.g. Wheat, Sugarcane, Mango" 
                className="input input-bordered w-full bg-base-200" 
              />
            </div>
            <div>
              <label className="label"><span className="label-text">Expected Harvest Date</span></label>
              <input 
                type="date" required
                value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)}
                className="input input-bordered w-full bg-base-200" 
              />
            </div>
            
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => document.getElementById('season_modal').close()}>Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn btn-secondary">
                {isSubmitting ? <span className="loading loading-spinner"></span> : "Start Season"}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* ========================================= */}
      {/* MODAL: LOG PEST DETECTION                 */}
      {/* ========================================= */}
      <dialog id="pest_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-base-100 border-t-4 border-error">
          <h3 className="font-bold text-lg text-error flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Log Pest or Disease
          </h3>
          <p className="py-4 text-base-content/70">Warning nearby farmers about an outbreak.</p>
          
          <form onSubmit={handleLogPest} className="space-y-4">
            <div>
              <label className="label"><span className="label-text">Pest / Disease Name</span></label>
              <input 
                type="text" required
                value={pestName} onChange={(e) => setPestName(e.target.value)}
                placeholder="e.g. Fall Armyworm, Leaf Blight" 
                className="input input-bordered w-full bg-base-200" 
              />
            </div>
            
            <div>
              <label className="label">
                <span className="label-text">Severity Level (1-5)</span>
                <span className="label-text-alt text-error font-bold">{severity === '5' ? 'CRITICAL' : ''}</span>
              </label>
              <input 
                type="range" min="1" max="5" 
                value={severity} onChange={(e) => setSeverity(e.target.value)}
                className="range range-error range-sm" 
              />
              <div className="w-full flex justify-between text-xs px-2 mt-2 text-base-content/50">
                <span>1 (Mild)</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5 (Severe)</span>
              </div>
            </div>
            
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => document.getElementById('pest_modal').close()}>Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn btn-error text-white">
                {isSubmitting ? <span className="loading loading-spinner"></span> : "Broadcast Alert"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default MyFarmsDashboard;
