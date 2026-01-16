import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  getAuth,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { useToast } from "../ui/Toast";
import { Eye, EyeOff, Lock, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validCode, setValidCode] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const Toast = useToast();
  const auth = getAuth();

  const actionCode = searchParams.get("oobCode");

  // 1. Verify the code on load
  useEffect(() => {
    if (!actionCode) {
      setVerifying(false);
      return;
    }
    verifyPasswordResetCode(auth, actionCode)
      .then(() => {
        setValidCode(true);
        setVerifying(false);
      })
      .catch((error) => {
        console.error(error);
        setValidCode(false);
        setVerifying(false);
      });
  }, [actionCode, auth]);

  // 2. Handle Password Submit
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmPasswordReset(auth, actionCode, newPassword);
      setSuccess(true); // Switch to Success View
      Toast.fire({
        icon: "success",
        title: "Password reset successfully!",
      });
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: "error", title: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- VIEW: Verifying Link ---
  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200/50 p-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-base-content/60 font-medium animate-pulse">Verifying security link...</p>
      </div>
    );
  }

  // --- VIEW: Invalid/Expired Link ---
  if (!validCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200/50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card w-full max-w-sm bg-base-100 shadow-xl border border-base-200"
        >
          <div className="card-body items-center text-center">
             <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-error" />
             </div>
            <h2 className="card-title text-xl font-bold text-base-content">Link Expired</h2>
            <p className="text-base-content/60 mt-2 text-sm">
              This reset link is invalid or has expired.
            </p>
            <div className="card-actions justify-center mt-6 w-full">
              <Link to="/login" className="btn btn-outline w-full gap-2">
                <ArrowLeft className="w-4 h-4" /> Go to Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- VIEW: Success (Redirect to Login) ---
  if (success) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-base-200/50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card w-full max-w-sm bg-base-100 shadow-xl border border-base-200"
        >
          <div className="card-body items-center text-center">
             <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
             </div>
            <h2 className="card-title text-xl font-bold text-base-content">Success!</h2>
            <p className="text-base-content/60 mt-2 text-sm">
              Your password has been updated.
            </p>
            <div className="card-actions justify-center mt-6 w-full">
              {/* This is the only place the Login button appears now */}
              <Link to="/login" className="btn btn-primary w-full gap-2 text-primary-content shadow-lg shadow-primary/20">
                Login with New Password <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- VIEW: Reset Form ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200/50 p-4 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

       <div className="text-center mb-8 z-10">
          <h1 className="text-4xl font-bold tracking-tight text-base-content drop-shadow-sm">
            Farm<span className="text-primary text-glow">Assist</span>
          </h1>
       </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-sm bg-base-100/80 backdrop-blur-md shadow-2xl border border-base-content/5 z-10"
      >
        <div className="card-body">
          <div className="flex justify-center mb-2">
             <div className="p-3 bg-base-200 rounded-full">
               <KeyRound className="w-6 h-6 text-primary" />
             </div>
          </div>
          <h2 className="card-title justify-center text-xl mb-6">Set New Password</h2>
          
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="form-control">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-4 pr-10 bg-base-100 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                
                {/* FIX: Added 'z-10' to ensure button is clickable over the input focus ring */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-base-content/40 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
               <label className="label pb-0">
                <span className="label-text-alt text-base-content/50">Must be at least 6 characters</span>
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full shadow-lg shadow-primary/20 text-primary-content font-bold mt-2"
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : "Confirm Password"}
            </motion.button>
          </form>
          {/* Removed the 'Cancel & Back to Login' button here as requested */}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;