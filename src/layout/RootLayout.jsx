import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import MobileHeader from "../components/MobileHeader"; // Import the new header

const RootLayout = () => {
  const location = useLocation();

  // Helper to colorize the active tab icon
  const isActive = (path) =>
    location.pathname === path ? "text-primary" : "text-base-content/40";

  return (
    <div className="min-h-screen flex flex-col bg-base-300">
      {/* ========================================= */}
      {/* DESKTOP NAVBAR (Hidden on Mobile)         */}
      {/* ========================================= */}
      <div className="hidden md:block relative z-50">
        <Navbar />
      </div>

      {/* MOBILE TOP BAR (Hidden on Desktop) */}
      <MobileHeader />

      {/* ========================================= */}
      {/* MAIN CONTENT AREA                         */}
      {/* ========================================= */}
      {/* pb-20 ensures content isn't hidden behind the mobile bottom nav */}
      <main className="flex-1 pb-20 md:pb-0 relative z-10 pointer-events-auto">
        <Outlet />
      </main>

      {/* ========================================= */}
      {/* MOBILE BOTTOM NAV (Hidden on Desktop)     */}
      {/* ========================================= */}
      <nav className="md:hidden fixed bottom-0 w-full bg-base-100/95 backdrop-blur-xl border-t border-base-content/10 pb-safe z-[9999]">
        {/* Replaced h-16 with py-2 for flexible expansion */}
        <div className="flex justify-around items-center py-2 px-1">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 active:bg-base-200/50 rounded-xl transition-all ${isActive("/")}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">Home</span>
          </Link>

          <Link
            to="/pest-prediction"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 active:bg-base-200/50 rounded-xl transition-all ${isActive("/scanner")}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">Scan</span>
          </Link>

          <Link
            to="/my-farms"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 active:bg-base-200/50 rounded-xl transition-all ${isActive("/manage-farms")}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">Map</span>
          </Link>

          <Link
            to="/me"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 active:bg-base-200/50 rounded-xl transition-all ${isActive("/profile")}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default RootLayout;
