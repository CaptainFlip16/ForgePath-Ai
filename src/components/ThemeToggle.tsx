import React from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  theme: "dark" | "light";
  onToggle: () => void;
  className?: string;
}

export function ThemeToggle({ theme, onToggle, className = "" }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`p-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center border shrink-0 ${
        theme === "dark"
          ? "bg-[#131B2E] text-amber-400 border-white/10 hover:bg-[#182238] hover:border-white/20 shadow-sm"
          : "bg-white text-indigo-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
      } ${className}`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
