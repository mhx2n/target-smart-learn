import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: "হোম" },
    { to: "/exams", label: "পরীক্ষা" },
    { to: "/notices", label: "নোটিস" },
    { to: "/about", label: "সম্পর্কে" },
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
            <Link key={l.to} to={l.to} className={`text-sm font-medium transition-colors ${isActive(l.to) ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {l.label}
            </Link>
          ))}
          <Link to="/student" className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            স্টুডেন্ট প্যানেল
          </Link>
          <Link to="/admin" className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors">
            Admin
          </Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden glass-strong border-t border-border/50 px-4 pb-4 animate-fade-in">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className={`block py-3 text-sm font-medium border-b border-border/50 ${isActive(l.to) ? "text-primary" : "text-muted-foreground"}`}>
              {l.label}
            </Link>
          ))}
          <Link to="/student" onClick={() => setOpen(false)} className="block py-3 text-sm font-medium text-primary">
            স্টুডেন্ট প্যানেল →
          </Link>
          <Link to="/admin" onClick={() => setOpen(false)} className="block py-3 text-sm font-medium text-muted-foreground">
            Admin Panel
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
