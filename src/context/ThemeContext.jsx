import { createContext, useContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

const STORAGE_KEY = "app-theme";
const DEFAULT_THEME = "light";

export const ThemeProvider = ({ children }) => {
  const getSystemTheme = () => {
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : DEFAULT_THEME;
  };

  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    return savedTheme || getSystemTheme();
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    if (
      theme == "dracula" ||
      theme == "coffee" ||
      theme == "dark" ||
      theme == "sunset" ||
      theme == "forest"
    )
      setIsDark(true);
    else setIsDark(false);
  }, [theme]);

  const setAppTheme = (theme) => setTheme(theme);

  const [isDark, setIsDark] = useState();

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setAppTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
