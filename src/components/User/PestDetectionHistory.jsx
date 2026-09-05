import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../axios";
import LoadingSpinner from "../../components/LoadingSpinner";

const PestDetectionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const highlightId = searchParams.get('highlight_id');

  const fetchHistory = async () => {
    try {
      const response = await api.get("/api/scan/jobs/");
      setHistory(response.data);
    } catch (err) {
      setError("Failed to load pest detection history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/scan/jobs/${id}/`);
      setHistory(history.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full min-h-[50vh]">
      <LoadingSpinner />
    </div>
  );

  return (
    <div className="container mx-auto mt-12 px-4 sm:px-6 lg:px-8 py-8 md:py-12 poppins-regular w-full max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-base-content poppins-semibold">
          Pest Detection History
        </h1>
        <p className="text-base-content/70 mt-2 text-sm md:text-base">
          View your past crop scans and diagnostic results.
        </p>
      </div>

      {error && (
        <div className="alert alert-error shadow-md mb-6 rounded-box flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {history.length === 0 && !error ? (
        <div className="text-center py-16 px-4 bg-base-200/50 rounded-box border border-base-300">
          <p className="text-xl text-base-content/70 poppins-medium">You haven't made any crop scans yet.</p>
          <p className="text-sm text-base-content/50 mt-2">Your saved diagnostics will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {history.map((record) => {
            const isHighlighted = highlightId && record.id.toString() === highlightId;
            return (
              <div 
                key={record.id} 
                onClick={() => navigate(`/pest-history/${record.id}`)}
                className={`card bg-base-100 shadow-sm border transition-all duration-300 cursor-pointer ${isHighlighted ? 'border-primary shadow-xl ring-2 ring-primary/50' : 'border-base-200 hover:shadow-xl hover:scale-[1.02]'}`}
              >
                <div className="card-body p-5 md:p-6 relative">
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                    className="absolute top-2 right-2 btn btn-xs btn-ghost btn-circle text-error opacity-50 hover:opacity-100"
                    title="Delete record"
                  >
                    ✕
                  </button>

                  <div className="flex justify-between items-start mb-2 gap-2 pr-4">
                    <h2 className="card-title text-xl md:text-2xl text-primary capitalize leading-tight truncate">
                      {record.result?.crop || record.crop_hint || 'Unknown Crop'}
                    </h2>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <div className={`badge badge-sm font-semibold ${record.status === 'COMPLETED' ? 'badge-success text-white' : record.status === 'FAILED' ? 'badge-error text-white' : 'badge-warning'}`}>
                      {record.status}
                    </div>
                    <div className="text-xs text-base-content/50">
                      {new Date(record.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="divider my-0"></div>
                  
                  {record.status === 'COMPLETED' && record.result && (
                    <>
                      <p className="text-xs text-base-content/50 uppercase tracking-wider font-semibold mb-2">
                        Diagnosis
                      </p>
                      <p className="text-sm font-semibold text-base-content mb-3">
                        {record.result.primary_diagnosis || 'Healthy'} 
                        {record.result.confidence ? ` (${(record.result.confidence*100).toFixed(0)}%)` : ''}
                      </p>
                      
                      {record.result.advisory && (
                        <div className="mt-2 text-xs text-base-content/70 line-clamp-3">
                          {record.result.advisory}
                        </div>
                      )}
                    </>
                  )}
                  
                  {record.status === 'FAILED' && (
                    <div className="mt-2 text-sm text-error">
                      {record.error_message || 'Scan failed to process.'}
                    </div>
                  )}

                  {(record.status === 'PENDING' || record.status === 'PROCESSING') && (
                    <div className="mt-4 flex justify-center">
                      <span className="loading loading-dots loading-sm text-primary"></span>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PestDetectionHistory;
