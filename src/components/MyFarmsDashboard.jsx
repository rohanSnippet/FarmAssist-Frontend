import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Polygon } from "@react-google-maps/api";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Map, Sprout, Leaf, MapPin, AlertCircle, X } from "lucide-react";
import api from "../axios";

// --- CONSTANTS ---
const libraries = ["drawing", "places"];
const mapContainerStyle = { width: "100%", height: "100%" };

// --- MATH HELPERS ---
const convertGeoJsonToGoolePaths = (boundaries) => {
  if (!boundaries) return [];
  if (typeof boundaries === "object" && boundaries.coordinates) {
    return boundaries.coordinates[0].map((coord) => ({
      lat: parseFloat(coord[1]),
      lng: parseFloat(coord[0]),
    }));
  }
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

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// --- SUB-COMPONENT: ACTUAL IMAGERY FARM CARD ---
const FarmCard = ({ farm, onSelect }) => {
  const { t } = useTranslation();
  const paths = convertGeoJsonToGoolePaths(farm.boundaries);
  const activeSeason = farm.seasons?.find((s) => s.is_active);

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

  return (
    <motion.div variants={itemVariants} className="w-full">
      <button
        type="button"
        onClick={() => onSelect(farm)}
        className="
          group
          w-full
          text-left
          bg-base-100
          rounded-2xl
          border
          border-base-content/10
          overflow-hidden
          shadow-sm
          active:scale-[0.985]
          transition-transform
          duration-150

          md:hover:shadow-xl
          md:hover:-translate-y-0.5
          md:rounded-3xl
        "
      >
        {/* =================================================
            SATELLITE PREVIEW
        ================================================= */}
        <div
          className="
          relative
          h-40
          sm:h-44
          md:h-48
          w-full
          bg-base-300
          overflow-hidden
        "
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            onLoad={handleMapLoad}
            center={{ lat: 19.2403, lng: 73.1305 }}
            zoom={paths.length === 0 ? 12 : undefined}
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
                fillColor: "#22c55e",
                fillOpacity: 0.3,
                strokeColor: "#16a34a",
                strokeWeight: 2,
                clickable: false,
              }}
            />
          </GoogleMap>

          {/* Map fade */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* Status */}
          <div className="absolute top-3 right-3">
            {activeSeason ? (
              <span
                className="
                px-2.5
                py-1.5
                bg-success/95
                backdrop-blur
                text-success-content
                text-[10px]
                font-black
                uppercase
                tracking-wider
                rounded-lg
                shadow-md
                flex
                items-center
                gap-1
              "
              >
                <Sprout size={12} />
                {t("MyFarms.status_active")}
              </span>
            ) : (
              <span
                className="
                px-2.5
                py-1.5
                bg-base-100/95
                backdrop-blur
                text-base-content/70
                text-[10px]
                font-black
                uppercase
                tracking-wider
                rounded-lg
                shadow-md
              "
              >
                {t("MyFarms.status_fallow")}
              </span>
            )}
          </div>

          {/* Mobile manage hint */}
          <div
            className="
            md:hidden
            absolute
            bottom-3
            left-3
            text-white
            text-[10px]
            font-bold
            uppercase
            tracking-wider
            opacity-90
          "
          >
            {t("MyFarms.tap_to_manage")}
          </div>
        </div>

        {/* =================================================
            CARD BODY
        ================================================= */}
        <div className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                className="
                font-black
                text-[17px]
                md:text-xl
                text-base-content
                leading-tight
                truncate
              "
              >
                {farm.name}
              </h2>

              <div className="mt-2">
                {activeSeason ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="
                      w-7
                      h-7
                      rounded-lg
                      bg-success/10
                      text-success
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                    >
                      <Leaf size={14} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider">
                        {t("MyFarms.growing")}
                      </p>

                      <p className="text-sm font-bold truncate">
                        {activeSeason.crop_name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className="
                      w-7
                      h-7
                      rounded-lg
                      bg-base-200
                      text-base-content/40
                      flex
                      items-center
                      justify-center
                    "
                    >
                      <MapPin size={14} />
                    </div>

                    <div>
                      <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider">
                        {t("MyFarms.status_label")}
                      </p>

                      <p className="text-sm font-semibold text-base-content/60">
                        {t("MyFarms.fallow_land")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className="
              shrink-0
              w-9
              h-9
              rounded-full
              bg-base-200
              flex
              items-center
              justify-center
              text-base-content/50
            "
            >
              <span className="text-lg">›</span>
            </div>
          </div>

          {/* Metadata */}
          <div
            className="
            mt-4
            pt-3
            border-t
            border-base-content/5
            flex
            items-center
            justify-between
          "
          >
            <span
              className="
              text-[10px]
              md:text-xs
              font-bold
              text-base-content/40
              uppercase
              tracking-wider
            "
            >
              {t("MyFarms.boundary_nodes", { count: paths.length })}
            </span>

            <span
              className="
              text-[10px]
              md:text-xs
              font-medium
              text-base-content/40
            "
            >
              {new Date(farm.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </button>
    </motion.div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
const MyFarmsDashboard = ({onAddFarm}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalMap, setModalMap] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms State
  const [cropName, setCropName] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [pestName, setPestName] = useState("");
  const [severity, setSeverity] = useState(1);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
    version: "3.64",
  });

  const fetchFarms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/farms/");
      setFarms(response.data);
    } catch (err) {
      console.error("Failed to fetch farms", err);
      setError(
        t("MyFarms.load_error"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  useEffect(() => {
    if (modalMap && selectedFarm) {
      const paths = convertGeoJsonToGoolePaths(selectedFarm.boundaries);
      if (paths.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        paths.forEach((point) => bounds.extend(point));
        modalMap.fitBounds(bounds);
      }
    }
  }, [modalMap, selectedFarm]);

  const handleDeleteFarm = async () => {
    if (
      !window.confirm(
        t("MyFarms.delete_confirm", { farmName: selectedFarm?.name || "" }),
      )
    ) {
      return;
    }
    try {
      setIsSubmitting(true);
      await api.delete(`/api/farms/${selectedFarm.id}/`);
      setFarms(farms.filter((f) => f.id !== selectedFarm.id));
      document.getElementById("farm_detail_modal").close();
      setSelectedFarm(null);
    } catch (err) {
      alert(t("MyFarms.delete_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartSeason = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post("/api/seasons/", {
        farm: selectedFarm.id,
        crop_name: cropName,
        expected_harvest_date: harvestDate,
        is_active: true,
      });
      document.getElementById("season_modal").close();
      setCropName("");
      setHarvestDate("");
      fetchFarms();
    } catch (err) {
      alert(t("MyFarms.start_season_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogPest = async (e) => {
    e.preventDefault();
    const activeSeason = selectedFarm?.seasons?.find((s) => s.is_active);
    if (!activeSeason)
      return alert(t("MyFarms.plant_crop_first"));

    try {
      setIsSubmitting(true);
      const defaultLngLat = selectedFarm.boundaries.coordinates[0][0];
      await api.post("/api/detections/", {
        farm_season: activeSeason.id,
        pest_name: pestName,
        severity_level: severity,
        detection_location: { type: "Point", coordinates: defaultLngLat },
      });
      alert(t("MyFarms.pest_logged"));
      document.getElementById("pest_modal").close();
      setPestName("");
      setSeverity(1);
    } catch (err) {
      alert(t("MyFarms.log_pest_failed"));
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
      <div className="flex justify-center items-center h-[60vh]">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  const selectedPaths = selectedFarm
    ? convertGeoJsonToGoolePaths(selectedFarm.boundaries)
    : [];
  const activeDetailSeason = selectedFarm?.seasons?.find((s) => s.is_active);

  return (
    <div className="w-full min-h-screen pb-28 md:p-8">
      <div className="w-full max-w-7xl mx-auto relative z-10">
        {/* NATIVE-FEEL HEADER */}
        <div className="px-4 py-4 md:px-8 bg-transparent sticky top-0 z-20 flex items-center justify-between">
          {/* <div>
            <h1 className="text-2xl md:text-4xl font-black text-base-content tracking-tight">
              {t("MyFarms.title", "My Farms")}
            </h1>

            <p className="text-[11px] md:text-sm text-base-content/50 mt-1">
              {t("MyFarms.farms_registered", { count: farms.length, defaultValue: `${farms.length} Farms Registered` })}
            </p>
          </div> */}
          {/* <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center md:hidden">
            <Map size={19} />
          </div> */}
        </div>

        {/* GRID VIEW */}
        <div className="px-4 md:px-8 relative z-10">
          {farms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-base-200/50 rounded-3xl border-2 border-dashed border-base-content/10">
              <div className="w-16 h-16 bg-base-100 rounded-2xl shadow-sm flex items-center justify-center mb-4 text-base-content/40">
                <Map size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">{t("MyFarms.empty_title")}</h3>
              <p className="text-sm text-base-content/60 max-w-sm">
                {t("MyFarms.empty_description")}
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            >
              {farms.map((farm) => (
                <FarmCard
                  key={farm.id}
                  farm={farm}
                  onSelect={openFarmDetails}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* MOBILE FLOATING ACTION BUTTON (FAB) */}
      <button
         onClick={onAddFarm}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-content rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.15)] flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <Plus size={28} />
      </button>

      {/* ========================================= */}
      {/* MODAL: DETAILED FARM VIEW                 */}
      {/* ========================================= */}
      <dialog
        id="farm_detail_modal"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box w-full sm:w-11/12 sm:max-w-5xl h-[90vh] sm:h-[85vh] p-0 flex flex-col bg-base-100 sm:rounded-2xl overflow-hidden">
          <div className="px-5 py-4 bg-base-100 border-b border-base-content/5 flex justify-between items-center z-20 sticky top-0">
            <h3 className="font-black text-xl text-base-content truncate pr-4">
              {selectedFarm?.name}
            </h3>
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost bg-base-200">
                <X size={18} />
              </button>
            </form>
          </div>

          <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto">
            {/* Left: Interactive Map */}
            <div className="w-full h-56 shrink-0 lg:w-3/5 lg:h-full relative bg-base-300">
              {selectedFarm && (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  onLoad={(map) => setModalMap(map)}
                  onUnmount={() => setModalMap(null)}
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

            {/* Right: Info Panel */}
            <div className="w-full lg:w-2/5 p-5 md:p-8 bg-base-100 flex flex-col gap-6">
              <div className="bg-base-200/50 p-5 rounded-2xl border border-base-content/5">
                <h4 className="text-[10px] font-bold text-base-content/50 uppercase tracking-widest mb-3">
                  {t("MyFarms.current_status")}
                </h4>
                {activeDetailSeason ? (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></div>
                      <span className="text-lg font-black text-base-content">
                        {activeDetailSeason.crop_name}
                      </span>
                    </div>
                    <p className="text-xs text-base-content/70 mt-2 font-medium">
                      {t("MyFarms.planted_label")} {" "}
                      <span className="text-base-content">
                        {new Date(
                          activeDetailSeason.planted_date,
                        ).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-base-content/30"></div>
                    <span className="text-lg font-bold text-base-content/70">
                      {t("MyFarms.fallow_land")}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-base-content/50 uppercase tracking-widest mb-3">
                  {t("MyFarms.geographical_info")}
                </h4>
                <ul className="space-y-3 text-sm font-medium">
                  <li className="flex justify-between items-center pb-2 border-b border-base-content/5">
                    <span className="text-base-content/70">{t("MyFarms.boundary_nodes_label")}</span>
                    <span className="bg-base-200 px-2 py-1 rounded-md">
                      {selectedPaths.length}
                    </span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-base-content/5">
                    <span className="text-base-content/70">{t("MyFarms.digitized_on")}</span>
                    <span>
                      {selectedFarm
                        ? new Date(selectedFarm.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-auto pt-6 flex flex-col gap-3">
                {activeDetailSeason ? (
                  <button
                    onClick={() =>
                      document.getElementById("pest_modal").showModal()
                    }
                    className="btn btn-error w-full shadow-lg shadow-error/20 text-white rounded-xl"
                  >
                    <AlertCircle size={18} className="mr-1" /> {t("MyFarms.log_pest_button")}
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      document.getElementById("season_modal").showModal()
                    }
                    className="btn btn-secondary w-full shadow-lg shadow-secondary/20 rounded-xl"
                  >
                    <Sprout size={18} className="mr-1" /> {t("MyFarms.plant_new_crop")}
                  </button>
                )}
                <button
                  onClick={handleDeleteFarm}
                  disabled={isSubmitting}
                  className="btn btn-ghost text-error w-full rounded-xl"
                >
                  {t("MyFarms.delete_field_record")}
                </button>
              </div>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>{t("MyFarms.close")}</button>
        </form>
      </dialog>

      {/* ========================================= */}
      {/* MODAL: START NEW CROP SEASON              */}
      {/* ========================================= */}
      <dialog id="season_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-base-100 sm:rounded-2xl">
          <h3 className="font-black text-xl text-secondary">{t("MyFarms.season_title")}</h3>
          <p className="py-2 text-sm text-base-content/70">
            {t("MyFarms.season_prompt_prefix")} {" "}
            <span className="font-bold text-base-content">
              {selectedFarm?.name}
            </span>
            ?
          </p>
          <form onSubmit={handleStartSeason} className="space-y-3 mt-4">
            <div>
              <label className="label text-xs font-bold uppercase tracking-wider text-base-content/70">
                {t("MyFarms.crop_name_label")}
              </label>
              <input
                type="text"
                required
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                placeholder={t("MyFarms.crop_name_placeholder")}
                className="input input-bordered w-full bg-base-200 rounded-xl"
              />
            </div>
            <div>
              <label className="label text-xs font-bold uppercase tracking-wider text-base-content/70">
                {t("MyFarms.expected_harvest_label")}
              </label>
              <input
                type="date"
                required
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="input input-bordered w-full bg-base-200 rounded-xl"
              />
            </div>
            <div className="modal-action mt-6">
              <button
                type="button"
                className="btn btn-ghost rounded-xl"
                onClick={() => document.getElementById("season_modal").close()}
              >
                {t("MyFarms.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-secondary rounded-xl"
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  t("MyFarms.start_season_button")
                )}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>{t("MyFarms.close")}</button>
        </form>
      </dialog>

      {/* ========================================= */}
      {/* MODAL: LOG PEST DETECTION                 */}
      {/* ========================================= */}
      <dialog id="pest_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-base-100 border-t-4 border-error sm:rounded-2xl">
          <h3 className="font-black text-xl text-error flex items-center gap-2">
            <AlertCircle size={22} /> {t("MyFarms.broadcast_alert_title")}
          </h3>
          <p className="py-2 text-sm text-base-content/70">
            {t("MyFarms.broadcast_alert_description")}
          </p>
          <form onSubmit={handleLogPest} className="space-y-3 mt-4">
            <div>
              <label className="label text-xs font-bold uppercase tracking-wider text-base-content/70">
                {t("MyFarms.pest_name_label")}
              </label>
              <input
                type="text"
                required
                value={pestName}
                onChange={(e) => setPestName(e.target.value)}
                placeholder={t("MyFarms.pest_name_placeholder")}
                className="input input-bordered w-full bg-base-200 rounded-xl"
              />
            </div>
            <div>
              <label className="label">
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">
                  {t("MyFarms.severity_label")}
                </span>
                <span className="text-xs text-error font-bold">
                  {severity === "5" ? t("MyFarms.severity_critical") : ""}
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="range range-error range-sm"
              />
              <div className="w-full flex justify-between text-[10px] font-bold px-2 mt-2 text-base-content/40">
                <span>{t("MyFarms.severity_mild")}</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>{t("MyFarms.severity_severe")}</span>
              </div>
            </div>
            <div className="modal-action mt-6">
              <button
                type="button"
                className="btn btn-ghost rounded-xl"
                onClick={() => document.getElementById("pest_modal").close()}
              >
                {t("MyFarms.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-error text-white rounded-xl"
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  t("MyFarms.broadcast_alert_button")
                )}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>{t("MyFarms.close")}</button>
        </form>
      </dialog>
    </div>
  );
};

export default MyFarmsDashboard;
