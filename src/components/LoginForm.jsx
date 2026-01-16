import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../ui/Toast";
import { motion } from "framer-motion";
import SocialAuthSection from "./SocialAuthSection";
import { useModal } from "../context/ModalContext";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

// --- INTERNAL COMPONENT: Forgot Password Modal ---
const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  const actionCodeSettings = {
    // 1. Point this to your new page
    // For local dev: 'http://localhost:5173/reset-password'
    // For production: 'https://your-domain.com/reset-password'
    url: `${import.meta.env.VITE_FRONTEND_URL}/reset-password`,
    handleCodeInApp: true,
  };

  const auth = getAuth(); // Or get this from your AuthContext if available

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setStatus({
        loading: false,
        error: "",
        success: "Reset link sent! Please check your inbox.",
      });
      // Optional: Close after 3 seconds on success
      setTimeout(onClose, 3000);
    } catch (error) {
      console.error(error);
      let msg = "Failed to send email.";
      if (error.code === "auth/user-not-found")
        msg = "No account found with this email.";
      setStatus({ loading: false, error: msg, success: "" });
    }
  };

  return (
    <div className="w-full max-w-sm">
      <p className="text-base-content/70 text-sm mb-4">
        Enter your email address and we'll send you a link to reset your
        password.
      </p>

      {status.success && (
        <div className="alert alert-success text-xs py-2 mb-3 shadow-sm">
          <span>{status.success}</span>
        </div>
      )}
      {status.error && (
        <div className="alert alert-error text-xs py-2 mb-3 shadow-sm">
          <span>{status.error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Enter your email"
          className="input input-bordered w-full focus:input-primary"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="modal-action flex justify-between items-center mt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`btn btn-primary btn-sm ${
              status.loading ? "loading" : ""
            }`}
            disabled={status.loading || status.success}
          >
            {status.loading ? "Sending..." : "Send Link"}
          </button>
        </div>
      </form>
    </div>
  );
};
// ------------------------------------------------

const LoginForm = ({ switchToSignup, onPhoneClick }) => {
  const { login, setLoading } = useAuth();
  const { openModal, closeModal } = useModal(); // Get closeModal to pass it down
  const Toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const success = await login(data.email, data.password);
      if (success) {
        Toast.fire({ icon: "success", title: "Logged in Successfully" });
        navigate(from, { replace: true });
      } else {
        Toast.fire({ icon: "error", title: "Invalid Credentials" });
      }
    } catch (err) {
      Toast.fire({ icon: "error", title: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  // Function to trigger the modal
  const handleForgotPassword = (e) => {
    e.preventDefault();
    openModal(
      // Pass closeModal so the internal Cancel button works
      <ForgotPasswordModal onClose={closeModal} />,
      { title: "Reset Password", className: "max-w-md" }
    );
  };

  return (
    <div className="w-full font-poppins">
      <h2 className="text-xl font-semibold text-center mb-6 text-base-content">
        Welcome Back 👋
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Input */}
        <div className="form-control">
          <input
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^\S+@\S+$/i, message: "Enter a valid email" },
            })}
            type="email"
            className={`input input-bordered w-full bg-base-200/50 focus:bg-base-100 focus:border-primary focus:shadow-[0_0_15px_rgba(var(--p),0.3)] transition-all duration-300 ${
              errors.email ? "input-error" : ""
            }`}
            placeholder="Email Address"
          />
          {errors.email && (
            <span className="text-error text-xs mt-1 ml-1">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password Input */}
        <div className="form-control">
          <div className="relative">
            <input
              {...register("password", {
                required: "Password required",
                minLength: { value: 6, message: "Min 6 chars" },
              })}
              type={showPassword ? "text" : "password"}
              className={`input input-bordered w-full bg-base-200/50 focus:bg-base-100 focus:border-primary focus:shadow-[0_0_15px_rgba(var(--p),0.3)] transition-all duration-300 pr-10 ${
                errors.password ? "input-error" : ""
              }`}
              placeholder="Password"
            />

            {/* FIX: Added 'z-10' to the button class below */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-base-content/60 hover:text-primary transition-colors"
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>

          {errors.password && (
            <span className="text-error text-xs mt-1 ml-1">
              {errors.password.message}
            </span>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="btn btn-primary w-full shadow-lg shadow-primary/30 mt-2 text-primary-content font-bold tracking-wide"
        >
          Sign In
        </motion.button>
      </form>

      <div className="text-right mt-1">
        <button
          onClick={handleForgotPassword}
          className="text-xs text-primary hover:underline hover:text-primary-focus transition-colors"
        >
          Forgot Password?
        </button>
      </div>

      {/* Social Auth Section */}
      <SocialAuthSection mode="login" onPhoneClick={onPhoneClick} />

      <p className="text-center mt-6 text-sm text-base-content/70">
        New here?{" "}
        <button
          type="button"
          className="link link-hover text-primary font-bold ml-1 transition-colors"
          onClick={switchToSignup}
        >
          Create Account
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
