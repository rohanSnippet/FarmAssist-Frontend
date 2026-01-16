// src/components/GlobalModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../context/ModalContext";

const GlobalModal = () => {
  const { content, modalOptions, closeModal } = useModal();

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: -50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    },
    exit: { opacity: 0, y: 20, scale: 0.95 }
  };

  return (
    <AnimatePresence>
      {content && (
        <motion.div
          className="modal modal-open modal-bottom sm:modal-middle backdrop-blur-sm"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
        >
          {/* Modal Box */}
          <motion.div 
            className={`modal-box relative ${modalOptions.className || ""}`}
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()} // Prevent click bubbling to backdrop
          >
            {/* Close Button */}
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-20"
              onClick={closeModal}
            >
              ✕
            </button>

            {/* Title */}
            {modalOptions.title && (
              <h3 className="font-bold text-lg mb-4">{modalOptions.title}</h3>
            )}

            {/* Content */}
            <div className="mt-2">{content}</div>
          </motion.div>

          {/* Backdrop Click Area (DaisyUI structure) */}
          <div className="modal-backdrop" onClick={closeModal}>
            <button className="cursor-default">close</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalModal;