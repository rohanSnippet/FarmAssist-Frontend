// ... existing imports

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/seeding.png";
import LogoLight from "../assets/seedingL.png";
import { NavLink } from "react-router-dom";
import { BsTranslate } from "react-icons/bs";
import { BsFullscreen, BsFullscreenExit } from "react-icons/bs";
import ThemeSwitcher from "../ui/ThemeSwitcher";
import { useModal } from "../context/ModalContext";
import { useTranslation } from "react-i18next";
import LanguageGridContent from "../ui/LanguageGridContent";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { logout, user } = useAuth();

  const { openModal } = useModal();

  const handleOpenLanguage = () => {
    import("../ui/LanguageGridContent").then(
      ({ default: LanguageGridContent }) => {
        openModal(<LanguageGridContent />, { className: "max-w-5xl" });
      }
    );
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleLoginClick = () => {
    // Redirect to the dedicated login page
    navigate("/login");
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      // Request full screen
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error(
            `Error attempting to enable full-screen mode: ${err.message}`
          );
        });
    } else {
      // Exit full screen
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  // Optional: Listen for 'Esc' key to update state if user exits manually
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-base-100 navbar border-b border-white/10 poppins-medium px-4`}
    >
      {/* Navbar Start (Logo and Mobile Menu) */}
      <div className="navbar-start">
        {/* ... existing dropdown menu */}
        <a className="text-xl flex items-center" href="/">
          {isDark ? (
            <img src={LogoLight} alt="" width={32} className="h-8 w-8 mr-2" />
          ) : (
            <img src={Logo} alt="" width={32} className="h-8 w-8 mr-2" />
          )}
          <p className="text-lg">{t("navbar.logo_text")}</p>
        </a>
      </div>

      {/* Navbar Center (Desktop Links) */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <NavLink to={`/`}>{t("navbar.home")}</NavLink>
          </li>
          <li>
            {/* The state is no longer needed here as ProtectedRoutes handles the redirect */}
            <NavLink to={`/about-us`}>{t("navbar.about_us")}</NavLink>
          </li>
          <li>
            <NavLink to={`/contact`}>{t("navbar.contact")}</NavLink>
          </li>
        </ul>
      </div>
      <div className="navbar-end mx-2">
        <a
          className="hidden md:flex btn btn-ghost poppins-medium"
          onClick={handleOpenLanguage}
        >
          {/* <BsTranslate size={20} /> */} {t("lang_name")}
        </a>
        <span className="hidden md:flex">
          {" "}
          <ThemeSwitcher />
        </span>
        {user ? (
          <a className="btn" onClick={handleLogout}>
            {t("Common.logout")}
          </a>
        ) : (
          <a className="btn" onClick={handleLoginClick}>
            {t("Common.login")}
          </a>
        )}
        <button
          className="btn btn-ghost btn-circle hidden md:flex ml-2"
          onClick={toggleFullScreen}
        >
          {isFullscreen ? (
            <BsFullscreenExit size={20} />
          ) : (
            <BsFullscreen size={20} />
          )}
        </button>
      </div>
    </div>
  );
};

export default Navbar;
