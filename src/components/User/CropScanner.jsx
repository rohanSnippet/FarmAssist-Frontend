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
const CropScanner = ({ farms = [], onDigitizeNew, onScanQueued }) => {
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

      const response = await api.post("/api/scan/submit/", formData);
      
      if (response.data.job_id) {
        window.dispatchEvent(new CustomEvent('scanSubmitted', { detail: { jobId: response.data.job_id } }));
      }
      
      if (onScanQueued && response.data.job_id) {
        onScanQueued(response.data.job_id, "");
        // Reset the UI immediately so the user can scan another crop if needed
        resetScanner();
      } else {
        // Fallback for legacy behavior if needed
        setScanResult(response.data);
      }
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
      className={`relative w-full mx-auto z-10 transition-all duration-500 ease-in-out ${containerWidthClass} poppins-regular`}
    >
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-secondary/5 blur-[150px] rounded-full pointer-events-none z-0" />

      <div className="w-full relative z-10 flex flex-col gap-6">
        {/* Alerts & Headers */}
        {outboxCount > 0 && (
          <div className="alert alert-warning shadow-sm rounded-box backdrop-blur-md flex justify-between items-center mt-4">
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
          <div className="alert alert-error shadow-sm rounded-box text-center font-semibold mt-4">
            {t('CropScanner.offline_mode_unavailable')}
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-base-content poppins-semibold">
              {t('CropScanner.title')}
            </h1>
            <p className="text-base-content/70 mt-2 text-sm md:text-base">
              {t('CropScanner.subtitle')}
            </p>
          </div>
          <div
            className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${isDeviceOnline ? "bg-success/5 text-success border-success/10" : "bg-error/5 text-error border-error/10"}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isDeviceOnline ? "bg-success" : "bg-error animate-pulse"}`}
            />
            {isDeviceOnline ? t('CropScanner.status.online') : t('CropScanner.status.offline')}
          </div>
        </div>

        <div className="flex flex-col items-center mt-4">
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
                className={`w-full max-w-md aspect-[4/3] rounded-2xl bg-base-200/30 border border-base-content/10 flex flex-col items-center justify-center transition-all ${outboxCount > 0 ? "border-error/30 text-error/60 cursor-not-allowed opacity-50" : "text-base-content/60 hover:shadow-md hover:bg-base-100 cursor-pointer group"}`}
              >
                <div
                  className={`p-4 rounded-full bg-base-100 shadow-sm border border-base-content/5 mb-4 ${outboxCount === 0 && "group-hover:scale-105 transition-transform"}`}
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
                <span className="poppins-medium text-base text-base-content/80">
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
                className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-base-content/10 bg-base-200/50"
              >
                <img
                  src={previewUrl}
                  alt={t('CropScanner.crop_scan_alt')}
                  className="w-full h-full object-cover opacity-60 transition-all"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                  <span className="px-4 py-2 bg-base-100/90 text-base-content font-medium text-sm rounded-full shadow-sm border border-base-content/10">
                    {isDeviceOnline
                      ? t('CropScanner.ai_analyzing')
                      : t('CropScanner.queueing_offline')}
                  </span>
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
