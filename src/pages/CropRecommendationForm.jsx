import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../axios";
// import { useAuth } from "../context/AuthContext";
import { useToast } from "../ui/Toast";

// --- 1. Modern Loader Overlay (Glassmorphism) ---
const LoaderOverlay = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base-300/80 backdrop-blur-md transition-all duration-300">
    <div className="flex flex-col items-center gap-6 p-8">
      <span className="loading loading-ring loading-lg text-primary scale-150"></span>
      <p className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-pulse">
        Analyzing Soil Data...
      </p>
    </div>
  </div>
);

// --- 2. Image Helper ---
const getCropImage = (cropName) => {
  const images = {
    coffee:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTe4yrLCeFKzilrAmAk5JIigzAByi9j6acYEA&s",
    rice: 
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyvKlKT-apF06j5nheDJb5X3F5FoRdZ0Dilg&s",
    maize:
      "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80",
    chickpea:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5_XDg88wObYm8nxDqJY8O1O7FSI9Oruh3QQ&s",
    muskmelon:
      "https://images.unsplash.com/photo-1571575173700-afb9492e6a50?auto=format&fit=crop&w=800&q=80",
    mango:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80",
    cotton:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKrll3LfHucKQsZx2eA_QY6chEWgY4n-TR1w&s",
    coconut:
    "https://www.biovie.fr/modules/prestablog/views/img/grid-for-1-7/up-img/750.jpg",
    jute:
    "https://researchoutreach.org/wp-content/uploads/2021/06/Shahidul-Islam-3-Main-Image-1200x720.jpg",
    papaya:
    "https://www.dreamfoodscaribe.com/wp-content/uploads/2024/07/papaya-fruit.webp",
    orange:
    "https://i0.wp.com/cdn-prod.medicalnewstoday.com/content/images/articles/272/272782/oranges-in-a-box.jpg?w=1155&h=1444",
    default:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80",
  };

  return images[cropName?.toLowerCase()] || images["default"];
};

// --- 3. Icons (Inline for portability) ---
const Icons = {
  Nitrogen: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 opacity-70"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  ),
  Phosphorus: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 opacity-70"
    >
      <path d="M10 2v7.31" />
      <path d="M14 9.3V1.99" />
      <path d="M8.5 2h7" />
      <path d="M14 9.3a6.5 6.5 0 1 1-4 0" />
      <path d="M5.52 16h12.96" />
    </svg>
  ),
  Potassium: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 opacity-70"
    >
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-2.26C4.19 13.47 3 11.38 3 9a7 7 0 0 1 9-7z" />
    </svg>
  ),
  Temperature: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 opacity-70"
    >
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
      <path d="M12 2v2" />
    </svg>
  ),
  Humidity: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 opacity-70"
    >
      <path d="M12 2.69l5.74 5.88a6 6 0 0 1-8.48 8.48A6 6 0 0 1 5.26 9.57L12 2.69Z" />
      <path d="M12 16a4 4 0 0 1 0-8c.5 0 1 .1 1.5.3" />
    </svg>
  ),
  pH: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 opacity-70"
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  ),
  Rainfall: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 opacity-70"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M16 14v6" />
      <path d="M8 14v6" />
      <path d="M12 16v6" />
    </svg>
  ),
};

