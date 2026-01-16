import React, { useState } from "react";
import api from "./../axios";
import { useForm } from "react-hook-form";
import { useToast } from "../ui/Toast";
import { motion } from "framer-motion";
import SocialAuthSection from "./SocialAuthSection"; // Import this
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";

const SignupForm = ({ switchToLogin, onPhoneClick }) => {
  const [showPassword, setShowPassword] = useState(false);
  const Toast = useToast();
  const { loading, setLoading } = useAuth();
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (formData) => {
    setLoading(true);

    try {
      const response = await api.post("/api/register/", formData);

      console.log("Backend user created:", response.data);

      const firebaseResult = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await updateProfile(firebaseResult.user, {
        displayName: `${formData.firstName} ${formData.lastName || ""}`,
      });

      console.log(firebaseResult.user);
      Toast.fire({
        icon: "success",
        title: "Account created successfully",
      });

      setTimeout(() => switchToLogin(), 1000);
    } catch (err) {
      // Handle backend errors
      if (err.response) {
        const status = err.response.status;
        Toast.fire({
          icon: "error",
          title:
            status === 409
              ? "Account already exists"
              : status >= 500
              ? "Server error. Try later"
              : err.response.data?.error || "Signup failed",
        });
        return;
      }

      // Handle Firebase errors
      if (err.code) {
        const firebaseErrors = {
          "auth/email-already-in-use": "Email already registered",
          "auth/invalid-email": "Invalid email address",
          "auth/weak-password": "Password is too weak",
        };
        Toast.fire({
          icon: "error",
          title: firebaseErrors[err.code] || "Signup failed",
        });
        return;
      }

      Toast.fire({ icon: "error", title: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  /*   const onSubmit = async (data) => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const token = await result.user.getIdToken();
      // await api.post(`/api/register/`, data);
      await handleBackendFirebase(token, "signup");
      Toast.fire({ icon: "success", title: t("Common.toasts.signup_success") }); // Hardcoded for simplicity or use t()
      setTimeout(() => switchToLogin(), 1000);
    } catch (err) {
      // ... (Keep existing error handling)
      const backendError = err.response?.data;
      if (backendError?.email) {
        Toast.fire({ icon: "error", title: "Account already exists" });
      } else {
        Toast.fire({ icon: "error", title: "Signup Failed" });
      }
    } finally {
      setLoading(false);
    }
  }; */

  return (
    <div className="w-full font-poppins">
      <h2 className="text-xl font-semibold text-center mb-6 text-base-content">
        Create Account
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* ... (Keep First/Last Name Inputs) ... */}
        <div className="flex gap-3">
          <div className="w-1/2">
            <input
              {...register("first_name", { required: "Required" })}
              className="input input-bordered w-full bg-base-200/50 focus:bg-base-100 focus:border-primary focus:shadow-[0_0_15px_rgba(var(--p),0.3)] transition-all"
              placeholder="First Name"
            />
          </div>
          <div className="w-1/2">
            <input
              {...register("last_name")}
              className="input input-bordered w-full bg-base-200/50 focus:bg-base-100 focus:border-primary focus:shadow-[0_0_15px_rgba(var(--p),0.3)] transition-all"
              placeholder="Last Name"
            />
          </div>
        </div>

        {/* ... (Keep Email/Pass Inputs) ... */}
        <div>
          <input
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
            })}
            type="email"
            className="input input-bordered w-full bg-base-200/50 focus:bg-base-100 focus:border-primary focus:shadow-[0_0_15px_rgba(var(--p),0.3)] transition-all"
            placeholder="Email Address"
          />
        </div>

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

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="btn btn-primary w-full shadow-lg shadow-primary/30 mt-2 text-primary-content font-bold tracking-wide"
        >
          Sign Up
        </motion.button>
      </form>

      {/* NEW: Social Auth Section */}
      <SocialAuthSection mode="signup" onPhoneClick={onPhoneClick} />

      <p className="text-center mt-6 text-sm text-base-content/70">
        Already have an account?{" "}
        <button
          type="button"
          className="link link-hover text-primary font-bold ml-1 transition-colors"
          onClick={switchToLogin}
        >
          Login Here
        </button>
      </p>
    </div>
  );
};

export default SignupForm;
