import React, { createContext, useContext, useState } from "react";
import GlobalModal from "../components/GlobalModal";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [content, setContent] = useState(null);
  const [modalOptions, setModalOptions] = useState({});

  const openModal = (component, options = {}) => {
    setContent(component);
    setModalOptions(options);
  };

  const closeModal = () => {
    setContent(null);
    setModalOptions({});
  };

  return (
    <ModalContext.Provider
      value={{ openModal, closeModal, content, modalOptions }}
    >
      {children}
      <GlobalModal />
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);