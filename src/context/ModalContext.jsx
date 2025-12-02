import { createContext, useContext, useRef, useState } from "react";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const modalRef = useRef(null);
  const [content, setContent] = useState(null);
  //   const contentRef = useRef(null);

  const openModal = (component) => {
    // contentRef.current = component;
    setContent(component);
    modalRef.current?.showModal();
  };

  const closeModal = () => {
    modalRef.current?.close();
    setContent(null);
  };

  return (
    <ModalContext.Provider value={{ openModal, modalRef, content, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
