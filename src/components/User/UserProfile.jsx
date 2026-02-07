import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // For Back to Home
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import api from "../../axios";
import { useToast } from "../../ui/Toast";
import { 
  FiEdit2, 
  FiSave, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCamera, 
  FiRefreshCw, 
  FiArrowLeft,
  FiCalendar,
  FiShield
} from "react-icons/fi";
import { updateProfile } from "firebase/auth";
import PhotoUpdateModal from "./PhotoUploadModal";
import { useTheme } from "../../context/ThemeContext";

const UserProfile = () => {
  const { userData, loadUser, auth } = useAuth();
  const {isDark} = useTheme();
  const Toast = useToast();

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    photo_url: "",
  });

  // Sync state with context data
  useEffect(() => {
    const data = userData || auth;
    if (data) {
      setFormData({
        first_name: data.first_name || data.displayName?.split(" ")[0] || "",
        last_name: data.last_name || data.displayName?.split(" ").slice(1).join(" ") || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        photo_url: data.photo_url || auth?.currentUser?.photoURL || "",
      });
    }
  }, [userData, auth]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    if(e) e.preventDefault();
    setLoading(true);

    try {
      await api.patch("/api/me/", {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        photo_url: formData.photo_url,
      });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: `${formData.first_name} ${formData.last_name}`.trim(),
          photoURL: formData.photo_url,
        });
      }

      Toast.fire({ icon: "success", title: "Profile updated successfully!" });
      loadUser(); 
    } catch (error) {
      console.error(error);
      Toast.fire({
        icon: "error",
        title: error.response?.data?.detail || "Failed to update profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpdate = async (newUrl) => {
    setFormData((prev) => ({ ...prev, photo_url: newUrl }));
    const updatedData = { ...formData, photo_url: newUrl };
    
    try {
      await api.patch("/api/me/", { photo_url: newUrl });
       if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: newUrl });
      }
      Toast.fire({ icon: "success", title: "Photo updated!" });
      loadUser();
    } catch (error) {
       Toast.fire({ icon: "error", title: "Failed to save photo URL." });
    }
  };

  // --- ANIMATIONS ---
  const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.98 }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };
 console.log(formData.photo_url)
  return (
    <div className="min-h-screen w-full bg-base-200 relative overflow-hidden flex items-center justify-center p-4 md:p-8">
      
      {/* 1. Dynamic Background Blobs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* 2. Main Glass Container */}
      <motion.div 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="relative w-full max-w-4xl bg-base-100/60 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 overflow-hidden"
      >
        {/* --- Header Section (Cover + Nav) --- */}
        <div className="relative h-48 bg-gradient-to-r from-primary to-primary-focus overflow-hidden">
          {/* Decorative Pattern Overlay */}
          <div className="absolute inset-0 opacity-10" 
               style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>
          
          {/* Back Button */}
          <div className="absolute top-6 left-6 z-10">
            <Link 
              to="/" 
              className="btn btn-circle btn-sm md:btn-md bg-base-100/20 hover:bg-base-100/40 border-0 text-white backdrop-blur-md shadow-lg group"
            >
              <FiArrowLeft className="text-lg group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className={`${isDark ? 'text-primary':'text-secondary'} absolute bottom-4 right-6 text-xs font-bold uppercase tracking-widest hidden md:block`}>
            FarmAssist Profile
          </div>
        </div>

        {/* --- Profile Body --- */}
        <div className="px-6 md:px-12 pb-12 relative">
          
          {/* Floating Profile Picture */}
          <div className="relative -mt-20 mb-6 flex flex-col md:flex-row items-end md:items-end gap-6">
            <div className="relative group">
              <div className="avatar placeholder ring-4 ring-base-100 rounded-full bg-base-100 p-1 shadow-2xl">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden relative bg-base-200">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="Profile" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <span className="text-5xl font-bold text-base-content/30 flex items-center justify-center h-full w-full">
                      {formData.first_name?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                  
                  {/* Photo Edit Overlay */}
                  <div 
                    onClick={() => setIsModalOpen(true)}
                    className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm rounded-full"
                  >
                    <FiCamera className="text-white text-3xl mb-1 drop-shadow-md" />
                    <span className="text-white text-xs font-bold uppercase tracking-wider drop-shadow-md">Update</span>
                  </div>
                </div>
              </div>
              
              {/* Mobile Edit Fab */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="absolute bottom-2 right-2 btn btn-circle btn-sm btn-primary md:hidden shadow-lg border-2 border-base-100"
              >
                <FiEdit2 className="text-white" />
              </button>
            </div>

            {/* Name & Quick Stats */}
            <div className="flex-1 pb-2 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-base-content">
                {formData.first_name} <span className="text-primary">{formData.last_name}</span>
              </h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-sm text-base-content/60 font-medium">
                <span className="flex items-center gap-1 bg-base-200 px-3 py-1 rounded-full">
                  <FiShield className="text-primary" /> 
                  {userData?.auth_providers?.[0] || "Email"} User
                </span>
                <span className="flex items-center gap-1 bg-base-200 px-3 py-1 rounded-full">
                  <FiCalendar /> 
                  Joined {new Date(userData?.date_joined || Date.now()).getFullYear()}
                </span>
              </div>
            </div>

            {/* Refresh Button */}
             <motion.button 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
                onClick={loadUser}
                className="btn btn-ghost btn-circle text-base-content/50 hover:text-primary hidden md:flex"
                title="Refresh Data"
              >
                <FiRefreshCw className="text-xl" />
              </motion.button>
          </div>

          {/* --- The Form --- */}
          <motion.form 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleSave} 
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-8"
          >
            {/* First Name */}
            <motion.div variants={itemVariants} className="form-control">
              <label className="label pb-1">
                <span className="label-text font-bold text-base-content/70 flex items-center gap-2">
                  <FiUser className="text-primary" /> First Name
                </span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="input input-lg input-bordered bg-base-200/40 focus:bg-base-100 focus:input-primary transition-all font-medium"
                placeholder="Enter first name"
              />
            </motion.div>

            {/* Last Name */}
            <motion.div variants={itemVariants} className="form-control">
              <label className="label pb-1">
                <span className="label-text font-bold text-base-content/70 flex items-center gap-2">
                  <FiUser className="text-primary" /> Last Name
                </span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="input input-lg input-bordered bg-base-200/40 focus:bg-base-100 focus:input-primary transition-all font-medium"
                placeholder="Enter last name"
              />
            </motion.div>

            {/* Email (Read Only) */}
            <motion.div variants={itemVariants} className="form-control md:col-span-2">
              <label className="label pb-1">
                <span className="label-text font-bold text-base-content/70 flex items-center gap-2">
                  <FiMail className="text-primary" /> Email Address
                </span>
                <span className="badge badge-warning badge-outline badge-sm">Read Only</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="input input-lg input-bordered w-full bg-base-200/70 text-base-content/50 cursor-not-allowed font-medium pl-12"
                />
                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/30 text-xl" />
              </div>
            </motion.div>

            {/* Phone Number */}
            <motion.div variants={itemVariants} className="form-control md:col-span-2">
              <label className="label pb-1">
                <span className="label-text font-bold text-base-content/70 flex items-center gap-2">
                  <FiPhone className="text-primary" /> Phone Number
                </span>
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="input input-lg input-bordered bg-base-200/40 focus:bg-base-100 focus:input-primary transition-all font-medium"
                placeholder="+91 98765 43210"
              />
            </motion.div>

            {/* Action Bar */}
            <motion.div variants={itemVariants} className="md:col-span-2 mt-6 flex items-center justify-end gap-4 border-t border-base-content/10 pt-6">
              <button 
                type="button" 
                onClick={() => loadUser()} 
                className="btn btn-ghost hover:bg-base-200"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary px-8 btn-md md:btn-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
              >
                {loading ? <span className="loading loading-spinner" /> : <FiSave className="text-lg" />}
                Save Changes
              </button>
            </motion.div>

          </motion.form>
        </div>
      </motion.div>

      {/* Modal - Kept separate to avoid z-index issues */}
      <PhotoUpdateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handlePhotoUpdate} 
      />
    </div>
  );
};

export default UserProfile;