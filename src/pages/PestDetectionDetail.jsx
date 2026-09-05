import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import api from "../axios";
import LoadingSpinner from "../components/LoadingSpinner";

const fadeAnim = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const PestDetectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [job, setJob] = useState(null);
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [jobRes, farmsRes] = await Promise.all([
          api.get(`/api/scan/jobs/${id}/`),
          api.get("/api/farms/")
        ]);
        setJob(jobRes.data);
        setFarms(farmsRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const confirmAndBroadcast = async () => {
    if (!selectedFarm) {
      return alert(t("CropScanner.select_farm_prompt") || "Please select a farm first.");
    }

    try {
      const imageResponse = await api.get(`/api/scan/jobs/${id}/image/`, { responseType: 'blob' });
      const imageBlob = imageResponse.data;
      const file = new File([imageBlob], "scanned_crop.jpg", { type: "image/jpeg" });

      const finalData = new FormData();
      finalData.append("image", file);
      finalData.append("farm_id", selectedFarm);
      finalData.append("pest_name", job.result.primary_diagnosis);
      finalData.append("confidence", job.result.confidence);

      await api.post("/api/detections/", finalData);
      alert(t("CropScanner.broadcast_success") || "Threat broadcasted successfully!");
      navigate('/pest-history');
    } catch (err) {
      console.error("Failed to broadcast", err);
      alert(t("CropScanner.broadcast_failed") || "Failed to broadcast threat.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto p-4 text-center mt-10">
        <h2 className="text-xl text-error">{error || "Job not found"}</h2>
        <button className="btn mt-4" onClick={() => navigate('/pest-history')}>Go Back</button>
      </div>
    );
  }

  if (job.status !== 'COMPLETED') {
    return (
      <div className="container mx-auto p-4 text-center mt-10">
        <h2 className="text-xl text-warning">This scan is still {job.status}.</h2>
        <p className="mt-2 text-base-content/70">Please check back later.</p>
        <button className="btn mt-4" onClick={() => navigate('/pest-history')}>Go Back</button>
      </div>
    );
  }

  const scanResult = job.result;
  const imageUrl = `${api.defaults.baseURL || ''}/api/scan/jobs/${id}/image/`;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl relative z-10">
      
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content poppins-semibold">
            Scan Details
          </h1>
          <p className="text-base-content/70 mt-1">
            {new Date(job.created_at).toLocaleString()}
          </p>
        </div>
        <button onClick={() => navigate('/pest-history')} className="btn btn-ghost btn-sm">
          ← Back
        </button>
      </div>

      <motion.div
        variants={fadeAnim}
        initial="hidden"
        animate="visible"
        className="w-full mt-2"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <div className="w-full h-64 lg:h-full min-h-[300px] rounded-2xl overflow-hidden border border-base-content/10 shadow-lg relative bg-black">
            <img
              src={imageUrl}
              alt={t('CropScanner.scanned_crop_alt') || "Scanned Crop"}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4 bg-base-100/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold shadow-md border border-base-content/10">
              {t('CropScanner.input_preview') || "Input Preview"}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div
              className={`p-6 rounded-2xl border backdrop-blur-md shadow-lg flex flex-col gap-4 ${scanResult.confidence >= 0.8 ? "bg-error/10 border-error/30" : "bg-warning/10 border-warning/30"}`}
            >
              <div className="flex items-start gap-4 border-b border-base-content/10 pb-4">
                <div
                  className={`p-3 rounded-xl ${scanResult.confidence >= 0.8 ? "bg-error/20 text-error" : "bg-warning/20 text-warning"}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`font-black text-2xl leading-tight ${scanResult.confidence >= 0.8 ? "text-error" : "text-warning-content"}`}>
                    {scanResult.primary_diagnosis}
                  </h3>
                  <span className="text-sm font-bold opacity-70 uppercase tracking-wider mt-1 block">
                    {t('CropScanner.ai_confidence') || "AI Confidence"}: {(scanResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-base-content/60 uppercase mb-3 tracking-wider">
                  {t('CropScanner.treatment_protocol') || "Treatment Protocol"}
                </h4>
                <ul className="space-y-3">
                  {scanResult.advisory
                    .split("\n")
                    .filter((line) => line.trim() !== "")
                    .map((step, index) => {
                      const cleanStep = step.replace(/^\d+\.\s*/, "");
                      return (
                        <li key={index} className="flex gap-3 text-base text-base-content/90 leading-snug">
                          <span className="text-primary font-black mt-0.5">•</span>
                          <span className="font-medium">{cleanStep}</span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>

            <div className="bg-base-200/50 backdrop-blur-md border border-base-content/10 p-6 rounded-2xl">
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-sm text-warning flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning rounded-full"></span>{" "}
                  {t('CropScanner.manual_assignment_required') || "Manual Assignment Required"}
                </h4>
                <select
                  className="select select-bordered w-full bg-base-100 rounded-xl"
                  value={selectedFarm}
                  onChange={(e) => setSelectedFarm(e.target.value)}
                >
                  <option value="" disabled>
                    {t('CropScanner.assign_to_farm') || "Assign to Farm"}
                  </option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={confirmAndBroadcast}
                  disabled={!selectedFarm}
                  className="btn btn-primary rounded-xl w-full"
                >
                  {t('CropScanner.broadcast_threat') || "Broadcast Threat"}
                </button>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PestDetectionDetail;
