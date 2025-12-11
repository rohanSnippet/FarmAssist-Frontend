import React from "react";

const LoaderOverlay = ({ content }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base-300/50 backdrop-blur-sm">
    <div className="bg-base-100 p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4 border border-base-200">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="text-base-content font-bold animate-pulse">{content}...</p>
    </div>
  </div>
);

export default LoaderOverlay;
