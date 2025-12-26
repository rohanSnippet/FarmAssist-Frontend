import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import LoaderOverlay from "./LoadingSpinner";
import { Home } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import PhoneLoginModal from "./PhoneLoginModal"; // Import this

const AuthPage = () => {
  const { loading } = useAuth();
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSignup = searchParams.get("mode") === "signup";

  // State for Phone Modal
  const [isPhoneModalOpen, setPhoneModalOpen] = useState(false);

  // Theme State Management
  const [currentTheme, setCurrentTheme] = useState(theme || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    setCurrentTheme(theme);
  }, [currentTheme]);

  const toggleMode = () => {
    setSearchParams({ mode: isSignup ? "login" : "signup" });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-base-200 transition-colors duration-500 overflow-hidden font-poppins">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-50 animate-pulse delay-1000" />

      {loading && <LoaderOverlay />}

      {/* Phone Login Modal */}
      <PhoneLoginModal
        isOpen={isPhoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        mode={isSignup ? "signup" : "login"}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card w-full shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] bg-base-100/70 backdrop-blur-md border border-base-content/10"
        >
          <div className="pt-8 pb-2 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-base-content drop-shadow-sm">
              Farm<span className="text-primary text-glow">Assist</span>
            </h1>
            <p className="text-base-content/60 text-sm mt-1 font-medium tracking-wide">
              Empowering Agriculture
            </p>
          </div>

          <div className="card-body overflow-hidden">
            <AnimatePresence mode="wait">
              {!isSignup ? (
                <motion.div
                  key="login"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <LoginForm
                    switchToSignup={toggleMode}
                    onPhoneClick={() => setPhoneModalOpen(true)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SignupForm
                    switchToLogin={toggleMode}
                    onPhoneClick={() => setPhoneModalOpen(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Note: Removed the isolated "Signup/Signin with Google" button here
                because it is now integrated inside SocialAuthSection within the forms */}

            <div className="divider my-2 opacity-50"></div>

            <Link
              to="/"
              className="btn btn-ghost btn-sm w-full gap-2 text-base-content/70 hover:text-primary hover:bg-transparent transition-all"
            >
              <Home size={16} />
              <span className="font-medium">Back to Home</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
