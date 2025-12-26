import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Phone } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../ui/Toast";

// You might need a Google Icon.
// If you don't have one, use text or import FaGoogle from react-icons/fa
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-.19-.58z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const SocialAuthSection = ({ mode, onPhoneClick }) => {
  const { googleLogin } = useAuth();
  const Toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const from = location.state?.from?.pathname || "/";

  const handleGoogle = async () => {
    // Mode is passed from parent ('login' or 'signup')
    await googleLogin(mode)
      .then((success) => {
        if (success) {
          console.log(success);
          navigate(from, { replace: true });
        }
      })
      .catch((error) => {
        Toast.fire({
          icon: "error",
          title: error.message || t("auth.socialAuth.googleError"),
        });
      });
  };

  return (
    <div className="flex flex-col gap-3 mt-6">
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-base-content/20"></div>
        <span className="flex-shrink-0 mx-4 text-xs font-medium text-base-content/50 uppercase tracking-widest">
          Or continue with
        </span>
        <div className="flex-grow border-t border-base-content/20"></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handleGoogle}
          className="btn btn-outline border-base-content/20 hover:bg-base-content hover:text-base-100 normal-case font-medium"
        >
          <GoogleIcon /> <span className="ml-2">Google</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onPhoneClick}
          className="btn btn-outline border-base-content/20 hover:bg-base-content hover:text-base-100 normal-case font-medium"
        >
          <Phone size={18} /> <span className="ml-2">Phone</span>
        </motion.button>
      </div>
    </div>
  );
};

export default SocialAuthSection;
