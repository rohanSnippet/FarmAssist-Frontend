import { useModal } from "../context/ModalContext";

const GlobalModal = () => {
  const { modalRef, content, closeModal } = useModal();

  return (
    <dialog ref={modalRef} className="modal">
      <div className="modal-box">
        <form method="dialog">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => {
              e.preventDefault();
              closeModal();
            }}
          >
            ✕
          </button>
        </form>

        {/* Dynamic content */}
        {content}
      </div>
    </dialog>
  );
};

export default GlobalModal;