// --- 4. Validation Schema ---
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
  const [imgLoaded, setImgLoaded] = useState(false);
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
      const response = await api.post(`/predict/`, data);
      setPrediction(response?.data?.recommended_crop);
      Toast.fire({ icon: "success", title: "Analysis Complete" });
    } catch (err) {
      Toast.fire({ icon: "error", title: "Prediction Failed" });
    }
  };

  const handleReset = () => {
    setPrediction(null);
    setImgLoaded(false);
    reset();
  };

  // --- Layout Wrapper ---
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      {/* 1. Full Page Loader */}
      {isSubmitting && <LoaderOverlay />}

      {/* --- VIEW 1: Result Card --- */}
      {prediction ? (
        <div className="card w-full max-w-lg bg-base-100 shadow-2xl shadow-primary/20 border border-base-content/5 animate-in fade-in zoom-in duration-300">
          <div className="card-body items-center text-center p-8">
            <h2 className="text-3xl font-extrabold text-base-content mb-1">
              Recommended Crop
            </h2>
            <p className="text-base-content/60 mb-6">
              Based on your soil analysis
            </p>

            <div className="badge badge-primary badge-outline gap-2 p-4 mb-6 text-lg font-bold uppercase tracking-widest">
              ✨ {prediction} ✨
            </div>

            <figure className="w-full h-64 rounded-2xl overflow-hidden relative shadow-lg bg-base-300 mb-8 group">
              {!imgLoaded && (
                <div className="absolute inset-0 skeleton w-full h-full"></div>
              )}
              <img
                src={getCropImage(prediction)}
                alt={prediction}
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                  imgLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
            </figure>

            <button
              onClick={handleReset}
              className="btn btn-primary btn-block text-lg shadow-lg hover:shadow-primary/50 transition-all"
            >
              Analyze New Data
            </button>
          </div>
        </div>
      ) : (
        /* --- VIEW 2: Input Form --- */
        <div className="card w-full max-w-3xl bg-base-100 shadow-xl shadow-base-content/5 animate-in slide-in-from-bottom-4 duration-500">
          <div className="card-body p-6 md:p-10">
            <div className="flex flex-col gap-1 mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent w-fit">
                Farm Assist AI
              </h2>
              <p className="text-base-content/70">
                Enter your soil metrics below to get crop recommendation.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Field Generator */}
              {[
                {
                  label: "Nitrogen (N)",
                  name: "nitrogen",
                  icon: Icons.Nitrogen,
                },
                {
                  label: "Phosphorus (P)",
                  name: "phosphorus",
                  icon: Icons.Phosphorus,
                },
                {
                  label: "Potassium (K)",
                  name: "potassium",
                  icon: Icons.Potassium,
                },
                {
                  label: "Temperature (°C)",
                  name: "temperature",
                  step: "0.1",
                  icon: Icons.Temperature,
                },
                {
                  label: "Humidity (%)",
                  name: "humidity",
                  step: "0.1",
                  icon: Icons.Humidity,
                },
                { label: "pH Level", name: "ph", step: "0.1", icon: Icons.pH },
              ].map((field) => (
                <div className="form-control w-full" key={field.name}>
                  <label className="label pb-1">
                    <span className="label-text font-medium opacity-80">
                      {field.label}
                    </span>
                  </label>
                  <label
                    className={`input input-bordered flex items-center gap-3 focus-within:input-primary focus-within:shadow-lg transition-all ${
                      errors[field.name]
                        ? "input-error bg-error/5"
                        : "bg-base-200/50"
                    }`}
                  >
                    <span className="text-base-content/50">{field.icon}</span>
                    <input
                      type="number"
                      step={field.step || "1"}
                      placeholder="0.00"
                      {...register(field.name, { valueAsNumber: true })}
                      className="grow font-mono"
                    />
                  </label>
                  {errors[field.name] && (
                    <span className="text-error text-xs mt-1 ml-1">
                      {errors[field.name].message}
                    </span>
                  )}
                </div>
              ))}

              {/* Rainfall - Full Width */}
              <div className="form-control w-full md:col-span-2">
                <label className="label pb-1">
                  <span className="label-text font-medium opacity-80">
                    Rainfall (mm)
                  </span>
                </label>
                <label
                  className={`input input-bordered flex items-center gap-3 focus-within:input-primary focus-within:shadow-lg transition-all ${
                    errors.rainfall
                      ? "input-error bg-error/5"
                      : "bg-base-200/50"
                  }`}
                >
                  <span className="text-base-content/50">{Icons.Rainfall}</span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.00"
                    {...register("rainfall", { valueAsNumber: true })}
                    className="grow font-mono"
                  />
                </label>
                {errors.rainfall && (
                  <span className="text-error text-xs mt-1 ml-1">
                    {errors.rainfall.message}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <div className="form-control md:col-span-2 mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary text-lg shadow-lg hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300"
                >
                  {isSubmitting
                    ? "Generating Recommendations..."
                    : "Predict Best Crop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropRecommendationForm;
