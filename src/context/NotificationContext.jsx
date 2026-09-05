/**
 * NotificationContext
 *
 * Single source of truth for all notification state across the app.
 * - Fetches initial unread notifications ONCE on login.
 * - Listens to the "scanJobUpdate" custom event dispatched by RootLayout SSE
 *   and appends new notifications in real time (no polling).
 * - Exposes unreadCount, notifications, alerts, and control functions.
 * - AlertInbox and Navbar both consume this context — NO independent fetching.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../axios";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { userData, auth } = useAuth();
  const isLoggedIn = !!(userData || auth?.currentUser);

  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // One-time fetch after login
  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      setAlerts([]);
      setUnreadCount(0);
      setInitialized(false);
      return;
    }
    if (initialized) return;

    (async () => {
      try {
        const [notifsRes, alertsRes] = await Promise.all([
          api.get("/api/notifications/"),
          api.get("/api/alerts/"),
        ]);
        const unread = notifsRes.data.filter((n) => !n.is_read);
        const unreadAlerts = alertsRes.data;
        setNotifications(unread);
        setAlerts(unreadAlerts);
        setUnreadCount(unread.length + unreadAlerts.length);
      } catch (err) {
        console.error("[NotificationContext] init fetch failed:", err);
      } finally {
        setInitialized(true);
      }
    })();
  }, [isLoggedIn, initialized]);

  // SSE real-time updates (no polling)
  useEffect(() => {
    const handleJobUpdate = (e) => {
      const data = e.detail;
      if (!data) return;

      if (data.type === "job_completed" || data.type === "job_failed") {
        if (data.notification) {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === data.notification.id)) return prev;
            return [data.notification, ...prev];
          });
          setUnreadCount((prev) => prev + 1);
        }
      } else if (data.type === "new_alert") {
        if (data.alert) {
          setAlerts((prev) => {
            if (prev.some((a) => a.id === data.alert.id)) return prev;
            return [data.alert, ...prev];
          });
          setUnreadCount((prev) => prev + 1);
        }
      }
    };

    window.addEventListener("scanJobUpdate", handleJobUpdate);
    return () => window.removeEventListener("scanJobUpdate", handleJobUpdate);
  }, []);

  // Mark all as read (call on inbox open)
  const markAllRead = useCallback(async () => {
    setUnreadCount(0);
    try {
      await api.post("/api/notifications/mark_all_read/");
    } catch (err) {
      console.error("[NotificationContext] markAllRead failed:", err);
    }
  }, []);

  // Dismiss a single UserNotification
  const dismissNotification = useCallback(async (id, navigate, link) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.patch(`/api/notifications/${id}/`, { is_read: true });
    } catch (err) {
      console.error("[NotificationContext] dismissNotification failed:", err);
    }
    if (navigate && link) navigate(link);
  }, []);

  // Dismiss a single PestAlert
  const dismissAlert = useCallback(async (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.patch(`/api/alerts/${id}/`, { is_read: true });
    } catch (err) {
      console.error("[NotificationContext] dismissAlert failed:", err);
    }
  }, []);

  // Clear everything
  const clearAll = useCallback(async () => {
    setNotifications([]);
    setAlerts([]);
    setUnreadCount(0);
    try {
      await api.post("/api/notifications/mark_all_read/");
    } catch (err) {
      console.error("[NotificationContext] clearAll failed:", err);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        alerts,
        unreadCount,
        markAllRead,
        dismissNotification,
        dismissAlert,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
