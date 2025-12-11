import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: baseURL,
});

// 1. Request Interceptor: Adds Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. Response Interceptor: Handles Token Expiration (401)
api.interceptors.response.use(
  (response) => {
    return response; // If the request succeeds, just return the response
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized) and we haven't retried yet
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Mark this request so we don't loop infinitely

      // CRITICAL: If the 401 comes from the refresh endpoint itself,
      // it means the refresh token is also expired. We must log out.
      // Adjust the URL string to match your backend refresh endpoint exactly.
      if (originalRequest.url.includes("/token/refresh/")) {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        window.location.href = "/login"; // Force redirect to login page
        return Promise.reject(error);
      }

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);

        // If no refresh token is available, we can't refresh.
        if (!refreshToken) {
          // Optional: Logout user here
          return Promise.reject(error);
        }

        // Call the refresh endpoint
        // We use 'axios' directly here to avoid using the 'api' instance
        // which might trigger another interceptor loop.
        const res = await axios.post(`${baseURL}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        if (res.status === 200) {
          // 1. Save new tokens
          localStorage.setItem(ACCESS_TOKEN, res.data.access);
          // If your backend rotates refresh tokens, save the new one:
          if (res.data.refresh) {
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
          }

          // 2. Update the header of the failed request with the new token
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

          // 3. Retry the original request using the 'api' instance
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refreshing fails (e.g., refresh token expired), log the user out
        console.error("Token refresh failed inside interceptor:", refreshError);
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
