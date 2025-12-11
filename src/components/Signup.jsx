import api from "./../axios";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "../ui/Toast";

const Signup = ({ switchToLogin }) => {
  const Toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await api.post(`/api/register/`, data);

      console.log("Signup success:", res.data);

      Toast.fire({
        icon: "success",
        title: "Account Created Successfully",
      });
      setTimeout(() => {
        switchToLogin();
      }, 1000);
    } catch (err) {
      // Axios stores backend errors here:
      const backendError = err.response?.data;
      if (backendError?.email) {
        Toast.fire({
          icon: "error",
          title: "Account Already Exists!!",
        });
      } else {
        Toast.fire({
          icon: "error",
          title: "Network Error!!",
        });
      }
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto text-base-content p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Create Account 📝</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <input
            {...register("first_name", { required: "First Name is required" })}
            className="input input-bordered w-full"
            placeholder="First Name"
          />
          {errors.name && (
            <p className="text-error text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
        {/* Last Name */}
        <div>
          <input
            {...register("last_name")}
            className="input input-bordered w-full"
            placeholder="Last Name"
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
