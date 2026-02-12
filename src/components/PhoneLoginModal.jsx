import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const PhoneLoginModal = ({ isOpen, onClose, mode }) => {
  const { sendPhoneOtp, verifyPhoneOtp, setupRecaptcha } = useAuth();
  const { t } = useTranslation();
  
  const [step, setStep] = useState("PHONE"); // PHONE | OTP
  const [confirmObj, setConfirmObj] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("PHONE");
      setConfirmObj(null);
      reset();
    } else {
      // Initialize invisible recaptcha when modal opens
      setTimeout(() => setupRecaptcha("recaptcha-modal-container"), 500);
    }
  }, [isOpen, reset, setupRecaptcha]);

  const onSendOtp = async (data) => {
    setIsSending(true);
    // Ensure country code is present (Simple fix for India)
    const formattedPhone = data.phone.startsWith("+")
      ? data.phone
      : `+91${data.phone}`;

    const result = await sendPhoneOtp(formattedPhone);
    setIsSending(false);

    if (result) {
      setConfirmObj(result);
      setStep("OTP");
    }
  };

  const onVerifyOtp = async (data) => {
    setIsSending(true);
    const success = await verifyPhoneOtp(confirmObj, data.otp, mode);
    setIsSending(false);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="card w-full max-w-sm bg-base-100 shadow-2xl overflow-hidden"
      >
        <div className="card-body p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">
              {step === "PHONE" ? t("PhoneLoginModal.title_phone") : t("PhoneLoginModal.title_otp")}
            </h3>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-xs btn-circle"
            >
              <X size={18} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit(step === "PHONE" ? onSendOtp : onVerifyOtp)}
            className="space-y-4"
          >
            <AnimatePresence mode="wait">
              {step === "PHONE" ? (
                <motion.div
                  key="phone-step"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                >
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">{t("PhoneLoginModal.mobile_label")}</span>
                    </label>
                    <input
                      {...register("phone", {
                        required: t("PhoneLoginModal.phone_required"),
                        pattern: {
                          value: /^[0-9+]{10,13}$/,
                          message: t("PhoneLoginModal.phone_invalid"),
                        },
                      })}
                      type="tel"
                      placeholder={t("PhoneLoginModal.mobile_placeholder")}
                      className={`input input-bordered w-full ${
                        errors.phone ? "input-error" : ""
                      }`}
                    />
                    {errors.phone && (
                      <span className="text-error text-xs mt-1">
                        {errors.phone.message}
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="otp-step"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                >
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text"> {t("PhoneLoginModal.otp_label")}</span>
                    </label>
                    <input
                      {...register("otp", {
                        required: t("PhoneLoginModal.otp_required"),
                        minLength: { value: 6, message: t("PhoneLoginModal.otp_length"), },
                      })}
                      type="text"
                      placeholder={t("PhoneLoginModal.otp_placeholder")}
                      className="input input-bordered w-full tracking-widest text-center text-lg"
                    />
                    {errors.otp && (
                      <span className="text-error text-xs mt-1">
                        {errors.otp.message}
                      </span>
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <button
                      type="button"
                      onClick={() => setStep("PHONE")}
                      className="link link-hover text-xs text-base-content/60"
                    >
                       {t("PhoneLoginModal.change_phone")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recaptcha Container - Must exist in DOM */}
            <div id="recaptcha-modal-container"></div>

            <button
              type="submit"
              disabled={isSending}
              className="btn btn-primary w-full mt-2"
            >
              {isSending ? (
                <span className="loading loading-spinner"></span>
              ) : step === "PHONE" ? (
                <>
                  {t("PhoneLoginModal.send_code")} <ArrowRight size={16} />
                </>
              ) : (
                <>
                  {t("PhoneLoginModal.verify_login")} <CheckCircle size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default PhoneLoginModal;
