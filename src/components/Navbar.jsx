// ... existing imports

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/seeding.png";
import LogoLight from "../assets/seedingL.png";
import { NavLink } from "react-router-dom";
import { BsTranslate } from "react-icons/bs";
import ThemeSwitcher from "../ui/ThemeSwitcher";

const Navbar = () => {
  const location = useLocation();
  const { isDark } = useTheme();
  // const { openModal, closeModal } = useModal(); // Removed unused Modal imports
  const { logout, user } = useAuth();

  // Use useNavigate to redirect to /login
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // closeModal();
  };

  const handleLoginClick = () => {
    // Redirect to the dedicated login page
    navigate("/login");
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-base-100/20 navbar border-b border-white/10 poppins-medium px-4`}
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
          <p className="text-lg">FarmAssist</p>
        </a>
      </div>

      {/* Navbar Center (Desktop Links) */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <NavLink to={`/`}>Home</NavLink>
          </li>
          <li>
            {/* The state is no longer needed here as ProtectedRoutes handles the redirect */}
            <NavLink to={`/about-us`}>About Us</NavLink>
          </li>
          <li>
            <NavLink to={`/contact`}>Contact Us</NavLink>
          </li>
        </ul>
      </div>
      <div className="navbar-end mx-2">
        <a className="hidden md:flex">
          <BsTranslate size={20} />
        </a>
        <span className="hidden md:flex">
          {" "}
          <ThemeSwitcher />
        </span>
        {user ? (
          <a className="btn" onClick={handleLogout}>
            Logout
          </a>
        ) : (
          <a className="btn" onClick={handleLoginClick}>
            Login
          </a>
        )}
      </div>
    </div>
  );
};

export default Navbar;
