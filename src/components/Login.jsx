import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

const Login = () => {
  const { login } = useAuth();
  const { closeModal } = useModal();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    // simulate backend login
    login({ email: data.email });
    closeModal();
  };

  return (
    <div className="w-full max-w-sm mx-auto text-base-content">
      <h2 className="text-2xl font-bold text-center mb-6">Welcome Back 👋</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        {/*   <div>
          <label className="label">
            <span className="label-text">Name</span>
          </label>
          <input
            {...register("name", { required: "Name is required" })}
            className="input input-bordered w-full"
            placeholder="Enter your name"
          />
          {errors.name && (
            <p className="text-error text-sm mt-1">{errors.name.message}</p>
          )}
        </div> */}

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
        <div>
          <label className="input validator">
            <svg
              className="h-[1em] opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </g>
            </svg>
            <input type="email" placeholder="mail@site.com" required />
          </label>
          <div className="validator-hint hidden">Enter valid email address</div>
        </div>

        {/* Password */}
        <div>
          <label className="label">
            <span className="label-text">Password</span>
          </label>
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

export default Login;
