import React, { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import RootLayout from "./layout/RootLayout.jsx";
import Home from "./pages/Home.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoutes from "./components/ProtectedRoutes";
import { ModalProvider } from "./context/ModalContext";
import GlobalModal from "./components/GlobalModal";
import CropRecommendationForm from "./pages/CropRecommendationForm";
import AuthPage from "./components/AuthPage";
import ApplicationLoader from "./ui/ApplicationLoader";
import ResetPassword from "./components/ResetPassword";
import UserProfile from "./components/User/UserProfile";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/about-us",
        element: <About />,
      },
      {
        path: "/contact",
        element: <Contact />,
      },
      {
        path: "/crop-recommendations",
        element: (
          <ProtectedRoutes>
            <CropRecommendationForm />
          </ProtectedRoutes>
        ),
      },
    ],
  },
  { path: "/login", element: <AuthPage /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/me", element: <UserProfile /> },
]);

/* const AppInitialization = () => {
  // 1. Local State for the minimum animation timer
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // 2. Get the actual Auth loading state from your Context
  // logic: This is TRUE until loadUser() finishes in AuthContext
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Force the loader to stay for at least 1.8 seconds (1.5s anim + buffer)
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 3. COMBINED LOADING LOGIC
  // The app is "loading" if:
  // - The minimum timer hasn't finished OR
  // - The Auth check hasn't finished
  const isLoading = !minTimeElapsed || authLoading;

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <ApplicationLoader key="loader" />
      ) : (
        // The key="app" ensures a smooth transition in Framer Motion
        <ModalProvider key="app">
          <GlobalModal />
          <RouterProvider router={router} />
        </ModalProvider>
      )}
    </AnimatePresence>
  );
}; */

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <React.Suspense fallback={<ApplicationLoader />}>
      <ThemeProvider>
        <AuthProvider>
          {" "}
          <ModalProvider>
            <GlobalModal />
            <RouterProvider router={router} />
          </ModalProvider>
          {/* <AppInitialization /> */}
        </AuthProvider>
      </ThemeProvider>
    </React.Suspense>
  </StrictMode>
);
