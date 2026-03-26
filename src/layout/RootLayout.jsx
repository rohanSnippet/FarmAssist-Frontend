import React from "react";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import useNetworkStatus from "../hooks/useNetworkStatus";

const RootLayout = () => {
  const isOnline = useNetworkStatus();

  return (
    <div className="min-h-screen overflow-hidden flex flex-col relative bg-base-100">
      <Navbar />
      
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      
      <Footer />

      {/* Custom Floating Offline Pill */}
      {!isOnline && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
          {/* whitespace-nowrap: Prevents the text from squishing vertically
            rounded-full: Gives it that modern "pill" look
            bg-red-500/95 & backdrop-blur-sm: Makes it look sleek over your dark theme
          */}
          <div className="bg-red-500/95 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center gap-3 font-medium text-sm md:text-base border border-red-600 whitespace-nowrap">
            
            {/* Clean SVG Warning Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            
            <span>You are currently offline.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RootLayout;