import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
// import { useModal } from "../context/ModalContext"; // No longer needed

const ProtectedRoutes = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  // const { closeModal } = useModal(); // No longer needed

  // 1. Show a loading spinner while checking for tokens
  if (loading) {
    return <LoadingSpinner />;
  }

  // 2. Redirect to /login if not authenticated
  if (!isAuthenticated) {
    // Pass the current path in the state so Login component can redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Render the protected content if authenticated
  // closeModal(); // The modal logic is removed from here

  return children;
};

export default ProtectedRoutes;
