import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: "হোম" },
    { to: "/exams", label: "পরীক্ষা" },
    { to: "/notices", label: "নোটিস" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="text-2xl">🎯</span>
          <span className="gradient-text">Target</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors ${
                isActive(l.to) ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/admin"
            className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
          >
            Admin
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass-strong border-t border-white/20 px-4 pb-4 animate-fade-in">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block py-3 text-sm font-medium border-b border-border/50 ${
                isActive(l.to) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="block py-3 text-sm font-medium text-primary"
          >
            Admin Panel
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
