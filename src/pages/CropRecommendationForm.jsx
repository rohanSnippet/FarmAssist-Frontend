import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { FiUploadCloud, FiFile, FiCheck, FiX, FiRefreshCw } from "react-icons/fi";
import api from "../axios"; // Your axios instance
import { useToast } from "../ui/Toast";
import useGeoLocation from "../hooks/useGeoLocation";

// --- 1. Icons (Clean, Technical Style) ---
const Icons = {
  Nitrogen: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" className="w-5 h-5 opacity-60"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>),
  Phosphorus: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" className="w-5 h-5 opacity-60"><path d="M10 2v7.31" /><path d="M14 9.3V1.99" /><path d="M8.5 2h7" /><path d="M14 9.3a6.5 6.5 0 1 1-4 0" /><path d="M5.52 16h12.96" /></svg>),
  Potassium: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" className="w-5 h-5 opacity-60"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-2.26C4.19 13.47 3 11.38 3 9a7 7 0 0 1 9-7z" /></svg>),
  Temperature: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" className="w-5 h-5 opacity-60"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" /><path d="M12 2v2" /></svg>),
  Humidity: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" className="w-5 h-5 opacity-60"><path d="M12 2.69l5.74 5.88a6 6 0 0 1-8.48 8.48A6 6 0 0 1 5.26 9.57L12 2.69Z" /><path d="M12 16a4 4 0 0 1 0-8c.5 0 1 .1 1.5.3" /></svg>),
  pH: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" className="w-5 h-5 opacity-60"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>),
  Rainfall: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" className="w-5 h-5 opacity-60"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M16 14v6" /><path d="M8 14v6" /><path d="M12 16v6" /></svg>),
  Sparkles: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.722L17.25 11.25l-1.009-2.528a1.125 1.125 0 00-.713-.713L13 7l2.528-1.009a1.125 1.125 0 00.713-.713L17.25 4.25l1.009 2.528a1.125 1.125 0 00.713.713L21.5 7l-2.528 1.009a1.125 1.125 0 00-.713.713z" /></svg>),
  Sync: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="square" strokeLinejoin="miter" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>),
};

const getCropImage = (cropName) => {
  const images = {
    coffee: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTe4yrLCeFKzilrAmAk5JIigzAByi9j6acYEA&s",
    rice: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyvKlKT-apF06j5nheDJb5X3F5FoRdZ0Dilg&s",
    maize: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80",
    chickpea: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5_XDg88wObYm8nxDqJY8O1O7FSI9Oruh3QQ&s",
    default: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80",
  };
  return images[cropName?.toLowerCase()] || images["default"];
};

// --- 2. Zod Schema ---
const schema = z.object({
  nitrogen: z.number().min(0, "Required"),
  phosphorus: z.number().min(0, "Required"),
  potassium: z.number().min(0, "Required"),
  temperature: z.number().min(-50).max(60),
  humidity: z.number().min(0).max(100),
  ph: z.number().min(0).max(14),
  rainfall: z.number().min(0),
});

