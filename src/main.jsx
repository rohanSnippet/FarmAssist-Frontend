import { StrictMode } from "react";
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
import Login from "./components/Login";
import { ModalProvider } from "./context/ModalContext";
import GlobalModal from "./components/GlobalModal";

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
        element: (
          <ProtectedRoutes>
            <About />
          </ProtectedRoutes>
        ),
      },
      {
        path: "/contact",
        element: <Contact />,
      },
    ],
  },
  { path: "/login", element: <Login /> },
]);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        {" "}
        <ModalProvider>
          <GlobalModal />
          <RouterProvider router={router} />
        </ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
