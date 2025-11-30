import React from "react";

const Signup = () => {
  return (
    <>
      <h3 className="text-lg font-bold">Create Account</h3>

      <input className="input input-bordered w-full mt-2" placeholder="Name" />
      <input className="input input-bordered w-full mt-2" placeholder="Email" />
      <input
        className="input input-bordered w-full mt-2"
        type="password"
        placeholder="Password"
      />

      <p className="underline mt-4 cursor-pointer text-sm">
        Already have an account? Login
      </p>
    </>
  );
};

export default Signup;
