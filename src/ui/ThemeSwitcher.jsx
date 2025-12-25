import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { Palette } from "lucide-react";

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  // List of available themes matching your translation keys
  const themes = ["light", "dark", "retro", "forest", "sunset"];

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);

    // This trick closes the daisyUI dropdown after selection
    const elem = document.activeElement;
    if (elem) {
      elem.blur();
    }
  };

  return (
    <div className="dropdown dropdown-end">
      {/* Trigger Button */}
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle shadow-lg bg-base-100/50 backdrop-blur-sm border border-base-content/10 tooltip tooltip-bottom"
        data-tip={t("navbar.tooltips.change_theme")}
      >
        <Palette className="w-5 h-5 text-primary drop-shadow-sm" />
      </div>

      {/* Dropdown Menu */}
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-100 rounded-box w-52 mt-4 border border-base-300"
      >
        {themes.map((mode) => (
          <li key={mode}>
            <button
              className={`capitalize font-medium ${
                theme === mode
                  ? "active poppins-extrabold text-md backdrop-blur-md text-primary bg-secondary-content"
                  : "poppins-medium"
              }`}
              onClick={() => handleThemeChange(mode)}
            >
              {/* Uses i18n keys like 'Common.light', 'Common.dark' */}
              {t(`Common.${mode}`)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ThemeSwitcher;
