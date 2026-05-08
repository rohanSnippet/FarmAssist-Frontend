import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../axios';

const AlertInbox = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/api/alerts/');
      setAlerts(response.data);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Fetch immediately when the component mounts
    fetchAlerts();

    // 2. The "Smart Focus" Engine: Only fetch when the user switches back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAlerts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Cleanup to prevent memory leaks
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const markAsRead = async (alertId) => {
    try {
      // Optimistic UI: Instantly remove it from the screen for a snappy feel
      setAlerts(alerts.filter(a => a.id !== alertId));
      
      // Tell Django to mark it as read
      await api.patch(`/api/alerts/${alertId}/`, { is_read: true });
    } catch (err) {
      console.error("Failed to mark alert as read", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <span className="loading loading-dots loading-md text-primary"></span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-base-100/80 backdrop-blur-xl border border-base-300 shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[500px]">
      
      {/* Header */}
      <div className="bg-error/10 border-b border-error/20 p-4 flex justify-between items-center z-10">
        <h3 className="font-bold text-lg text-error flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          Pest & Disease Alerts
        </h3>
        {alerts.length > 0 && (
          <div className="badge badge-error gap-1 text-white font-bold shadow-md">
            {alerts.length} New
          </div>
        )}
      </div>

      {/* Alert Feed */}
      <div className="flex-1 overflow-y-auto p-4 bg-base-200/50 space-y-3 relative">
        <AnimatePresence>
          {alerts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-base-content/40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium">All clear! No nearby threats.</p>
            </motion.div>
          ) : (
            alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                layout // Smoothly slides remaining cards up when one is dismissed
                className="card bg-base-100 shadow-lg border-l-4 border-error relative group overflow-hidden"
              >
                {/* Severity Indicator Glow */}
                <div className={`absolute top-0 right-0 w-20 h-20 blur-3xl rounded-full opacity-20 pointer-events-none ${alert.severity >= 4 ? 'bg-error' : 'bg-warning'}`}></div>

                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-base-content text-lg">
                      {alert.pest_name}
                    </h4>
                    <span className={`badge badge-sm font-bold shadow-sm ${alert.severity >= 4 ? 'badge-error text-white' : 'badge-warning'}`}>
                      Severity: {alert.severity}/5
                    </span>
                  </div>
                  
                  <p className="text-sm text-base-content/70 mt-1">
                    Detected near your <span className="font-medium text-base-content">{alert.affected_farm_name || 'land'}</span>.
                  </p>
                  
                  <div className="flex justify-between items-end mt-4 pt-3 border-t border-base-200">
                    <span className="text-[10px] text-base-content/40 uppercase tracking-wider font-semibold">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                    <button 
                      onClick={() => markAsRead(alert.id)}
                      className="btn btn-xs btn-ghost text-base-content/50 hover:text-success hover:bg-success/10 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlertInbox;