import { Link, useLocation } from "react-router-dom";
import { Menu, X, MessageCircle } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { getLabel } from "@/lib/labels";
import { GeneralAIChatModal } from "./GeneralAIChatModal";

const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const settings = useSiteSettingsContext();

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
    <>
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* AI Chat Button */}
            <button
              onClick={() => setAiChatOpen(true)}
              className="relative group w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
              title="AI সহায়ক"
            >
              <MessageCircle size={16} className="drop-shadow-sm" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[hsl(var(--success))] border-2 border-card animate-pulse" />
            </button>

            <Link to="/" className="flex items-center gap-2 text-xl font-bold">
              <span className="text-2xl">{settings.brandEmoji}</span>
              <span className="gradient-text">{settings.brandName}</span>
            </Link>
          </div>

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

      <GeneralAIChatModal isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />
    </>
  );
};

export default Navbar;
