import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUploadCloud, FiLink, FiImage, FiX, FiCheck } from "react-icons/fi";
import axios from "axios";
import { useToast } from "../../ui/Toast";

// --- CONFIGURATION ---
// TODO: Replace these with your actual Cloudinary values
const CLOUDINARY_CLOUD_NAME = "dvqz7gibd"; 
const CLOUDINARY_UPLOAD_PRESET = "FarmAssist"; 

const PhotoUpdateModal = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' or 'url'
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const Toast = useToast();

  // Handle File Selection
  const handleFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
      setFileToUpload(file);
      console.log("file to upload set ", file)
    } else {
      Toast.fire({ icon: "error", title: "Please select an image file." });
    }
  };

  // Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
      console.log("HandleFile", e.dataTransfer.files[0])
    }
  };

  // Upload Logic
  const handleConfirm = async () => {
    setUploading(true);
    try {
      let finalUrl = urlInput;
         console.log("finalUrl ",finalUrl)
      // 1. If File: Upload to Cloudinary
      if (activeTab === "upload" && fileToUpload) {
        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        // formData.append("api_key", "947885949943549"); // Optional for unsigned

        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );
        finalUrl = res.data.secure_url;
        console.log(res.data)
      } 
      // 2. If URL: Validate it roughly
      else if (activeTab === "url" && !urlInput) {
        throw new Error("Please enter a valid URL");
      }

      // 3. Save to Backend
      await onSave(finalUrl);
      onClose();
      setPreview(null);
      setFileToUpload(null);
      setUrlInput("");
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: "error", title: "Upload failed. Check Cloudinary settings." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-base-100 shadow-2xl ring-1 ring-base-content/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-base-200 bg-base-200/50 p-4 px-6">
              <h3 className="text-lg font-bold">Update Profile Photo</h3>
              <button onClick={onClose} className="btn btn-circle btn-ghost btn-sm">
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed m-4 bg-base-200">
              <a
                className={`tab w-1/2 ${activeTab === "upload" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("upload")}
              >
                <FiUploadCloud className="mr-2" /> Upload
              </a>
              <a
                className={`tab w-1/2 ${activeTab === "url" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("url")}
              >
                <FiLink className="mr-2" /> URL
              </a>
            </div>

            {/* Body */}
            <div className="p-6 pt-0">
              {activeTab === "upload" ? (
                <div
                  className={`relative flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                    dragActive
                      ? "border-primary bg-primary/10"
                      : "border-base-content/20 hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-center pointer-events-none">
                      <FiImage className="mx-auto mb-2 text-3xl opacity-50" />
                      <p className="text-sm font-medium">Drag & Drop image here</p>
                      <p className="text-xs opacity-50">or click to browse</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile(e.target.files[0])}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              ) : (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Image URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.png"
                    className="input input-bordered w-full"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setPreview(e.target.value);
                    }}
                  />
                  {preview && (
                    <div className="mt-4 flex justify-center rounded-xl bg-base-200 p-2">
                      <img
                        src={preview}
                        alt="Preview"
                        className="h-32 object-contain"
                        onError={() => setPreview(null)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-base-200 bg-base-100 p-4">
              <button onClick={onClose} className="btn btn-ghost" disabled={uploading}>
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={(!fileToUpload && !urlInput) || uploading}
                className="btn btn-primary gap-2"
              >
                {uploading ? (
                  <span className="loading loading-spinner" />
                ) : (
                  <FiCheck />
                )}
                Save Photo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PhotoUpdateModal;