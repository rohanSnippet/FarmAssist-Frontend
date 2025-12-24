import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Signup from "./Signup";
import { useToast } from "../ui/Toast";
import LoaderOverlay from "./LoadingSpinner";

const LoginForm = ({ switchToSignup }) => {
  const { login, setLoading } = useAuth(); // Ensure setLoading is available from context
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
      setLoading(true); // Start Loader
      const success = await login(data.email, data.password);

      if (success) {
        // ✅ FIX 1: Correct Message (was "Account Created")
        Toast.fire({
          icon: "success",
          title: "Logged in Successfully",
        });

        // ✅ FIX 2: Do NOT turn off loading here.
        // Let the loader stay on screen while navigating to avoid "flicker"
        setLoading(false);
        navigate(from, { replace: true });
      } else {
        // ✅ FIX 3: Handle Failure (was empty)
        setLoading(false); // Only turn off loader if we stay on this page
        Toast.fire({
          icon: "error",
          title: "Invalid Email or Password",
        });
      }
    } catch (err) {
      setLoading(false);
      Toast.fire({
        icon: "error",
        title: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto text-base-content p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Welcome Back 👋</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="form-control">
          <input
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Enter a valid email",
              },
            })}
            type="email"
            className={`input input-bordered w-full ${
              errors.email ? "input-error" : ""
            }`}
            placeholder="mail@site.com"
          />
          {errors.email && (
            <span className="text-error text-xs mt-1">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password */}
        <div className="form-control">
          <input
            {...register("password", {
              required: "Password required",
              minLength: { value: 6, message: "Minimum 6 characters" },
            })}
            type="password"
            className={`input input-bordered w-full ${
              errors.password ? "input-error" : ""
            }`}
            placeholder="••••••••"
          />
          {errors.password && (
            <span className="text-error text-xs mt-1">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Submit */}
        <button type="submit" className="btn btn-primary w-full shadow-md">
          Sign In
        </button>

        {/* Switch to Signup */}
        <p className="text-center mt-4 text-sm">
          Don't have an account?{" "}
          <button
            type="button" // Important to prevent form submission
            className="link link-hover text-primary font-semibold"
            onClick={switchToSignup}
          >
            Create Account
          </button>
        </p>

        <div className="divider text-sm">OR</div>

        <button type="button" className="btn btn-outline w-full">
          {/* You can add a Google Icon here later */}
          Continue with Google
        </button>
      </form>
    </div>
  );
};

// Wrapper Component
const LoginWrapper = () => {
  // Ensure 'loading' state is coming from the same context the form updates
  const { loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200 p-4">
      {loading && <LoaderOverlay />}

      <div className="card w-full max-w-sm bg-base-100 shadow-xl border border-base-200">
        <div className="card-body p-0 py-6">
          {isLogin ? (
            <LoginForm switchToSignup={() => setIsLogin(false)} />
          ) : (
            // Ensure Signup component also accepts 'switchToLogin' prop
            <Signup switchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginWrapper;
