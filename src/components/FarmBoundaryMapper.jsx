import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager } from '@react-google-maps/api';

// We must load the 'drawing' library explicitly
const libraries = ['drawing'];

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

// Defaulting to Maharashtra/Mumbai coordinates
const defaultCenter = {
  lat: 19.0760,
  lng: 72.8777
};

const FarmBoundaryMapper = ({ onSaveFarm }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, // Store your key in .env!
    libraries: libraries
  });

  const [geoJsonData, setGeoJsonData] = useState(null);

  // This fires exactly when the user finishes drawing their shape
  const onPolygonComplete = useCallback((polygon) => {
    const path = polygon.getPath();
    const coordinates = [];

    // CRITICAL FIX: Google Maps outputs [Lat, Lng]. 
    // PostGIS/GeoJSON strictly requires [Lng, Lat]. We flip them here.
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coordinates.push([point.lng(), point.lat()]);
    }

    // GeoJSON rules require the first and last coordinate to be identical to close the loop
    if (coordinates.length > 0) {
      coordinates.push([...coordinates[0]]);
    }

    // Wrap it in the exact structure Django PostGIS expects
    const finalGeoJson = {
      type: "Polygon",
      coordinates: [coordinates]
    };

    setGeoJsonData(finalGeoJson);
  }, []);

  const submitFarm = () => {
    if (geoJsonData) {
      onSaveFarm(geoJsonData);
    } else {
      alert("Please draw a boundary on the map first.");
    }
  };

  if (!isLoaded) return <div className="p-4 text-center">Loading Google Maps...</div>;

  return (
    <div className="w-full flex flex-col">
      <div className="rounded-md shadow-md overflow-hidden border border-gray-300">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={13}
          center={defaultCenter}
          mapTypeId="satellite" // Defaults to satellite view for farming
        >
          <DrawingManager
            onPolygonComplete={onPolygonComplete}
            options={{
              drawingControl: true,
              drawingControlOptions: {
                position: window.google.maps.ControlPosition.TOP_CENTER,
                // Only allow users to draw polygons (not circles or markers)
                drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
              },
              polygonOptions: {
                fillColor: '#22c55e',
                fillOpacity: 0.4,
                strokeWeight: 2,
                strokeColor: '#00FF00',
                clickable: false,
                editable: true,
                zIndex: 1,
              },
            }}
          />
        </GoogleMap>
      </div>

      <button 
        onClick={submitFarm} 
        className="mt-4 btn btn-primary text-white px-4 mx-44 py-2 transition font-medium"
      >
        Save Farm Boundaries
      </button>
    </div>
  );
};

export default FarmBoundaryMapper;