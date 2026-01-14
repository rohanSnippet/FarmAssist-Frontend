import React from "react";
import api from "./../axios";
import { useForm } from "react-hook-form";
import { useToast } from "../ui/Toast";
import { motion } from "framer-motion";
import SocialAuthSection from "./SocialAuthSection"; // Import this
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { createUserWithEmailAndPassword, updateProfile} from "firebase/auth";
import { auth } from "../firebase";

const SignupForm = ({ switchToLogin, onPhoneClick }) => {
  const Toast = useToast();
  const { loading, setLoading} = useAuth();
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
    
    console.log(firebaseResult.user)
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

        <div>
          <input
            {...register("password", {
              required: "Password required",
              minLength: { value: 6, message: "Min 6 chars" },
            })}
            type="password"
            className="input input-bordered w-full bg-base-200/50 focus:bg-base-100 focus:border-primary focus:shadow-[0_0_15px_rgba(var(--p),0.3)] transition-all"
            placeholder="Password"
          />
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
