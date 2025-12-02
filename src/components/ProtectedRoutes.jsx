import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useEffect, useRef } from "react";
import Login from "./Login";
import authBg from "../assets/gifs/authBg2.mp4";
import LoadingSpinner from "./LoadingSpinner";

const ProtectedRoutes = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { openModal, closeModal, loading } = useModal();
  // const openedOnce = useRef(false);
  const location = useLocation();
  const from = location?.state?.path || "/";

  useEffect(() => {
    if (!isAuthenticated) {
      openModal(<Login />);
      // openedOnce.current = true;
    }
    if (isAuthenticated) {
      closeModal();
    }
  }, [isAuthenticated]);

  if (loading) {
    return <LoadingSpinner />;
  }
  if (!isAuthenticated) {
    return <div className="h-screen flex justify-center items-center"> </div>;
  }

  return children;
};

export default ProtectedRoutes;
