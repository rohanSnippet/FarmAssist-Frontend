import React from "react";

const Login = () => {
  return (
    <>
      <h3 className="text-lg font-bold">Login</h3>

      <input className="input input-bordered w-full mt-2" placeholder="Email" />
      <input
        className="input input-bordered w-full mt-2"
        type="password"
        placeholder="Password"
      />

      <p className="underline mt-4 cursor-pointer text-sm">
        Don’t have an account? Sign up
      </p>
    </>
  );
};

export default Login;
