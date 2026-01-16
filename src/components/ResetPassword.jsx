import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getAuth,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { useToast } from "../ui/Toast";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validCode, setValidCode] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const Toast = useToast();
  const auth = getAuth();

  // The code is in the URL query parameter 'oobCode'
  const actionCode = searchParams.get("oobCode");

  // 1. Verify the code on load
  useEffect(() => {
    if (!actionCode) {
      setVerifying(false);
      return;
    }
    verifyPasswordResetCode(auth, actionCode)
      .then((email) => {
        setValidCode(true);
        setVerifying(false);
      })
      .catch((error) => {
        console.error(error);
        setValidCode(false);
        setVerifying(false);
        Toast.fire({ icon: "error", title: "Invalid or expired reset link." });
      });
  }, [actionCode, auth]);

  // 2. Handle Password Submit
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmPasswordReset(auth, actionCode, newPassword);
      Toast.fire({
        icon: "success",
        title: "Password reset successfully! Please login.",
      });
      navigate("/login");
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: "error", title: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (verifying)
    return <div className="text-center mt-10">Verifying link...</div>;
  if (!validCode)
    return (
      <div className="text-center mt-10 text-error">
        Invalid or expired link.
      </div>
    );

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="card w-96 shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] bg-base-100/70 backdrop-blur-md border border-base-content/10">
        <div className="card-body">
          <h2 className="card-title justify-center mb-4">Set New Password</h2>
          <form onSubmit={handleReset}>
            <div className="form-control w-full">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-base-content/60 hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="btn btn-primary w-full shadow-lg shadow-primary/30 mt-2 text-primary-content font-bold tracking-wide"
            >
              Reset Password
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
