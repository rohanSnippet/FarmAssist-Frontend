import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { useToast } from "../ui/Toast"; 
import api from "../axios";
import { useTranslation } from "react-i18next";

const LocationContext = createContext();

const isUsableLocation = (location) => {
  const label = location?.label?.trim().toLowerCase();
  const hasLatitude = location?.lat !== null && location?.lat !== undefined;
  const hasLongitude = location?.lng !== null && location?.lng !== undefined;

  return (
    Boolean(label) &&
    label !== "unknown location" &&
    label !== "unown location" &&
    hasLatitude &&
    hasLongitude &&
    Number.isFinite(Number(location.lat)) &&
    Number.isFinite(Number(location.lng))
  );
};

export const LocationProvider = ({ children }) => {
  const { user, token, setUser, loading: authLoading } = useAuth();
  const Toast = useToast();
  const { t } = useTranslation();
 
  const [curLocation, setCurLocation] = useState({
    label: null, // Default text
    lat: null,
    lng: null,
    isLoaded: false
  });

  const [loadingLoc, setLoadingLoc] = useState(false);

  // --- Helper: Reverse Geocode (Coords -> City Name) ---
  const fetchLocationLabel = useCallback(async (lat, lng) => {
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
  }, []);

  // --- Core Logic: Detect & Save ---
  const detectAndSaveLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      Toast.fire({ icon: "error", title: t("Common.toasts.error_occurred") });
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
            Toast.fire({ icon: "success", title: t("Common.toasts.location_selected") });
          } catch (err) {
            console.error("DB Sync failed", err);
            Toast.fire({ icon: "warning", title: t("Common.toasts.error_occurred") });
          }
        } else {
          // B. Guest? Save to LocalStorage
          localStorage.setItem("guest_location", JSON.stringify(newLocData));
          Toast.fire({ icon: "success", title: t("Common.toasts.location_selected") });
        }

        // 3. Update State
        setCurLocation(newLocData);
        setLoadingLoc(false);
      },
      (error) => {
        console.error(error);
        Toast.fire({ icon: "error", title: t("Common.toasts.error_occurred") });
        setLoadingLoc(false);
      }
    );
  }, [Toast, fetchLocationLabel, t, user]);

  const autoDetectionKeyRef = useRef(null);

  // --- Initialization Logic ---
  useEffect(() => {
    if (authLoading) return;

    // Priority 1: Database (User Profile)
    let savedLocation = null;

    if (user?.location_label) {
      savedLocation = {
        label: user.location_label,
        lat: user.latitude,
        lng: user.longitude,
        isLoaded: true
      };
    } 
    // Priority 2: LocalStorage (Guest)
    else {
      try {
        const saved = localStorage.getItem("guest_location");
        if (saved) {
          savedLocation = JSON.parse(saved);
        }
      } catch (error) {
        console.warn("Unable to read saved location", error);
      }
    }

    if (savedLocation) {
      setCurLocation(savedLocation);
    }

    // A missing or unresolved location should follow the exact same path as
    // selecting "Detect My Location". Limit it to once for each account/guest
    // session so a denied permission or unavailable geocoder never loops.
    if (!isUsableLocation(savedLocation)) {
      const detectionKey = user
        ? `user:${user.id || user.email || "current"}`
        : "guest";

      if (autoDetectionKeyRef.current !== detectionKey) {
        autoDetectionKeyRef.current = detectionKey;
        detectAndSaveLocation();
      }
    } else {
      autoDetectionKeyRef.current = null;
    }
  }, [user, authLoading, detectAndSaveLocation]);



  return (
    <LocationContext.Provider value={{ curLocation, detectAndSaveLocation, loadingLoc }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useUserLocation = () => useContext(LocationContext);
