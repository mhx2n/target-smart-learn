import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import {
  LayoutDashboard, FileText, Bell, Upload, BookOpen, Settings, LogOut, Menu, X, HelpCircle, FolderOpen,
} from "lucide-react";

const navItems = [
  { to: "/admin/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { to: "/admin/exams", label: "পরীক্ষা", icon: FileText },
  { to: "/admin/questions", label: "প্রশ্ন ব্যাংক", icon: HelpCircle },
  { to: "/admin/upload-csv", label: "CSV আপলোড", icon: Upload },
  { to: "/admin/notices", label: "নোটিস", icon: Bell },
  { to: "/admin/subjects", label: "বিষয়সমূহ", icon: BookOpen },
  { to: "/admin/settings", label: "সেটিংস", icon: Settings },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!store.isAdmin()) navigate("/secure-admin-login");
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const logout = () => {
    store.setAdmin(false);
    navigate("/secure-admin-login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-nav fixed top-0 left-0 right-0 z-50 border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/admin/dashboard" className="flex items-center gap-2 font-bold">
              <span className="text-xl">🎯</span>
              <span className="gradient-text text-lg">Target</span>
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={logout} className="flex items-center gap-1.5 text-xs text-destructive hover:underline font-medium">
              <LogOut size={14} /> লগআউট
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-14">
        {/* Sidebar - desktop */}
        <aside className="hidden md:flex flex-col w-56 glass-strong border-r border-border/50 p-4 gap-1 fixed top-14 bottom-0 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.to)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </aside>

        {/* Mobile nav overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <aside className="w-64 h-full glass-strong p-4 pt-20 space-y-1 animate-fade-in" onClick={(e) => e.stopPropagation()}>
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.to)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 md:ml-56 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
