import { Link } from "react-router-dom";
import { store } from "@/lib/store";

const Footer = () => {
  const settings = store.getSiteSettings();

  return (
    <footer className="glass-nav mt-16 py-10">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-xl font-bold mb-3">
              <span className="text-2xl">🎯</span>
              <span className="gradient-text">Target</span>
            </div>
            <p className="text-sm text-muted-foreground">{settings.footerDescription}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">দ্রুত লিঙ্ক</h4>
            <div className="flex flex-col gap-2">
              {settings.footerLinks.map((link, i) => (
                <Link key={i} to={link.url} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">যোগাযোগ</h4>
            <div className="flex gap-3">
              {settings.socialLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Target 🎯 — সকল স্বত্ব সংরক্ষিত
        </div>
      </div>
    </footer>
  );
};

export default Footer;
