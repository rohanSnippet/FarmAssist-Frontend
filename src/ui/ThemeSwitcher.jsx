import { useTheme } from "../context/ThemeContext";
import React, { useEffect, useState } from "react";

const STORAGE_KEY = "app-theme";
const DEFAULT_THEME = "light";

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (event) => {
    setTheme(event.target.value);
  };
  return (
    <div className="mx-4">
      <select
        value={theme}
        onChange={handleThemeChange}
        className="select select-ghost focus:outline-none focus:ring-0"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        {/* <option value="cupcake">Cupcake</option> */}
        {/* <option value="retro">Retro</option> */}
        <option value="coffee">Coffee</option>
        <option value="dracula">Dracula</option>
        <option value="sunset">Sunset</option>
      </select>
    </div>
  );
};

export default ThemeSwitcher;
