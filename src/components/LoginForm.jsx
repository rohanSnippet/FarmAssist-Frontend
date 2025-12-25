import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../ui/Toast";
import { motion } from "framer-motion";

const LoginForm = ({ switchToSignup }) => {
  const { login, setLoading } = useAuth();
  const Toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

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
        setLoading(false);
        navigate(from, { replace: true });
      } else {
        setLoading(false);
        Toast.fire({ icon: "error", title: "Invalid Credentials" });
      }
    } catch (err) {
      setLoading(false);
      Toast.fire({ icon: "error", title: "Something went wrong." });
    }
  };

  return (
    <div className="w-full font-poppins">
      <h2 className="text-xl font-semibold text-center mb-6 text-base-content">
        Welcome Back 👋
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="form-control">
          <input
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^\S+@\S+$/i, message: "Enter a valid email" },
            })}
            type="email"
            // Use focus:shadow-primary to create a glow effect matching the theme color
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

        {/* Password */}
        <div className="form-control">
          <input
            {...register("password", {
              required: "Password required",
              minLength: { value: 6, message: "Min 6 chars" },
            })}
            type="password"
            className={`input input-bordered w-full bg-base-200/50 focus:bg-base-100 focus:border-primary focus:shadow-[0_0_15px_rgba(var(--p),0.3)] transition-all duration-300 ${
              errors.password ? "input-error" : ""
            }`}
            placeholder="Password"
          />
          {errors.password && (
            <span className="text-error text-xs mt-1 ml-1">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          // 'btn-primary' automatically adapts to Forest (green), Coffee (brown), Dracula (pink/purple)
          className="btn btn-primary w-full shadow-lg shadow-primary/30 mt-2 text-primary-content font-bold tracking-wide"
        >
          Sign In
        </motion.button>

        {/* Switch */}
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
      </form>
    </div>
  );
};

export default LoginForm;
