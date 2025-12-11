import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../axios";
// import { useAuth } from "../context/AuthContext"; // Uncomment if needed
import { useToast } from "../ui/Toast";

// --- 1. Reusable Loader Overlay ---
const LoaderOverlay = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base-300/50 backdrop-blur-sm">
    <div className="bg-base-100 p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4 border border-base-200">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="text-base-content font-bold animate-pulse">
        Analyzing Soil Data...
      </p>
    </div>
  </div>
);

// --- 2. Image Helper ---
const getCropImage = (cropName) => {
  const images = {
    coffee:
      "https://images.unsplash.com/photo-1552346990-35431633512e?auto=format&fit=crop&w=600&q=80",
    rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    maize:
      "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80",
    chickpea:
      "https://images.unsplash.com/photo-1515543904379-3d757afe7264?auto=format&fit=crop&w=600&q=80",
    default:
      "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=80",
  };
  return images[cropName?.toLowerCase()] || images["default"];
};

// --- 3. Validation Schema ---
const schema = z.object({
  nitrogen: z.number().min(0, "Must be positive"),
  phosphorus: z.number().min(0, "Must be positive"),
  potassium: z.number().min(0, "Must be positive"),
  temperature: z.number().min(-50).max(60),
  humidity: z.number().min(0).max(100),
  ph: z.number().min(0).max(14),
  rainfall: z.number().min(0),
});

const CropRecommendationForm = () => {
  const [prediction, setPrediction] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false); // For image skeleton
  const Toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nitrogen: 101,
      phosphorus: 31,
      potassium: 26,
      temperature: 26.7,
      humidity: 69.7,
      ph: 6.8,
      rainfall: 158.8,
    },
  });

  const onSubmit = async (data) => {
    try {
      // Note: React Hook Form 'isSubmitting' stays true while this promise is pending
      const response = await api.post(`/predict/`, data);

      setPrediction(response?.data?.recommended_crop);
      Toast.fire({
        icon: "success",
        title: "Response Generated Successfully.",
      });
    } catch (err) {
      const backendError = err.response?.data;
      if (backendError?.email) {
        Toast.fire({
          icon: "error",
          title: "Error Generating Predictions!! Try again.",
        });
      } else {
        Toast.fire({
          icon: "error",
          title: "Network Error!!",
        });
      }
    }
  };

  const handleReset = () => {
    setPrediction(null);
    setImgLoaded(false);
    reset();
  };

  // --- VIEW 1: Result Card ---
  if (prediction) {
    return (
      <div className=" card w-full max-w-md mx-auto bg-base-100 shadow-xl border border-base-200 mt-10">
        <div className="card-body items-center text-center">
          <h2 className="card-title text-2xl font-bold text-base-content mb-2 poppins-bold">
            Best Crop to Plant
          </h2>

          <div className="badge badge-success badge-lg p-4 mb-4 text-white font-bold uppercase tracking-wide">
            {prediction}
          </div>

          <figure className="w-full h-64 rounded-xl overflow-hidden relative bg-base-300 mb-6">
            {!imgLoaded && (
              <div className="skeleton absolute inset-0 w-full h-full"></div>
            )}
            <img
              src={getCropImage(prediction)}
              alt={prediction}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </figure>

          <div className="card-actions w-full">
            <button onClick={handleReset} className="btn btn-primary w-full">
              Make Another Prediction
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: Input Form ---
  return (
    <div className="card w-full max-w-2xl mx-auto bg-base-100 shadow-xl mt-10">
      {/* 1. Full Page Loader (Triggers when submitting) */}
      {isSubmitting && <LoaderOverlay />}

      <div className="card-body">
        <h2 className="card-title text-2xl font-bold mb-6 text-base-content">
          Crop Environment Data
        </h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Helper Loop for Inputs */}
          {[
            { label: "Nitrogen (N)", name: "nitrogen" },
            { label: "Phosphorus (P)", name: "phosphorus" },
            { label: "Potassium (K)", name: "potassium" },
            { label: "Temperature (°C)", name: "temperature", step: "0.1" },
            { label: "Humidity (%)", name: "humidity", step: "0.1" },
            { label: "pH Level", name: "ph", step: "0.1" },
          ].map((field) => (
            <div className="form-control w-full" key={field.name}>
              <label className="label">
                <span className="label-text font-semibold">{field.label}</span>
              </label>
              <input
                type="number"
                step={field.step || "1"}
                {...register(field.name, { valueAsNumber: true })}
                className={`input input-bordered w-full focus:input-primary ${
                  errors[field.name] ? "input-error" : ""
                }`}
              />
              {errors[field.name] && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors[field.name].message}
                  </span>
                </label>
              )}
            </div>
          ))}

          {/* Full width field: Rainfall */}
          <div className="form-control w-full md:col-span-2">
            <label className="label">
              <span className="label-text font-semibold">Rainfall (mm)</span>
            </label>
            <input
              type="number"
              step="0.1"
              {...register("rainfall", { valueAsNumber: true })}
              className={`input input-bordered w-full focus:input-primary ${
                errors.rainfall ? "input-error" : ""
              }`}
            />
            {errors.rainfall && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.rainfall.message}
                </span>
              </label>
            )}
          </div>

          <div className="form-control md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full text-lg"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Analyzing...
                </>
              ) : (
                "Predict Best Crop"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CropRecommendationForm;
