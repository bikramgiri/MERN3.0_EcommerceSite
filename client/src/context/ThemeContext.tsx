import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const readSavedTheme = (): Theme => {
  try {
    return localStorage.getItem("theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

/**
 * Admin colour theme. The "dark" class is applied by the admin layout (not <html>),
 * so the storefront always stays light.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Read synchronously so the admin doesn't flash light before switching to dark
  const [theme, setTheme] = useState<Theme>(readSavedTheme);

  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Storage unavailable (private mode): the theme still works for this visit
    }
  }, [theme]);

  useEffect(() => {
    // Older versions put "dark" on <html>, which leaked into the storefront
    document.documentElement.classList.remove("dark");
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
