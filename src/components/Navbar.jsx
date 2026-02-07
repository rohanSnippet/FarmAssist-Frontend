import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useModal } from "../context/ModalContext";
import { useToast } from "../ui/Toast";
import LanguageGridContent from "../ui/LanguageGridContent";
import LogoLight from "../assets/seedingL.png";
import Logo from "../assets/seeding.png";
import { useUserLocation } from "../context/LocationContext";
import { MapPin } from "lucide-react";
import LocationModal from "./LocationModal";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { t, i18n } = useTranslation();
  const { isDark, setTheme, theme } = useTheme();
  const { logout, userData, auth, loading } = useAuth();
  const { openModal } = useModal();
  const Toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const { curLocation, detectAndSaveLocation, loadingLoc } = useUserLocation();

  // Handle Scroll Effect for Glassmorphism
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
    setMobileMenuOpen(false);
  }, [location]);

  // Fullscreen Logic
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(console.error);
    } else {
      if (document.exitFullscreen)
        document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleOpenLanguage = () => {
    // Close sidebar first so modal isn't covered
    setSidebarOpen(false);
    openModal(
      <React.Suspense fallback={<span className="loading loading-spinner" />}>
        <LanguageGridContent />
      </React.Suspense>,
      { className: "max-w-4xl" },
    );
  };

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
    Toast.fire({ icon: "success", title: t("Common.toasts.logout_success") });
  };

  const cycleTheme = () => {
    const themes = ["light", "dark", "forest", "coffee", "sunset"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  // --- SVG ICONS ---
  const IconMenu = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 6h16M4 12h8m-8 6h16"
      />
    </svg>
  );
  const IconSettings = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93"
      />
    </svg>
  );
  const IconClose = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
  const IconLanguage = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.298 1.744.605 2.534.935 3.194 1.332 5.093 3.398 4.414 5.922-.359 1.334-1.218 2.05-2.074 2.373"
      />
    </svg>
  );
  const IconTheme = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
      />
    </svg>
  );
  const IconFullscreen = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  );
