import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import RootLayout from "./layout/RootLayout.jsx";
import Home from "./pages/Home.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoutes from "./components/ProtectedRoutes";
import { ModalProvider } from "./context/ModalContext";
import GlobalModal from "./components/GlobalModal";
import CropRecommendationForm from "./pages/CropRecommendationForm";
import AuthPage from "./components/AuthPage";

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
]);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <React.Suspense fallback={<div>Loading...</div>}>
      <ThemeProvider>
        <AuthProvider>
          {" "}
          <ModalProvider>
            <GlobalModal />
            <RouterProvider router={router} />
          </ModalProvider>
        </AuthProvider>
      </ThemeProvider>
    </React.Suspense>
  </StrictMode>
);
