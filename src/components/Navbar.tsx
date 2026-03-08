import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { store } from "@/lib/store";
import { getLabel } from "@/lib/labels";

const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const settings = store.getSiteSettings();

  const links = [
    { to: "/", label: getLabel("navHome") },
    { to: "/exams", label: getLabel("navExams") },
    { to: "/results", label: getLabel("navResults") },
    { to: "/notices", label: getLabel("navNotices") },
    { to: "/profile", label: getLabel("navProfile") },
    { to: "/about", label: getLabel("navAbout") },
  ];

  const isActive = (path: string) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="text-2xl">{settings.brandEmoji}</span>
          <span className="gradient-text">{settings.brandName}</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={`text-sm font-medium transition-colors ${isActive(l.to) ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button className="p-2" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden glass-strong border-t border-border/50 px-4 pb-4 animate-fade-in">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className={`block py-3 text-sm font-medium border-b border-border/50 ${isActive(l.to) ? "text-primary" : "text-muted-foreground"}`}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
