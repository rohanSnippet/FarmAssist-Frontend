import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";

const AlertInbox = ({ onClose }) => {
  const { notifications, alerts, dismissNotification, dismissAlert, clearAll } = useNotifications();
  const navigate = useNavigate();

  const isEmpty = notifications.length === 0 && alerts.length === 0;

  const handleNotifClick = (notif) => {
    const link = notif.link;
    dismissNotification(notif.id);
    if (link) {
      if (onClose) onClose();
      navigate(link);
    }
  };

  return (
    <div className="w-full max-w-md bg-base-100/80 backdrop-blur-xl border-l border-base-300 shadow-2xl overflow-hidden flex flex-col h-full">

      {/* Header */}
      <div className="bg-error/10 border-b border-error/20 p-4 flex justify-between items-center z-10">
        <h3 className="font-bold text-lg text-primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse text-error" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          Inbox
        </h3>
        <div className="flex items-center gap-3">
          {!isEmpty && (
            <button
              onClick={clearAll}
              className="btn btn-xs btn-outline btn-error uppercase tracking-widest text-[10px]"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto bg-base-100 space-y-0 relative">
        <AnimatePresence>
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-base-content/40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium">All clear! No new notifications.</p>
            </motion.div>
          ) : (
            <>
              {notifications.map((notif) => (
                <motion.div
                  key={`notif-${notif.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                  layout
                  className="flex items-start gap-4 p-4 border-b border-base-200 hover:bg-base-200/50 cursor-pointer transition-colors"
                  onClick={() => handleNotifClick(notif)}
                >
                  <div className="bg-primary/10 text-primary p-2 rounded-full shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm text-base-content truncate">{notif.title}</h4>
                      <span className="text-[10px] text-base-content/50 whitespace-nowrap shrink-0">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-base-content/70 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                  </div>
                </motion.div>
              ))}

              {alerts.map((alert) => (
                <motion.div
                  key={`alert-${alert.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                  layout
                  className="flex items-start gap-4 p-4 border-b border-base-200 hover:bg-base-200/50 transition-colors"
                >
                  <div className={`p-2 rounded-full shrink-0 mt-1 ${alert.severity >= 4 ? "bg-error/10 text-error" : "bg-warning/10 text-warning"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm text-base-content truncate">{alert.pest_name}</h4>
                      <span className="text-[10px] text-base-content/50 whitespace-nowrap shrink-0">
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
                      Detected near your <span className="font-medium text-base-content">{alert.affected_farm_name || "land"}</span>.
                      Severity: {alert.severity}/5
                    </p>
                    <div className="mt-2 flex">
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="text-xs font-bold text-primary hover:text-primary-focus transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlertInbox;