const CropRecommendationForm = () => {
  const [activeTab, setActiveTab] = useState('manual');
  const [prediction, setPrediction] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const { coordinates, loaded: locationLoaded } = useGeoLocation();
  const Toast = useToast();

  // Drag & Drop State
  const [dragActive, setDragActive] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { 
        nitrogen: '', phosphorus: '', potassium: '', 
        temperature: '', humidity: '', ph: '', rainfall: '' 
    },
  });

  // --- HANDLERS ---
  const onSubmit = async (data) => {
    try {
      const response = await api.post(`/predict/`, data);
      setPrediction(response?.data?.recommended_crop);
      Toast.fire({ icon: "success", title: "Analysis Complete" });
    } catch (err) {
      Toast.fire({ icon: "error", title: "Prediction Failed" });
    }
  };

  const fetchWeather = async () => {
    if (!locationLoaded) {
        Toast.fire({ icon: "warning", title: "Locating..." });
        return;
    }
    setLoadingWeather(true);
    try {
      const { lat, lng } = coordinates;
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=precipitation_sum&timezone=auto`);
      const data = await response.json();
      
      setValue("temperature", data.current_weather.temperature);
      setValue("humidity", 70); 
      setValue("rainfall", data.daily.precipitation_sum[0] || 100);
      Toast.fire({ icon: "info", title: "Weather data synced" });
    } catch (error) {
      Toast.fire({ icon: "error", title: "Weather Sync Failed" });
    } finally {
      setLoadingWeather(false);
    }
  };

  // --- DROPZONE HANDLERS ---
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleProcessFile = async (file) => {
    // Validate file type
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      Toast.fire({ icon: "error", title: "Only Images or PDFs allowed" });
      return;
    }

    setUploadedFile(file);
    setIsExtracting(true);

    try {
      // Create FormData to send file to backend
      const formData = new FormData();
      formData.append("soil_card", file);

      // --- SIMULATED BACKEND CALL (Replace with your actual endpoint) ---
      // const response = await api.post('/ocr/extract', formData);
      
      // Simulating a delay for UX
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Simulating extracted data
      const extractedData = {
        nitrogen: 120,
        phosphorus: 42,
        potassium: 30,
        ph: 6.5,
      };

      // Fill form values
      Object.keys(extractedData).forEach(key => {
        setValue(key, extractedData[key]);
      });

      Toast.fire({ icon: "success", title: "Data Extracted Successfully" });
      setActiveTab('manual'); // Switch to form to show data
      setUploadedFile(null); // Clear file after processing

    } catch (error) {
      console.error(error);
      Toast.fire({ icon: "error", title: "Failed to extract data" });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 pt-28 pb-12 px-4 md:px-8 font-sans text-base-content selection:bg-primary selection:text-primary-content">
      
      {/* Prediction Overlay */}
      <AnimatePresence>
        {isSubmitting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-base-100/90 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-ring loading-lg text-primary scale-150"></span>
                    <p className="text-lg font-bold tracking-widest uppercase animate-pulse">Running AI Prediction</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div 
            initial={{ y: -20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            className="text-center mb-16"
        >
            <h1 className="text-5xl font-black mb-4 flex justify-center items-center gap-3 tracking-tight">
               <span className="text-primary">{Icons.Sparkles}</span> 
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">CROP INTELLIGENCE</span>
            </h1>
            <p className="text-base-content/60 font-medium tracking-wide">ADVANCED SOIL ANALYSIS & YIELD PREDICTION SYSTEM</p>
        </motion.div>

        {prediction ? (
          /* RESULT VIEW */
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="card bg-base-100 border-2 border-primary/10 shadow-2xl overflow-hidden rounded-sm"
          >
            <div className="flex flex-col md:flex-row h-full">
                <div className="md:w-1/2 relative min-h-[300px]">
                    <img src={getCropImage(prediction)} className="absolute inset-0 w-full h-full object-cover" alt={prediction} />
                    <div className="absolute inset-0 bg-primary/20 mix-blend-multiply"></div>
                </div>
                <div className="md:w-1/2 p-10 flex flex-col justify-center items-start bg-base-100">
                    <div className="badge badge-primary badge-outline rounded-sm mb-4 uppercase font-bold tracking-widest">Top Recommendation</div>
                    <h2 className="text-5xl font-black mb-6 uppercase text-base-content">{prediction}</h2>
                    <p className="text-base-content/60 mb-8 leading-relaxed">
                        Based on the nitrogen, phosphorus, and climatic data provided, this crop offers the highest probability of optimal yield.
                    </p>
                    <button 
                        onClick={() => { setPrediction(null); reset(); }} 
                        className="btn btn-primary btn-block rounded-sm uppercase tracking-wider font-bold"
                    >
                        Analyze New Sample
                    </button>
                </div>
            </div>
          </motion.div>
        ) : (
          /* TABBED INTERFACE */
          <>
            <div className="flex justify-center mb-12">
                <div className="bg-base-200/50 p-1 rounded-sm flex gap-1 relative border border-base-content/5">
                    {['manual', 'upload'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                relative px-8 py-3 text-sm font-bold uppercase tracking-wider rounded-sm transition-colors z-10
                                ${activeTab === tab ? 'text-primary-content' : 'text-base-content/50 hover:text-base-content'}
                            `}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary shadow-lg rounded-sm"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{tab === 'manual' ? 'Manual Entry' : 'Upload Health Card'}</span>
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'manual' ? (
                    <motion.div
                        key="manual"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-base-100 border border-base-200 shadow-xl p-8 md:p-12 rounded-sm"
                    >
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold uppercase text-base-content/40 tracking-widest border-b border-base-content/10 pb-2">Soil Nutrients</h3>
                                    {[
                                        { label: "Nitrogen (N)", name: "nitrogen", icon: Icons.Nitrogen },
                                        { label: "Phosphorus (P)", name: "phosphorus", icon: Icons.Phosphorus },
                                        { label: "Potassium (K)", name: "potassium", icon: Icons.Potassium }
                                    ].map((f) => (
                                        <div key={f.name} className="form-control">
                                            <label className="label pt-0"><span className="label-text font-bold text-xs uppercase opacity-70">{f.label}</span></label>
                                            <div className={`input input-bordered rounded-sm flex items-center gap-3 bg-base-200/20 focus-within:bg-base-100 focus-within:border-primary transition-all ${errors[f.name] ? 'input-error' : ''}`}>
                                                {f.icon}
                                                <input type="number" step="any" {...register(f.name, { valueAsNumber: true })} className="w-full bg-transparent font-mono text-lg" placeholder="00" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6 lg:col-span-2">
                                    <div className="flex justify-between items-end border-b border-base-content/10 pb-2">
                                        <h3 className="text-sm font-bold uppercase text-base-content/40 tracking-widest">Environmental Context</h3>
                                        <button type="button" onClick={fetchWeather} disabled={loadingWeather} className="btn btn-xs btn-ghost text-primary hover:bg-primary/10 rounded-sm">
                                            {loadingWeather ? <span className="loading loading-spinner loading-xs"></span> : Icons.Sync} 
                                            SYNC LOCATION DATA
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        {[
                                            { label: "Temperature (°C)", name: "temperature", icon: Icons.Temperature },
                                            { label: "Humidity (%)", name: "humidity", icon: Icons.Humidity },
                                            { label: "pH Level", name: "ph", icon: Icons.pH },
                                            { label: "Rainfall (mm)", name: "rainfall", icon: Icons.Rainfall }
                                        ].map((f) => (
                                            <div key={f.name} className="form-control">
                                                <label className="label pt-0"><span className="label-text font-bold text-xs uppercase opacity-70">{f.label}</span></label>
                                                <div className="input input-bordered rounded-sm flex items-center gap-3 bg-base-200/20 focus-within:bg-base-100 focus-within:border-primary transition-all">
                                                    {f.icon}
                                                    <input type="number" step="any" {...register(f.name, { valueAsNumber: true })} className="w-full bg-transparent font-mono text-lg" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-base-200">
                                <button type="submit" className="btn btn-primary btn-block btn-lg rounded-sm uppercase tracking-widest font-black shadow-lg hover:shadow-primary/20">
                                    Generate Prediction
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-base-100 border border-base-200 shadow-xl p-12 rounded-sm text-center min-h-[500px] flex flex-col justify-center items-center relative"
                    >
                        {isExtracting ? (
                            <div className="flex flex-col items-center">
                                <span className="loading loading-spinner loading-lg text-primary mb-6"></span>
                                <h3 className="text-xl font-black uppercase text-base-content mb-2">Analyzing Document</h3>
                                <p className="text-base-content/60">Extracting soil parameters using OCR...</p>
                            </div>
                        ) : (
                            <div className="max-w-md w-full">
                                <div className="mb-8 p-6 bg-primary/5 rounded-full inline-block">
                                    <FiUploadCloud className="w-12 h-12 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black uppercase mb-2">Soil Health Card</h3>
                                <p className="text-base-content/60 mb-8">Upload your official government soil report (PDF or Image).</p>

                                <div 
                                    className={`relative group w-full h-56 border-2 border-dashed transition-all rounded-sm flex flex-col items-center justify-center cursor-pointer overflow-hidden
                                        ${dragActive ? 'border-primary bg-primary/5' : 'border-base-content/20 hover:border-primary hover:bg-base-200/50'}
                                    `}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input 
                                        type="file" 
                                        accept="image/*,application/pdf"
                                        onChange={handleFileSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                                    />
                                    
                                    <FiFile className="w-8 h-8 opacity-20 mb-4 group-hover:scale-110 transition-transform" />
                                    <span className="btn btn-outline btn-sm rounded-sm uppercase tracking-wider pointer-events-none">Select File</span>
                                    <p className="text-xs opacity-40 pt-2 pointer-events-none">or drag and drop here</p>
                                </div>
                                
                                <div className="mt-8 flex items-center justify-center gap-2 text-xs opacity-50 uppercase tracking-widest font-bold">
                                    <FiCheck className="text-success" /> Secure Analysis • AI Powered
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default CropRecommendationForm;