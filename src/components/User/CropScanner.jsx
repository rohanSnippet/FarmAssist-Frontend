import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import useGeoLocation from "../../hooks/useGeoLocation";
import api from "../../axios";
import {
  saveDetectionRequest,
  getDetectionRequests,
  getDetectionQueueCount,
  removeDetectionRequest,
  updateDetectionRequest,
} from "../../lib/indexedDB";

// --- MATH HELPERS ---
const extractPolygon = (boundaries) => {
  if (!boundaries) return [];
  if (typeof boundaries === "object" && boundaries.coordinates) {
    return boundaries.coordinates[0].map((c) => [
      parseFloat(c[0]),
      parseFloat(c[1]),
    ]);
  }
  if (typeof boundaries === "string" && boundaries.includes("POLYGON")) {
    const match = boundaries.match(/\(\(([^)]+)\)\)/);
    if (match && match[1]) {
      return match[1].split(",").map((point) => {
        const [lng, lat] = point.trim().split(" ");
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
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) isInside = !isInside;
  }
  return isInside;
};

// --- ANIMATION VARIANTS ---
const fadeAnim = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// --- MAIN COMPONENT ---
const CropScanner = ({ farms = [], onDigitizeNew }) => {
  const { coordinates, loaded, error } = useGeoLocation();
  const fileInputRef = useRef(null);
  const { t, i18n } = useTranslation();

  // States
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isDeviceOnline, setIsDeviceOnline] = useState(navigator.onLine);

  // Storage & Sync States
  const [outboxCount, setOutboxCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isStorageSupported, setIsStorageSupported] = useState(true);

  // Context-Aware States
  const [locationMatch, setLocationMatch] = useState(null);
  const [selectedFallbackFarm, setSelectedFallbackFarm] = useState("");

  useEffect(() => {
    if (!window.indexedDB) {
      setIsStorageSupported(false);
      console.warn(
        "IndexedDB is not supported in this browser/mode. Offline capabilities disabled.",
      );
    }

    const handleOnline = () => {
      setIsDeviceOnline(true);
      triggerBackgroundSync();
    };
    const handleOffline = () => setIsDeviceOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    updateOutboxCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const updateOutboxCount = async () => {
    if (!window.indexedDB) return;

    try {
      const count = await getDetectionQueueCount();
      setOutboxCount(count);
    } catch (err) {
      console.error("Failed to read outbox count:", err);
    }
  };

  const triggerBackgroundSync = async () => {
    if (!navigator.onLine || isSyncing) {
      return;
    }

    try {
      setIsSyncing(true);

      const pendingRequests = await getDetectionRequests();

      console.log("Pending offline detections:", pendingRequests);

      for (const item of pendingRequests) {
        try {
          console.log("Syncing detection:", item.id);

          // =====================================
          // STEP 1: RECREATE /api/scan/
          // =====================================

          const scanFormData = new FormData();

          scanFormData.append("image", item.scanRequest.imageFile);

          scanFormData.append("language", item.scanRequest.language || "en");

          await updateDetectionRequest(item.id, {
            status: "SCANNING",
            lastError: null,
          });

          const scanResponse = await api.post(
            item.scanRequest.endpoint,
            scanFormData,
          );

          console.log("Offline scan result:", scanResponse.data);

          // =====================================
          // IMPORTANT:
          // Immediately update React UI
          // with the real server response.
          // =====================================

          setScanResult({
            ...scanResponse.data,
            isOfflineMock: false,
            isSyncedOfflineResult: true,
          });

          // Make sure image remains visible
          setImageFile(item.scanRequest.imageFile);

          if (item.scanRequest.imageFile) {
            setPreviewUrl((currentUrl) => {
              if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
              }

              return URL.createObjectURL(item.scanRequest.imageFile);
            });
          }

          // =====================================
          // STEP 2: GET AI DIAGNOSIS
          // =====================================

          const diagnosis = scanResponse.data.primary_diagnosis;

          const confidence = scanResponse.data.confidence;

          // =====================================
          // STEP 3: RECREATE /api/detections/
          // =====================================

          const detectionFormData = new FormData();

          /*
           * IMPORTANT:
           * Your Django PestDetection model uses
           * image_url, not image.
           *
           * If /api/detections/ doesn't need the
           * actual image, don't send it here.
           */
          if (
            item.detectionRequest.farmId &&
            item.detectionRequest.farmId !== "unlinked"
          ) {
            detectionFormData.append("farm_id", item.detectionRequest.farmId);
          }

          detectionFormData.append("pest_name", diagnosis);

          detectionFormData.append("confidence", confidence ?? "");

          await updateDetectionRequest(item.id, {
            status: "BROADCASTING",
          });

          await api.post(item.detectionRequest.endpoint, detectionFormData);

          // =====================================
          // STEP 4: SUCCESS
          // =====================================

          console.log(`Detection ${item.id} synced successfully`);

          /*
           * DELETE ONLY AFTER BOTH API CALLS
           * HAVE SUCCEEDED.
           */
          await removeDetectionRequest(item.id);

          console.log(`Detection ${item.id} removed from IndexedDB`);

          /*
           * Refresh count immediately.
           */
          await updateOutboxCount();

          /*
           * DO NOT resetScanner() here.
           *
           * We want the user to see the newly
           * arrived server response.
           */
        } catch (error) {
          console.error(`Failed to sync detection ${item.id}:`, error);

          await updateDetectionRequest(item.id, {
            status: "PENDING_SCAN",
            lastError: error?.response?.data
              ? JSON.stringify(error.response.data)
              : error?.message || "Sync failed",
            lastAttempt: new Date().toISOString(),
          });

          /*
           * Keep this request in IndexedDB.
           *
           * The next sync attempt can retry it.
           */
          break;
        }
      }
    } catch (error) {
      console.error("Background sync failed:", error);
    } finally {
      setIsSyncing(false);

      await updateOutboxCount();
    }
  };

  const handleCameraClick = () => {
    if (outboxCount > 0) {
      alert(t("CropScanner.pending_sync_warning"));
      return;
    }
    fileInputRef.current.click();
  };

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

    let matchResult = { type: "NO_FARMS" };
    if (farms.length > 0) {
      if (loaded && !error && coordinates.lat && coordinates.lng) {
        const userPoint = [coordinates.lng, coordinates.lat];
        let foundMatch = false;

        for (const farm of farms) {
          const poly = extractPolygon(farm.boundaries);
          if (isPointInPolygon(userPoint, poly)) {
            matchResult = { type: "MATCH", farm: farm };
            foundMatch = true;
            break;
          }
        }
        if (!foundMatch) matchResult = { type: "NO_MATCH" };
      } else {
        matchResult = { type: "NO_LOCATION" };
      }
    }
    setLocationMatch(matchResult);

    if (!isDeviceOnline) {
      try {
        /*
         * IMPORTANT:
         *
         * We are NOT calling the backend.
         *
         * We save everything required to reconstruct
         * the backend requests later.
         */

        setScanResult({
          primary_diagnosis: t("CropScanner.offline_capture_mode"),

          advisory:
            t("CropScanner.offline_capture_advisory_1") + "\n" +
            t("CropScanner.offline_capture_advisory_2") + "\n" +
            t("CropScanner.offline_capture_advisory_3"),

          confidence: 1.0,

          isOfflineMock: true,
        });

        console.log("OFFLINE DETECTION REQUEST QUEUED");
      } catch (error) {
        console.error("Failed to queue offline detection:", error);

        alert(t("CropScanner.browser_storage_issue"));

        resetScanner();
      } finally {
        setIsScanning(false);
      }

      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("language", i18n.language || "en");

      const response = await api.post("/api/scan/", formData);
      setScanResult(response.data);
    } catch (err) {
      console.error("Scanning failed", err);
      alert(t("CropScanner.failed_to_analyze"));
      resetScanner();
    } finally {
      setIsScanning(false);
    }
  };

  const confirmAndBroadcast = async (forceUnlinked = false) => {
    let targetFarmId = "unlinked";
    if (!forceUnlinked) {
      if (locationMatch?.type === "MATCH") {
        targetFarmId = locationMatch.farm.id;
      } else if (selectedFallbackFarm) {
        targetFarmId = selectedFallbackFarm;
      } else {
        return alert(t("CropScanner.select_farm_prompt"));
      }
    }

    if (!isDeviceOnline || scanResult?.isOfflineMock) {
      if (!isStorageSupported) {
        alert(t("CropScanner.browser_no_storage"));
        return;
      }

      try {
        await saveDetectionRequest({
          imageFile,
          farmId: targetFarmId,
          language: i18n.language || "en",
        });

        await updateOutboxCount();

        alert(t("CropScanner.save_to_outbox_message"));

        resetScanner();
      } catch (err) {
        console.error("Storage Exception:", err);

        alert(t("CropScanner.storage_full_error"));
      }

      return;
    }

    try {
      const finalData = new FormData();
      finalData.append("image", imageFile);
      if (targetFarmId !== "unlinked") {
        finalData.append("farm_id", targetFarmId);
      }
      finalData.append("pest_name", scanResult.primary_diagnosis);
      finalData.append("confidence", scanResult.confidence);

      await api.post("/api/detections/", finalData);
      alert(t("CropScanner.broadcast_success"));
      resetScanner();
    } catch (err) {
      console.error("Failed to broadcast", err);
      alert(t("CropScanner.broadcast_failed"));
    }
  };

  const resetScanner = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setLocationMatch(null);
    setSelectedFallbackFarm("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pendingSyncLabel =
    outboxCount === 1
      ? t("CropScanner.pending_sync_one", { count: outboxCount })
      : t("CropScanner.pending_sync_other", { count: outboxCount });

  // Dynamic width: Expands when scan result is available
  const containerWidthClass = scanResult ? "max-w-6xl" : "max-w-md";

  return (
    <div
      className={`relative w-full mx-auto z-10 transition-all duration-500 ease-in-out ${containerWidthClass}`}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-2%] w-[60%] h-[60%] bg-secondary/15 blur-[100px] rounded-full pointer-events-none z-0" />

      <div className="bg-base-100/70 backdrop-blur-xl border border-base-content/10 shadow-xl rounded-2xl overflow-hidden relative z-10">
        {/* Alerts & Headers */}
        {outboxCount > 0 && (
          <div className="bg-warning/10 border-b border-warning/20 text-warning px-6 py-4 flex justify-between items-center backdrop-blur-md">
            <span className="font-semibold flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              {pendingSyncLabel}
            </span>
            {isDeviceOnline && (
              <button
                onClick={triggerBackgroundSync}
                disabled={isSyncing}
                className="btn btn-sm btn-warning"
              >
                {isSyncing ? t('CropScanner.syncing') : t('CropScanner.sync_now')}
              </button>
            )}
          </div>
        )}

        {!isStorageSupported && !isDeviceOnline && (
          <div className="bg-error/10 border-b border-error/20 text-error px-6 py-4 text-center font-semibold">
            {t('CropScanner.offline_mode_unavailable')}
          </div>
        )}

        <div className="p-6 md:px-8 border-b border-base-content/10 bg-base-200/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-base-content tracking-tight">
              {t('CropScanner.title')}
            </h2>
            <p className="text-sm text-base-content/60 font-medium mt-1">
              {t('CropScanner.subtitle')}
            </p>
          </div>
          <div
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-md border ${isDeviceOnline ? "bg-success/10 text-success border-success/20" : "bg-error/10 text-error border-error/20"}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isDeviceOnline ? "bg-success" : "bg-error animate-pulse"}`}
            />
            {isDeviceOnline ? t('CropScanner.status.online') : t('CropScanner.status.offline')}
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col items-center">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleImageCapture}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {!previewUrl && (
              <motion.button
                key="idle"
                variants={fadeAnim}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={handleCameraClick}
                disabled={outboxCount > 0}
                className={`w-full max-w-md aspect-[4/3] rounded-2xl bg-base-200/50 border-2 border-dashed flex flex-col items-center justify-center transition-all ${outboxCount > 0 ? "border-error/30 text-error/60 cursor-not-allowed opacity-50" : "border-base-content/20 text-base-content/60 hover:text-primary hover:border-primary/50 hover:bg-primary/5 cursor-pointer group"}`}
              >
                <div
                  className={`p-5 bg-base-100 rounded-2xl shadow-sm border border-base-content/5 mb-4 ${outboxCount === 0 && "group-hover:scale-110 transition-transform"}`}
                >
                  {outboxCount > 0 ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-error/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </div>
                <span className="font-bold text-lg tracking-wide">
                  {outboxCount > 0
                    ? t('CropScanner.sync_required_to_scan')
                    : t('CropScanner.initialize_camera')}
                </span>
              </motion.button>
            )}

            {previewUrl && !scanResult && (
              <motion.div
                key="scanning"
                variants={fadeAnim}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-base-content/10 shadow-inner"
              >
                <img
                  src={previewUrl}
                  alt={t('CropScanner.crop_scan_alt')}
                  className="w-full h-full object-cover brightness-50 blur-sm transition-all"
                />
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_15px_3px_rgba(var(--p),0.8)]"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{
                    duration: 2.0,
                    ease: "linear",
                    repeat: Infinity,
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                  <span className="px-5 py-2.5 bg-base-100 text-primary font-bold text-sm rounded-xl shadow-2xl border border-base-content/10">
                    {isDeviceOnline
                      ? t('CropScanner.ai_analyzing')
                      : t('CropScanner.queueing_offline')}
                  </span>
                </div>
              </motion.div>
            )}

            {scanResult && (
              <motion.div
                key="result"
                variants={fadeAnim}
                initial="hidden"
                animate="visible"
                className="w-full mt-2"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div className="w-full h-64 lg:h-full min-h-[300px] rounded-2xl overflow-hidden border border-base-content/10 shadow-lg relative bg-black">
                    <img
                      src={previewUrl}
                      alt={t('CropScanner.scanned_crop_alt')}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 left-4 bg-base-100/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold shadow-md border border-base-content/10">
                      {t('CropScanner.input_preview')}
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div
                      className={`p-6 rounded-2xl border backdrop-blur-md shadow-lg flex flex-col gap-4 ${scanResult.isOfflineMock ? "bg-info/10 border-info/30" : scanResult.confidence >= 0.8 ? "bg-error/10 border-error/30" : "bg-warning/10 border-warning/30"}`}
                    >
                      <div className="flex items-start gap-4 border-b border-base-content/10 pb-4">
                        <div
                          className={`p-3 rounded-xl ${scanResult.confidence >= 0.8 ? "bg-error/20 text-error" : "bg-warning/20 text-warning"}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3
                            className={`font-black text-2xl leading-tight ${scanResult.confidence >= 0.8 ? "text-error" : "text-warning-content"}`}
                          >
                            {scanResult.primary_diagnosis}
                          </h3>
                          <span className="text-sm font-bold opacity-70 uppercase tracking-wider mt-1 block">
                            {t('CropScanner.ai_confidence')}: {(scanResult.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-base-content/60 uppercase mb-3 tracking-wider">
                          {t('CropScanner.treatment_protocol')}
                        </h4>
                        <ul className="space-y-3">
                          {scanResult.advisory
                            .split("\n")
                            .filter((line) => line.trim() !== "")
                            .map((step, index) => {
                              const cleanStep = step.replace(/^\d+\.\s*/, "");
                              return (
                                <li
                                  key={index}
                                  className="flex gap-3 text-base text-base-content/90 leading-snug"
                                >
                                  <span className="text-primary font-black mt-0.5">
                                    •
                                  </span>
                                  <span className="font-medium">
                                    {cleanStep}
                                  </span>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-base-200/50 backdrop-blur-md border border-base-content/10 p-6 rounded-2xl">
                      {locationMatch?.type === "MATCH" && (
                        <div className="flex flex-col gap-4">
                          <div>
                            <h4 className="font-bold text-base text-success flex items-center gap-2">
                              <span className="w-2 h-2 bg-success rounded-full"></span>{" "}
                              {t('CropScanner.boundary_confirmed')}
                            </h4>
                            <p className="text-sm text-base-content/70 mt-1">
                              {t('CropScanner.standing_inside')} {" "}
                              <span className="font-bold text-base-content">
                                {locationMatch.farm.name}
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={() => confirmAndBroadcast(false)}
                            className="btn btn-primary btn-lg rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform w-full"
                          >
                            {isDeviceOnline
                              ? t('CropScanner.broadcast_threat')
                              : t('CropScanner.queue_to_outbox')}
                          </button>
                        </div>
                      )}

                      {locationMatch?.type === "NO_MATCH" && (
                        <div className="flex flex-col gap-4">
                          <h4 className="font-bold text-sm text-warning flex items-center gap-2">
                            <span className="w-2 h-2 bg-warning rounded-full"></span>{" "}
                            {t('CropScanner.manual_assignment_required')}
                          </h4>
                          <select
                            className="select select-bordered w-full bg-base-100 rounded-xl"
                            value={selectedFallbackFarm}
                            onChange={(e) =>
                              setSelectedFallbackFarm(e.target.value)
                            }
                          >
                            <option value="" disabled>
                              {t('CropScanner.assign_to_farm')}
                            </option>
                            {farms.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => confirmAndBroadcast(false)}
                            disabled={!selectedFallbackFarm}
                            className="btn btn-primary rounded-xl w-full"
                          >
                            {t('CropScanner.broadcast_threat')}
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={resetScanner}
                      className="btn btn-outline btn-block rounded-xl font-bold tracking-wider"
                    >
                      {t('CropScanner.discard_rescan')}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CropScanner;
