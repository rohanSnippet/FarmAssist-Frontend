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
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
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

  // --- NEW: FIREBASE BACKEND EXCHANGE HELPER ---
  // This sends the Firebase Token to Django to get the JWT
const handleBackendFirebase = async (firebaseToken, mode) => {
    try {
      const res = await api.post("/api/auth/firebase/", {
        token: firebaseToken,
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
    setLoading(true);
    try {
      // A. Login to Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // B. Get Token
      const token = await userCredential.user.getIdToken();

      // C. Sync with Django
      const success = await handleBackendFirebase(token, "login");
      
      return success; // Returns true if Django accepted the token
    } catch (error) {
      console.error("Login Error:", error);
      let msg = "Login failed";
      if(error.code === 'auth/wrong-password') msg = "Incorrect password";
      if(error.code === 'auth/user-not-found') msg = "No account found";
      if(error.code === 'auth/invalid-credential') msg = "Invalid credentials";

      Toast.fire({ icon: "error", title: msg });
      return false;
    } finally {
      setLoading(false);
    }
  };

  //old login
/*   const login = async (email, password) => {
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
  }; */

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
      const backendResponse = await handleBackendFirebase(token, mode);
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

  const setupRecaptcha = (elementId = "recaptcha-container") => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        size: "invisible",
      });
    }
    return window.recaptchaVerifier;
  };

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

  const logout = async() => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setUser(null);
    // Optional: Sign out from Firebase too
    // auth.signOut();
    await signOut(auth);
    Toast.fire({ icon: "success", title: "Logged out successfully" });
  };

  const forgotPassword = async(email) =>{
      try {
      await sendPasswordResetEmail(auth, email);
      setStatus({ 
        loading: false, 
        error: "", 
        success: "Reset link sent! Please check your inbox." 
      });
      // Optional: Close after 3 seconds on success
      setTimeout(onClose, 3000);
    } catch (error) {
      console.error(error);
      let msg = "Failed to send email.";
      if (error.code === 'auth/user-not-found') msg = "No account found with this email.";
      setStatus({ loading: false, error: msg, success: "" });
    }
  }

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setLoading,
        isAuthenticated,
        login, 
        googleLogin,
        sendPhoneOtp, 
        verifyPhoneOtp, 
        setupRecaptcha, 
        handleBackendFirebase,
        logout,
        auth,
        forgotPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
