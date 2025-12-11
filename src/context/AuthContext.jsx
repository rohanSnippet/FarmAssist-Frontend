import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { jwtDecode } from "jwt-decode";
import api from "../axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUserFromToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      return {
        userId: decoded.user_id, // Maps to "5"
        email: decoded.email, // Maps to "user4@gmail.com"
      };
    } catch (error) {
      return null;
    }
  };

  const refreshUserToken = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    if (!refreshToken) return null;

    try {
      // Call backend to get a new access token
      const res = await api.post("/api/token/refresh/", {
        refresh: refreshToken,
      });

      const newAccessToken = res.data.access;
      localStorage.setItem(ACCESS_TOKEN, newAccessToken);

      // Optional: Update refresh token if your backend rotates them
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
      const now = Date.now() / 1000; // Current time in seconds

      // Case A: Token is Expired -> Try to Refresh
      if (tokenExpiration < now) {
        console.log("Access token expired. Refreshing...");
        const newAccessToken = await refreshUserToken();

        if (newAccessToken) {
          const userPayload = getUserFromToken(newAccessToken);
          setUser({ ...userPayload, token: newAccessToken });
        }
      }
      // Case B: Token is Valid -> Set User
      else {
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

  const login = async (email, password) => {
    try {
      const res = await api.post("/api/token/", { email, password });
      console.log(res);
      const accessToken = res.data.access;
      const refreshToken = res.data.refresh;

      localStorage.setItem(ACCESS_TOKEN, accessToken);
      localStorage.setItem(REFRESH_TOKEN, refreshToken);
      const userPayload = getUserFromToken(accessToken);
      setUser({ ...userPayload, token: accessToken });
      return true; // Indicate success
    } catch (error) {
      console.error("Login failed:", error);
      return false; // Indicate failure
    }
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated, loading, setLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
