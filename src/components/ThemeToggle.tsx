import { Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { getTheme, setTheme, type Theme } from "@/lib/theme";

const ThemeToggle = () => {
  const [theme, setLocal] = useState<Theme>(getTheme());

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setLocal(next);
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-xl hover:bg-muted transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon size={18} className="text-muted-foreground" /> : <Sun size={18} className="text-warning" />}
    </button>
  );
};

export default ThemeToggle;
