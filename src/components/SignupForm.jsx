import React from "react";
import api from "./../axios";
import { useForm } from "react-hook-form";
import { useToast } from "../ui/Toast";
import { motion } from "framer-motion";
import { t } from "i18next";

const SignupForm = ({ switchToLogin }) => {
  const Toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await api.post(`/api/register/`, data);
      Toast.fire({ icon: "success", title: t("Common.toasts.signup_success") });
      setTimeout(() => switchToLogin(), 1000);
    } catch (err) {
      const backendError = err.response?.data;
      if (backendError?.email) {
        Toast.fire({ icon: "error", title: t("Common.toasts.account_exists") });
      } else {
        Toast.fire({ icon: "error", title: t("Common.toasts.signup_failure") });
      }
    }
  };

  return (
    <div className="w-full font-poppins">
      <h2 className="text-xl poppins-semibold text-center mb-6 text-base-content">
        Create Account
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
      </form>
    </div>
  );
};

export default SignupForm;
