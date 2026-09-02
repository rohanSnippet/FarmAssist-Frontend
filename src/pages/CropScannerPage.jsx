import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CropScanner from '../components/User/CropScanner';
import api from '../axios';

const CropScannerPage = () => {
  const [farms, setFarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <CropScanner 
        farms={farms} 
        onDigitizeNew={handleDigitizeNew} 
      />
    </div>
  );
};

export default CropScannerPage;