console.log(userData)
  return (
    <>
      {/* ================= NAVBAR ================= */}
      <div
        className={`navbar fixed top-0 left-0 right-0 z-40 transition-all duration-300 poppins-medium px-4 ${
          isScrolled
            ? "bg-base-100/90 backdrop-blur-md shadow-sm border-b border-base-content/10"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        {/* 1. Navbar Start (Mobile Menu + Logo) */}
        <div className="navbar-start">
          {/* Mobile Hamburger - Only for NavLinks */}
          {/*  <div className="dropdown lg:hidden">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            >
              <IconMenu />
            </div>
            {isMobileMenuOpen && (
              <ul
                tabIndex={0}
                className="menu menu-lg dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-64 border border-base-200"
              >
                <li>
                  <NavLink to="/">{t("navbar.home")}</NavLink>
                </li>
                <li>
                  <NavLink to="/about-us">{t("navbar.about_us")}</NavLink>
                </li>
                <li>
                  <NavLink to="/contact">{t("navbar.contact")}</NavLink>
                </li>
              </ul>
            )}
          </div> */}
          <div className="dropdown lg:hidden">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle"
            >
              <IconMenu />
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-64"
            >
              <li>
                <NavLink to="/">{t("navbar.home")}</NavLink>
              </li>
              <li>
                <NavLink to="/about-us">{t("navbar.about_us")}</NavLink>
              </li>
              <li>
                <NavLink to="/contact">{t("navbar.contact")}</NavLink>
              </li>
            </ul>
          </div>

          <Link
            to="/"
            className="btn btn-ghost text-xl flex items-center gap-2 px-1"
          >
            <img
              src={isDark ? LogoLight : Logo}
              alt="FarmAssist"
              className="h-8 w-8"
            />
            <span className="hidden sm:inline text-lg font-bold">
              {t("navbar.logo_text")}
            </span>
          </Link>
        </div>

        {/* 2. Navbar Center (Desktop Links) */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-1">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "active font-bold text-primary bg-primary/10"
                    : "hover:text-primary"
                }
              >
                {t("navbar.home")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about-us"
                className={({ isActive }) =>
                  isActive
                    ? "active font-bold text-primary bg-primary/10"
                    : "hover:text-primary"
                }
              >
                {t("navbar.about_us")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  isActive
                    ? "active font-bold text-primary bg-primary/10"
                    : "hover:text-primary"
                }
              >
                {t("navbar.contact")}
              </NavLink>
            </li>
          </ul>
        </div>

        {/* 3. Navbar End (Auth + Settings Trigger) */}
        <div className="navbar-end gap-2">
          <button 
            onClick={() => setIsLocModalOpen(true)}
            className={`
              btn btn-ghost btn-circle
              md:w-auto md:px-3 md:rounded-full 
              border border-transparent hover:border-primary/20 hover:bg-primary/5
            `}
            title="Location Settings"
          >
            <MapPin className={`w-5 h-5 ${curLocation?.label ? 'text-primary' : 'opacity-50'}`} />
            
            {/* Text hidden on mobile, visible on desktop */}
            <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
               {loadingLoc ? "..." : (curLocation?.label || "Set Location")}
            </span>
          </button>

          {loading ? (
            <div className="flex items-center gap-2">
              {/* Skeleton for button */}
              <div className="skeleton w-10 h-10 rounded-full shrink-0 bg-base-300"></div>
            </div>
          ) : userData ? (
            // LOGGED IN: Avatar opens Sidebar
            <button
              onClick={() => setSidebarOpen(true)}
              // Added 'text-base-content' to ensure the icon uses the theme's text color
              className="btn btn-ghost btn-circle avatar border border-base-content/20 hover:border-primary transition-all text-base-content"
            >
              {/* Added bg-base-300 to give the placeholder a background color that fits the theme */}
              <div className="w-10 rounded-full bg-base-300 flex items-center justify-center overflow-hidden">
                { userData?.photo_url || auth?.currentUser?.photoURL ? (
                  <img
                    alt="Profile"
                    src={userData?.photo_url || auth?.currentUser?.photoURL}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* NO PROFILE ICON (SVG) */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-7 h-7 opacity-70" // opacity-70 makes it look softer
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1 .437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ) : (
            // LOGGED OUT: Login Button + Settings Icon
            <>
              <Link
                to="/login"
                className="btn btn-primary btn-sm md:btn-md shadow-lg shadow-primary/20"
              >
                {t("Common.login")}
              </Link>
              <button
                onClick={() => setSidebarOpen(true)}
                className="btn btn-circle btn-ghost text-base-content/70 hover:text-primary"
                data-tip="Settings"
              >
                <IconSettings />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= RIGHT SIDEBAR (DRAWER) ================= */}
      {/* Sliding Panel implementation for high accessibility */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          isSidebarOpen ? "visible" : "invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* The Drawer Content */}
        <div
          className={`absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-base-100 shadow-2xl transform transition-transform duration-300 flex flex-col border-l border-base-200 ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Sidebar Header: Close & Profile */}
          <div className="p-6 bg-base-200/50 border-b border-base-200 relative">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost text-base-content/50 hover:bg-base-200"
            >
              <IconClose />
            </button>

            {userData ? (
              <div className="flex flex-col items-center mt-2">
                <div className="avatar mb-3">
                  <div className="w-24 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-3">
                    <img
                      src={userData?.photo_url || auth?.currentUser?.photoURL ||
                        "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                      }
                      alt="User"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <h3 className="font-bold text-xl text-center break-words w-full px-2">
                  {userData?.displayName || "Farmer"}
                </h3>
                <p className="text-sm text-base-content/60 truncate w-full text-center px-4">
                  {userData?.email}
                </p>

                <button
                  onClick={() => {
                    navigate(`/me`);
                    setSidebarOpen(false);
                  }}
                  className="btn btn-primary btn-sm mt-4 px-6 gap-2"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="text-center mt-8">
                <h3 className="font-bold text-lg mb-2">
                  Welcome to FarmAssist
                </h3>
                <p className="text-sm opacity-60 mb-4">
                  Login to access crop recommendations.
                </p>
                <Link
                  to="/login"
                  className="btn btn-primary w-full"
                  onClick={() => setSidebarOpen(false)}
                >
                  Login Now
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar Body: Utilities Grid */}
          <div className="p-4 flex-1 overflow-y-auto">
            <p className="text-xs font-bold text-base-content/40 uppercase mb-3 tracking-wider px-1">
              Settings & Tools
            </p>

            {/* Big Buttons for Farmers - Easy to Tap */}
            <div className="grid grid-cols-2 gap-3">
              {/* Language Button */}
              <button
                onClick={handleOpenLanguage}
                className="btn h-auto py-4 flex flex-col gap-2 border-base-200 hover:border-primary hover:bg-base-200/50 normal-case"
              >
                <IconLanguage />
                <span className="text-xs font-bold">Language</span>
                <span className="badge badge-sm badge-ghost">
                  {i18n?.language?.toUpperCase()}
                </span>
              </button>

              {/* Theme Button */}
              <button
                onClick={cycleTheme}
                className="btn h-auto py-4 flex flex-col gap-2 border-base-200 hover:border-primary hover:bg-base-200/50 normal-case"
              >
                <IconTheme />
                <span className="text-xs font-bold">Theme</span>
                <span className="badge badge-sm badge-ghost">{theme}</span>
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullScreen}
                className="btn h-auto py-4 flex flex-col gap-2 border-base-200 hover:border-primary hover:bg-base-200/50 normal-case col-span-2"
              >
                <IconFullscreen />
                <span className="text-xs font-bold">
                  {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Mode"}
                </span>
              </button>
            </div>

            {/* Additional Links for Logged In Users */}
            {userData && (
              <div className="mt-6">
                <p className="text-xs font-bold text-base-content/40 uppercase mb-3 tracking-wider px-1">
                  Account
                </p>
                <ul className="menu bg-base-200/30 rounded-box p-2">
                  <li>
                    <a>My Farms</a>
                  </li>
                  <li>
                    <a>Saved Recommendations</a>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar Footer: Logout */}
          {userData && (
            <div className="p-4 border-t border-base-200 bg-base-100">
              <button
                onClick={handleLogout}
                className="btn btn-error btn-outline w-full gap-2"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <LocationModal 
        isOpen={isLocModalOpen} 
        onClose={() => setIsLocModalOpen(false)}
        location={curLocation}
        onDetect={detectAndSaveLocation}
        loading={loadingLoc}
      />
    </>
  );
};

export default Navbar;
