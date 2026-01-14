import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const LoaderOverlay = ({ content }) => {
  return (
    // 1. Overlay Backdrop: Uses base-300 with opacity for a themed dim effect
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-300/50 backdrop-blur-sm transition-all duration-300">
      {/* 2. The Card: Uses rounded-box and consistent padding */}
      <div className="bg-base-100 p-8 rounded-box shadow-2xl flex flex-col items-center gap-6 border border-base-200 max-w-sm w-full mx-4">
        {/* 3. Animation Container: Explicit width/height is crucial here */}
        <div className="w-52 h-52 flex items-center justify-center">
          <DotLottieReact
            src="https://lottie.host/d7b6aadc-ce57-4c48-a7b5-07af3d563a70/1sCWt3JrTu.lottie"
            loop
            autoplay
            className="w-full h-full"
          />
        </div>

        {/* 4. Text: Uses Theme Primary color for brand consistency */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-primary font-bold text-lg tracking-wide animate-pulse text-center">
            {content || "Loading..."}
          </p>
          <span className="text-base-content/60 text-xs">Please wait</span>
        </div>
      </div>
    </div>
  );
};

export default LoaderOverlay;
