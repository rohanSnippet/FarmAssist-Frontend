import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { jwtDecode } from "jwt-decode";
import api from "../axios"; // Your axios instance
import { useToast } from "../ui/Toast";
import { auth, googleProvider } from "../firebase"; // Import from your firebase config
import {
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const Toast = useToast();

  // --- EXISTING HELPERS ---

  const getUserFromToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      return {
        userId: decoded.user_id,
        email: decoded.email,
        // You can add phone or providers here if your JWT has them
      };
    } catch (error) {
      return null;
    }
  };

  const refreshUserToken = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    if (!refreshToken) return null;

    try {
      const res = await api.post("/api/token/refresh/", {
        refresh: refreshToken,
      });

      const newAccessToken = res.data.access;
      localStorage.setItem(ACCESS_TOKEN, newAccessToken);

      if (res.data.refresh) {
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
      }

      return newAccessToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      return null;
    }
  }, []);

  const loadUser = useCallback(async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);

    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(accessToken);
      const tokenExpiration = decoded.exp;
      const now = Date.now() / 1000;

      if (tokenExpiration < now) {
        console.log("Access token expired. Refreshing...");
        const newAccessToken = await refreshUserToken();

        if (newAccessToken) {
          const userPayload = getUserFromToken(newAccessToken);
          setUser({ ...userPayload, token: newAccessToken });
        }
      } else {
        const userPayload = getUserFromToken(accessToken);
        setUser({ ...userPayload, token: accessToken });
      }
    } catch (error) {
      console.error("Error loading user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [refreshUserToken]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // console.log(auth.currentUser)
  // --- NEW: FIREBASE BACKEND EXCHANGE HELPER ---
  // This sends the Firebase Token to Django to get the JWT
  const handleBackendFirebase = async (firebaseToken, mode, password) => {
    try {
      const res = await api.post("/api/auth/firebase/", {
        token: firebaseToken,
        mode: mode, // 'login' or 'signup'
        password: password,
      });
      
      const accessToken = res.data.access;
      const refreshToken = res.data.refresh;

      // Store Tokens
      localStorage.setItem(ACCESS_TOKEN, accessToken);
      localStorage.setItem(REFRESH_TOKEN, refreshToken);

      // Set User State
      const userPayload = getUserFromToken(accessToken);
      setUser({ ...userPayload, token: accessToken });

      Toast.fire({
        icon: "success",
        title: `Successfully ${mode === "login" ? "Logged In" : "Signed Up"}!`,
      });

      return true;
    } catch (error) {
      console.error("Firebase Backend Error:", error);
      const errorMsg =
        error.response?.data?.error || "Authentication failed on server.";
      Toast.fire({
        icon: "error",
        title: errorMsg,
      });
      return false;
    }
  };

  // --- 1. EXISTING EMAIL/PASSWORD LOGIN ---
  const login = async (email, password) => {
    try {
      const res = await api.post("/api/token/", { email, password });
      const accessToken = res.data.access;
      const refreshToken = res.data.refresh;

      localStorage.setItem(ACCESS_TOKEN, accessToken);
      localStorage.setItem(REFRESH_TOKEN, refreshToken);
      const userPayload = getUserFromToken(accessToken);
      setUser({ ...userPayload, token: accessToken });
      return true;
    } catch (error) {
      if (
        error.response?.data?.detail ===
        "No active account found with the given credentials"
      ) {
        Toast.fire({
          icon: "warning",
          title: "User not found with provided email",
        });
      } else {
        console.error("Login failed:", error);
        Toast.fire({ icon: "error", title: "Login failed" });
      }
      return false;
    }
  };

  // --- 2. GOOGLE LOGIN ---
  // mode defaults to 'signup' but you can pass 'login' to enforce strict checks if needed
  /*   const googleLogin = async (mode = "signup") => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      console.log(token);
      // Send to Django
      return await handleBackendFirebase(token, mode, null);
    } catch (error) {
      console.error("Google Auth Error:", error);
      Toast.fire({
        icon: "error",
        title: error.message || "Google Authentication failed",
      });
      return false;
    }
  }; */

  const googleLogin = async (mode = "signup") => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken(); // or getIdToken(true) for fresh

      const backendResponse = await handleBackendFirebase(token, mode, null);

      if (!backendResponse || backendResponse.error) {
        Toast.fire({
          icon: "error",
          title: backendResponse?.error || "Backend login failed",
        });
        return false;
      }

      Toast.fire({
        icon: "success",
        title:
          mode === "signup"
            ? "Signed up successfully"
            : "Logged in successfully",
      });

      return backendResponse;
    } catch (error) {
      console.error("Google Auth Error:", error);

      // Firebase-specific errors mapping
      const firebaseErrors = {
        "auth/popup-closed-by-user": "Popup closed before completing login",
        "auth/cancelled-popup-request": "Cancelled previous popup request",
        "auth/network-request-failed": "Network error. Try again",
      };

      Toast.fire({
        icon: "error",
        title:
          firebaseErrors[error.code] ||
          error.message ||
          "Google Authentication failed",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- 3. PHONE AUTH FUNCTIONS ---

  // A. Setup Recaptcha (Call this once in useEffect or before sending OTP)
  // elementId is the ID of the div in your component: <div id="recaptcha-container"></div>
  const setupRecaptcha = (elementId = "recaptcha-container") => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        size: "invisible",
      });
    }
    return window.recaptchaVerifier;
  };

  // B. Send OTP
  const sendPhoneOtp = async (phoneNumber) => {
    try {
      // Ensure recaptcha is ready. You might need to pass the ID if it varies.
      const appVerifier = window.recaptchaVerifier || setupRecaptcha();

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );

      Toast.fire({
        icon: "success",
        title: "OTP Sent successfully!",
      });

      return confirmationResult; // Return this to the component to store in state
    } catch (error) {
      console.error("SMS Error:", error);
      Toast.fire({
        icon: "error",
        title: "Failed to send SMS. check format (+91...)",
      });
      return null;
    }
  };

  // C. Verify OTP & Login
  const verifyPhoneOtp = async (confirmationResult, otp, mode = "signup") => {
    try {
      const result = await confirmationResult.confirm(otp);
      const token = await result.user.getIdToken();

      // Send to Django
      return await handleBackendFirebase(token, mode);
    } catch (error) {
      console.error("OTP Verify Error:", error);
      Toast.fire({
        icon: "error",
        title: "Invalid OTP",
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setUser(null);
    // Optional: Sign out from Firebase too
    auth.signOut();
    Toast.fire({ icon: "success", title: "Logged out successfully" });
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setLoading,
        isAuthenticated,
        login, // Email/Pass
        googleLogin, // Google
        sendPhoneOtp, // Phone Step 1
        verifyPhoneOtp, // Phone Step 2
        setupRecaptcha, // Phone Helper
        handleBackendFirebase,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
