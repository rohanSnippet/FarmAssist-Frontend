import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
// import { useModal } from "../context/ModalContext"; // No longer used for main login
import { useState } from "react";
import Signup from "./Signup";

const LoginForm = ({ switchToSignup }) => {
  const { login } = useAuth();
  // const { closeModal } = useModal(); // No longer used for main login
  const navigate = useNavigate();
  const location = useLocation();

  // Get the path the user was trying to access, default to home
  const from = location.state?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const success = await login(data.email, data.password);

    if (success) {
      // closeModal(); // Close modal if used, but for redirection, navigate is key
      navigate(from, { replace: true }); // Redirect back to the requested page
    } else {
      // Handle login error (e.g., show toast/message)
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto text-base-content p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Welcome Back 👋</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <input
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Enter a valid email",
              },
            })}
            type="email"
            className="input input-bordered w-full"
            placeholder="mail@site.com"
          />
          {errors.email && (
            <p className="text-error text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <input
            {...register("password", {
              required: "Password required",
              minLength: { value: 6, message: "Minimum 6 characters" },
            })}
            type="password"
            className="input input-bordered w-full"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-error text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button type="submit" className="btn btn-primary w-full">
          Sign In
        </button>

        {/* Switch to Signup */}
        <p className="text-center mt-4 text-sm">
          Don't have an account?{" "}
          <span
            className="link link-hover text-primary"
            onClick={switchToSignup}
          >
            Create Account
          </span>
        </p>

        {/* Divider */}
        <div className="divider text-sm">OR</div>

        {/* Google Sign-in Placeholder */}
        <button type="button" className="btn btn-outline w-full">
          Continue with Google
        </button>
      </form>
    </div>
  );
};

// New wrapper component to handle the Login/Signup switch
const LoginWrapper = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          {isLogin ? (
            <LoginForm switchToSignup={() => setIsLogin(false)} />
          ) : (
            <Signup switchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginWrapper;
