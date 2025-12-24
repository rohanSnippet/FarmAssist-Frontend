import React, { createContext, useContext, useRef, useState } from "react";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const modalRef = useRef(null);
  const [content, setContent] = useState(null);
  const [modalOptions, setModalOptions] = useState({});

  const openModal = (component, options = {}) => {
    setContent(component);
    setModalOptions(options);
    modalRef.current?.showModal();
  };

  const closeModal = () => {
    modalRef.current?.close();
    setTimeout(() => {
      setContent(null);
      setModalOptions({});
    }, 200);
  };

  return (
    <ModalContext.Provider
      value={{ openModal, modalRef, content, modalOptions, closeModal }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
