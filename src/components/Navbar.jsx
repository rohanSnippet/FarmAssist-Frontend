// Assume you are using a React component that imports 'isUser' and 'NavLink'
import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Logo from "/seeding.png";
import LogoLight from "/seedingL.png";
import ThemeSwitcher from "../ui/ThemeSwitcher.jsx";
import { useTheme } from "../context/ThemeContext";
import { BsTranslate } from "react-icons/bs";
import { useAuth } from "../context/AuthContext.jsx";
import Login from "./Login.jsx";
import { useModal } from "../context/ModalContext.jsx";

const Navbar = () => {
  const location = useLocation();
  const { isDark } = useTheme();
  const { openModal, closeModal } = useModal();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    closeModal();
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-base-100/20 navbar border-b border-white/10 poppins-medium px-4`}
    >
      {/* Navbar Start (Logo and Mobile Menu) */}
      <div className="navbar-start">
        <div className="dropdown">
          {/* Mobile Menu Dropdown */}
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
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
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow"
          >
            <li>
              <NavLink to={`/`}>Home</NavLink>
            </li>
            <li>
              <NavLink to={`/about-us`}>About Us</NavLink>
            </li>
            <li>
              <NavLink to={`/contact`}>Contact</NavLink>
            </li>
          </ul>
        </div>
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
            <NavLink to={`/about-us`} state={{ path: location.pathname }}>
              About Us
            </NavLink>
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
          <a className="btn" onClick={() => openModal(<Login />)}>
            Login
          </a>
        )}
      </div>
    </div>
  );
};

export default Navbar;
