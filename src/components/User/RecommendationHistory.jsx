import React, { useState, useEffect } from "react";
import axios from "../../axios"; 
import LoadingSpinner from "../../components/LoadingSpinner";

const RecommendationHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get("/history/"); 
        setHistory(response.data);
      } catch (err) {
        setError("Failed to load recommendation history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Center the loading spinner nicely
  if (loading) return (
    <div className="flex justify-center items-center h-full min-h-[50vh]">
      <LoadingSpinner />
    </div>
  );

  console.log(history)

  return (
    // Standard responsive container. No hidden overflow, no weird flex centering.
    <div className="container mx-auto mt-12 px-4 sm:px-6 lg:px-8 py-8 md:py-12 poppins-regular w-full max-w-7xl">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-base-content poppins-semibold">
          Your Recommendation History
        </h1>
        <p className="text-base-content/70 mt-2 text-sm md:text-base">
          View your past crop predictions and environmental inputs.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="alert alert-error shadow-md mb-6 rounded-box flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {history.length === 0 && !error ? (
        <div className="text-center py-16 px-4 bg-base-200/50 rounded-box border border-base-300">
          <p className="text-xl text-base-content/70 poppins-medium">You haven't made any crop predictions yet.</p>
          <p className="text-sm text-base-content/50 mt-2">Your saved recommendations will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {history.map((record) => (
            <div key={record.id} className="card bg-base-100 shadow-sm shadow-primary/20 hover:shadow-xl border border-base-200 transition-all duration-300 ">
              <div className="card-body p-5 md:p-6">
                
                {/* Card Header */}
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h2 className="card-title text-xl md:text-2xl text-primary capitalize leading-tight">
                    {record.predicted_crop}
                  </h2>
                  <div className="badge badge-secondary badge-outline whitespace-nowrap text-xs">
                    {new Date(record.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="divider my-0"></div>
                <p className="text-xs text-base-content/50 uppercase tracking-wider font-semibold mb-3">
                  Soil & Weather Inputs
                </p>
                
                {/* Data Grid inside the card */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-base-content/80">
                  <div className="flex flex-col"><span className="text-xs opacity-70">Nitrogen</span> <span className="font-semibold">{record.nitrogen}</span></div>
                  <div className="flex flex-col"><span className="text-xs opacity-70">Phosphorus</span> <span className="font-semibold">{record.phosphorus}</span></div>
                  <div className="flex flex-col"><span className="text-xs opacity-70">Potassium</span> <span className="font-semibold">{record.potassium}</span></div>
                  <div className="flex flex-col"><span className="text-xs opacity-70">pH Level</span> <span className="font-semibold">{record.ph}</span></div>
                  <div className="flex flex-col"><span className="text-xs opacity-70">Temperature</span> <span className="font-semibold">{record.temperature}°C</span></div>
                  <div className="flex flex-col"><span className="text-xs opacity-70">Rainfall</span> <span className="font-semibold">{record.rainfall} mm</span></div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationHistory;