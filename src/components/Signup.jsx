import api from "./../axios";
import React from "react";
import { useForm } from "react-hook-form";

const Signup = ({ switchToLogin }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      // 1. Call the API (await the Promise)
      const res = await api.post(`/api/register/`, data);
      console.log(res);
      if (res.status != 201) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          errorData = { message: `Server error with status: ${res.status}` };
        }
        throw new Error(
          errorData.message || "Registration failed on the server."
        );
      }

      const resData = await res.json();
      console.log("Signup data:", resData);

      // 4. Handle successful signup
      alert("Account created successfully! Please log in.");
      switchToLogin();
    } catch (error) {
      console.error("Signup error:", error.message);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto text-base-content p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Create Account 📝</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <input
            {...register("name", { required: "Name is required" })}
            className="input input-bordered w-full"
            placeholder="Name"
          />
          {errors.name && (
            <p className="text-error text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

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
            placeholder="Email"
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
            placeholder="Password"
          />
          {errors.password && (
            <p className="text-error text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button type="submit" className="btn btn-primary w-full">
          Sign Up
        </button>

        {/* Switch to Login */}
        <p className="text-center mt-4 text-sm">
          Already have an account?{" "}
          <span
            className="link link-hover text-primary"
            onClick={switchToLogin}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default Signup;
