import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

const ProtectedRoutes = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // 1. Show a loading spinner while checking for tokens
  if (loading) {
    return <LoadingSpinner content="Getting There..." />;
  }

  // 2. Redirect to /login if not authenticated
  if (!isAuthenticated) {
    // Pass the current path in the state so Login component can redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoutes;
