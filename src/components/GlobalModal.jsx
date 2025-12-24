// src/components/GlobalModal.jsx
import React from "react";
import { useModal } from "../context/ModalContext";

const GlobalModal = () => {
  const { modalRef, content, modalOptions, closeModal } = useModal();

  return (
    <dialog ref={modalRef} className="modal backdrop-blur-sm">
      {/* Dynamic classes allow you to pass 'max-w-5xl' for the language map */}
      <div className={`modal-box ${modalOptions.className || ""} relative`}>
        {/* Close Button */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
          onClick={(e) => {
            // Fixed: added 'e' here
            e.preventDefault();
            closeModal();
          }}
        >
          ✕
        </button>

        {/* Dynamic content */}
        <div className="mt-4">{content}</div>
      </div>

      {/* Backdrop click to close (standard DaisyUI behavior) */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => closeModal()}>close</button>
      </form>
    </dialog>
  );
};

export default GlobalModal;
