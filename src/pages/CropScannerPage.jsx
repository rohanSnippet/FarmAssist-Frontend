import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../axios';
import CropScanner from '../components/User/CropScanner'; // The component we just built!

const CropScannerPage = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the user's farms for the Point-in-Polygon math
    const fetchFarms = async () => {
      try {
        const response = await api.get('/api/farms/');
        setFarms(response.data);
      } catch (err) {
        console.error("Failed to fetch farms", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, []);

  return (
    <div className="min-h-screen bg-base-200 pt-24 pb-12 px-4 md:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Plant Doctor
          </h1>
          <p className="text-base-content/70 mt-2">
            Instantly diagnose crop diseases and get treatment recommendations.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center h-64 items-center">
            <span className="loading loading-spinner text-primary loading-lg"></span>
          </div>
        ) : (
          <CropScanner 
            farms={farms} 
            // If they are outside a farm, send them to the farm management page to draw one!
            onDigitizeNew={() => navigate('/my-farms')} 
          />
        )}
      </motion.div>
    </div>
  );
};

export default CropScannerPage;