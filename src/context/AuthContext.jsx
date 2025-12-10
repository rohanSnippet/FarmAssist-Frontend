import React, { createContext, useContext, useEffect, useState } from "react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
// import api from "../axios"; // Uncomment this when you integrate your backend

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Initial check for stored tokens (Session Persistence)
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      // In a real app, you would verify the token or fetch user data here
      // For now, we simulate a logged-in state if a token exists
      setUser({ token: token, email: "user@example.com" });
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    // try {
    // const res = await api.post("/api/token/", { email, password });
    // const accessToken = res.data.access;
    // const refreshToken = res.data.refresh;

    // Simulating a successful login and token generation
    const accessToken = "simulated_access_token";
    const refreshToken = "simulated_refresh_token";

    localStorage.setItem(ACCESS_TOKEN, accessToken);
    localStorage.setItem(REFRESH_TOKEN, refreshToken);
    setUser({ email: email, token: accessToken });
    return true; // Indicate success
    // } catch (error) {
    //   console.error("Login failed:", error);
    //   return false; // Indicate failure
    // }
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
