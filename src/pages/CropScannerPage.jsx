import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CropScanner from '../components/User/CropScanner';
import api from '../axios';
import ScanJobQueue from '../components/User/ScanJobQueue';
import { useScanQueue } from '../hooks/useScanQueue';

const CropScannerPage = () => {
  const { t } = useTranslation();
  const [farms, setFarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize the scan queue hook
  const {
    jobs,
    addJob,
    removeJob,
    pendingCount
  } = useScanQueue();

  useEffect(() => {
    // Fetch registered farms to enable spatial boundary matching in the scanner
    const fetchUserFarms = async () => {
      try {
        const response = await api.get('/api/farms/');
        setFarms(response.data);
      } catch (error) {
        console.error("Failed to load farm boundaries. Scanner will default to unlinked mode.", error);
        // Fallback to empty array so the scanner can still operate anonymously
        setFarms([]); 
      } finally {
        setIsLoading(false);
      }
    };

    // If offline, bypass the fetch to let the scanner load immediately
    if (navigator.onLine) {
      fetchUserFarms();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleDigitizeNew = () => {
    // Redirect users to the mapping tool if they select "Digitize Boundaries"
    navigate('/manage-farms'); // Adjust route to match your FarmBoundaryMapper location
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] gap-3">
        <span className="loading loading-spinner loading-lg text-primary" aria-label={t('CropScanner.loading')}></span>
        <span className="text-sm font-medium text-base-content/70">{t('CropScanner.loading')}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 relative">
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => navigate('/pest-history')}
          className="btn btn-outline btn-primary gap-2 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View Past Scans
        </button>
      </div>

      <CropScanner 
        farms={farms} 
        onDigitizeNew={handleDigitizeNew}
        onScanQueued={addJob}
      />
      
      <ScanJobQueue
        jobs={jobs}
        onRemove={removeJob}
        pendingCount={pendingCount}
      />
    </div>
  );
};

export default CropScannerPage;