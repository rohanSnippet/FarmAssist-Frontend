import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { motion } from "framer-motion";

const ApplicationLoader = () => {
  return (
    <motion.div
      // 1. Background Fade In/Out
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-base-300/50 backdrop-blur-md"
    >
      {/* 2. The Card: Pop-up Scale Effect */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={{
          scale: 1,
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 0.8,
          },
        }}
        exit={{ scale: 0.8, opacity: 0, y: -20 }}
        className="bg-base-100 p-8 rounded-box shadow-2xl flex flex-col items-center gap-6 border border-base-200 max-w-xl w-full mx-4 relative overflow-hidden"
      >
        {/* Optional: Subtle background gradient splash for depth */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

        {/* 3. Animation Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-52 h-52 flex items-center justify-center"
        >
          <DotLottieReact
            src="https://lottie.host/d7b6aadc-ce57-4c48-a7b5-07af3d563a70/1sCWt3JrTu.lottie"
            loop
            autoplay
            className="w-full h-full"
          />
        </motion.div>

        {/* 4. Text: Staggered Slide Up */}
        <div className="pt-2 pb-2 text-center overflow-hidden">
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
            className="text-4xl font-bold tracking-tight text-base-content drop-shadow-sm"
          >
            Farm<span className="text-primary drop-shadow-md">Assist</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-base-content/60 text-sm mt-2 font-medium tracking-wide uppercase"
          >
            Empowering Agriculture
          </motion.p>
        </div>

        {/* Loading Progress Bar Indicator (Visual Cues are important) */}
        <motion.div
          className="h-1 bg-primary rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "60%" }} // Simulates loading to a point
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
};

export default ApplicationLoader;
