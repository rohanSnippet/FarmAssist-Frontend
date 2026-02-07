import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { useToast } from "../ui/Toast"; 
import api from "../axios";

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const { user, token, setUser, loading: authLoading } = useAuth();
  const Toast = useToast();
 
  const [curLocation, setCurLocation] = useState({
    label: null, // Default text
    lat: null,
    lng: null,
    isLoaded: false
  });

  const [loadingLoc, setLoadingLoc] = useState(false);

  // --- Helper: Reverse Geocode (Coords -> City Name) ---
  const fetchLocationLabel = async (lat, lng) => {
    try {
      // Using OpenStreetMap (Free, no key required for demo)
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const addr = response.data.address;
      // robust fallback for city name
      return addr.city || addr.town || addr.village || addr.county || "Unknown Location";
    } catch (error) {
      console.error("Geocoding error:", error);
      return "Unknown Location";
    }
  };

  // --- Core Logic: Detect & Save ---
  const detectAndSaveLocation = () => {
    if (!navigator.geolocation) {
      Toast.fire({ icon: "error", title: "Geolocation not supported" });
      return;
    }

    setLoadingLoc(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // 1. Get readable name
        const label = await fetchLocationLabel(lat, lng);
        const newLocData = { label, lat, lng, isLoaded: true };
     
        // 2. Storage Logic
        if (user) {
        //  console.log(user, token)
          // A. Logged In? Save to DB
          try {
            const res = await api.patch(
              "/api/me/", // Ensure this endpoint exists
              { location_label: label, latitude: lat, longitude: lng }
            );

            console.log(res.data)
            // Update Auth Context to keep everything in sync
            Toast.fire({ icon: "success", title: "Location saved to account" });
          } catch (err) {
            console.error("DB Sync failed", err);
            Toast.fire({ icon: "warning", title: "Location used locally (Sync failed)" });
          }
        } else {
          // B. Guest? Save to LocalStorage
          localStorage.setItem("guest_location", JSON.stringify(newLocData));
          Toast.fire({ icon: "success", title: "Location updated locally" });
        }

        // 3. Update State
        setCurLocation(newLocData);
        setLoadingLoc(false);
      },
      (error) => {
        console.error(error);
        Toast.fire({ icon: "error", title: "Location permission denied" });
        setLoadingLoc(false);
      }
    );
  };

  // --- Initialization Logic ---
  useEffect(() => {
    if (authLoading) return;

    // Priority 1: Database (User Profile)
    if (user?.location_label) {
      setCurLocation({
        label: user.location_label,
        lat: user.latitude,
        lng: user.longitude,
        isLoaded: true
      });
    } 
    // Priority 2: LocalStorage (Guest)
    else {
      const saved = localStorage.getItem("guest_location");
      if (saved) {
        setCurLocation(JSON.parse(saved));
      }
    }
  }, [user, authLoading]);



  return (
    <LocationContext.Provider value={{ curLocation, detectAndSaveLocation, loadingLoc }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useUserLocation = () => useContext(LocationContext);
