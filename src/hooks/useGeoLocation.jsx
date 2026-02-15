import { useState, useEffect, useCallback } from "react";

const useGeoLocation = () => {
  const [location, setLocation] = useState({
    loaded: false,
    coordinates: { lat: "", lng: "" },
    error: null,
  });

  // Use useCallback so this function doesn't trigger unnecessary re-renders
  const onSuccess = useCallback((position) => {
    const coords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    
    setLocation({
      loaded: true,
      coordinates: coords,
      error: null,
    });

    // Cache it! This prevents the "blank" state on next page visit
    localStorage.setItem("last_known_location", JSON.stringify(coords));
  }, []);

  const onError = useCallback((error) => {
    setLocation({
      loaded: true,
      coordinates: { lat: "19.07", lng: "72.87" }, // Mumbai fallback
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }, []);

  useEffect(() => {
    // 1. Check if we have a cached location first for instant UI loading
    const cachedLocation = localStorage.getItem("last_known_location");
    if (cachedLocation) {
      setLocation({
        loaded: true,
        coordinates: JSON.parse(cachedLocation),
        error: null,
      });
    }

    if (!("geolocation" in navigator)) {
      onError({ code: 0, message: "Geolocation not supported" });
      return;
    }

    // 2. Options for better accuracy (important for field-level farming data)
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0, // Don't use a cached browser position, get a fresh one
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  }, [onSuccess, onError]);

  return location;
};

export default useGeoLocation;