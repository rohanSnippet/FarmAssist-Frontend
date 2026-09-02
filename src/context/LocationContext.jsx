import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
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
  const { user, loading: authLoading } = useAuth();
  const Toast = useToast();
  const { t } = useTranslation();

  const [curLocation, setCurLocation] = useState({
    label: null, // Default text
    lat: null,
    lng: null,
    isLoaded: false,
  });

  const [loadingLoc, setLoadingLoc] = useState(false);

  // --- Helper: Reverse Geocode (Coords -> City Name) ---
  const fetchLocationLabel = useCallback(async (lat, lng) => {
    try {
      // Using OpenStreetMap (Free, no key required for demo)
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const addr = response.data.address;
      // robust fallback for city name
      return (
        addr.city ||
        addr.town ||
        addr.village ||
        addr.county ||
        "Unknown Location"
      );
    } catch (error) {
      console.error("Geocoding error:", error);
      return "Unknown Location";
    }
  }, []);

  // --- Core Logic: Detect & Save ---
  const detectAndSaveLocation = useCallback(() => {
    if (!window.isSecureContext) {
      Toast.fire({
        icon: "error",
        title:
          "Location needs HTTPS on a phone. Open FarmAssist over HTTPS and try again.",
      });
      return;
    }

    if (!("geolocation" in navigator)) {
      Toast.fire({
        icon: "error",
        title: "Location is not supported by this browser.",
      });
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
        // Keep the latest successful fix available immediately, including if
        // the account sync is temporarily unavailable.
        localStorage.setItem("guest_location", JSON.stringify(newLocData));

        // 2. Storage Logic
        if (user) {
          //  console.log(user, token)
          // A. Logged In? Save to DB
          try {
            await api.patch(
              "/api/me/", // Ensure this endpoint exists
              { location_label: label, latitude: lat, longitude: lng },
            );

            Toast.fire({
              icon: "success",
              title: t("Common.toasts.location_selected"),
            });
          } catch (err) {
            console.error("DB Sync failed", err);
            Toast.fire({
              icon: "warning",
              title:
                "Location updated on this device, but account sync failed.",
            });
          }
        } else {
          // B. Guest? Save to LocalStorage
          Toast.fire({
            icon: "success",
            title: t("Common.toasts.location_selected"),
          });
        }

        // 3. Update State
        setCurLocation(newLocData);
        setLoadingLoc(false);
      },
      (error) => {
        console.error(error);
        const messageByCode = {
          1: "Location permission was denied. Allow location in your browser settings.",
          2: "Your location is unavailable. Check GPS, signal, and location services.",
          3: "Location request timed out. Move to an area with a clearer signal and try again.",
        };
        Toast.fire({
          icon: "error",
          title:
            messageByCode[error.code] ||
            "Unable to detect your location. Please try again.",
        });
        setLoadingLoc(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }, [Toast, fetchLocationLabel, t, user]);

  const autoDetectionKeyRef = useRef(null);
  const detectAndSaveLocationRef = useRef(detectAndSaveLocation);

  useEffect(() => {
    detectAndSaveLocationRef.current = detectAndSaveLocation;
  }, [detectAndSaveLocation]);

  // --- Initialization Logic ---
  useEffect(() => {
    if (authLoading) return;

    let savedLocation = null;

    // Priority 1: Database (User Profile)
    if (user?.location_label) {
      savedLocation = {
        label: user.location_label,
        lat: user.latitude,
        lng: user.longitude,
        isLoaded: true,
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

    // Update state only if we actually have a usable saved location
    if (savedLocation && isUsableLocation(savedLocation)) {
      setCurLocation((previous) => {
        if (
          previous.label === savedLocation.label &&
          previous.lat === savedLocation.lat &&
          previous.lng === savedLocation.lng &&
          previous.isLoaded === savedLocation.isLoaded
        ) {
          return previous;
        }

        return savedLocation;
      });

      autoDetectionKeyRef.current = null;
      return;
    }

    // Missing/unusable location → detect once
    const detectionKey = user
      ? `user:${user.id || user.email || "current"}`
      : "guest";

    if (autoDetectionKeyRef.current === detectionKey) {
      return;
    }

    autoDetectionKeyRef.current = detectionKey;

    detectAndSaveLocationRef.current();
  }, [
    authLoading,
    user?.id,
    user?.email,
    user?.location_label,
    user?.latitude,
    user?.longitude,
  ]);

  return (
    <LocationContext.Provider
      value={{ curLocation, detectAndSaveLocation, loadingLoc }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useUserLocation = () => useContext(LocationContext);
