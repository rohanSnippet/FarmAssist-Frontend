import React, { useState } from 'react';
import FarmBoundaryMapper from './FarmBoundaryMapper';
import MyFarmsDashboard from './MyFarmsDashboard';
import api from '../axios';

const ManageFarms = () => {
  const [isAddingFarm, setIsAddingFarm] = useState(false);
  const [farmName, setFarmName] = useState('');

  // This function is passed to the mapper as the onSaveFarm prop
  const handleSaveFarmToBackend = async (geoJsonData) => {
    try {
      // 1. Prepare the payload matching your Django FarmSerializer
      const payload = {
        name: farmName || 'My New Farm',
        boundaries: geoJsonData // The PostGIS-compatible Polygon
      };

      console.log("Data ready for Django:", payload);

      // 2. Hit your Django API
      const response = await api.post('/api/farms/', payload);
      
      if(response.status === 201 || response.status === 200) {
        alert('Farm saved successfully!');
        // 3. Close the mapper. This will remount the Dashboard and fetch the fresh data!
        setIsAddingFarm(false);
        setFarmName('');
      } else {
        alert("Error saving farm...");
      }

    } catch (error) {
      console.error("Error saving farm:", error);
      alert("An error occurred while communicating with the server.");
    }
  };

  return (
    <div className="p-6 max-w-8xl mx-auto py-32">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">My Farms</h2>
        
        {/* Only show the Add button if we aren't already adding a farm */}
        {!isAddingFarm && (
          <button 
            onClick={() => setIsAddingFarm(true)}
            className="text-white px-4 py-2 btn btn-primary transition font-medium shadow-sm"
          >
            + Add New Farm
          </button>
        )}
      </div>
      
      {!isAddingFarm ? (
        /* Render the Split-View Dashboard when viewing */
        <MyFarmsDashboard />
      ) : (
        /* Render the Map Drawing Tool when adding */
        <div className=" p-6 rounded-lg shadow-md border border-gray-700">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Farm Name
            </label>
            <input 
              type="text" 
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="e.g. North River Plot"
              className="w-full border-gray-300 rounded-md shadow-sm p-3 border focus:ring-green-500 focus:border-green-500 transition"
            />
          </div>

          {/* Render the Map Component here */}
          <FarmBoundaryMapper onSaveFarm={handleSaveFarmToBackend} />
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => setIsAddingFarm(false)}
              className="text-gray-500 hover:text-red-600 font-medium px-4 py-2 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFarms;