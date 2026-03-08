import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="glass-nav mt-16 py-10">
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 text-xl font-bold mb-3">
            <span className="text-2xl">🎯</span>
            <span className="gradient-text">Target</span>
          </div>
          <p className="text-sm text-muted-foreground">
            আপনার পরীক্ষার প্রস্তুতি এখন আরও সহজ। অনুশীলন করুন, শিখুন, সফল হোন।
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">দ্রুত লিঙ্ক</h4>
          <div className="flex flex-col gap-2">
            <Link to="/exams" className="text-sm text-muted-foreground hover:text-foreground transition-colors">পরীক্ষা সমূহ</Link>
            <Link to="/results" className="text-sm text-muted-foreground hover:text-foreground transition-colors">ফলাফল</Link>
            <Link to="/notices" className="text-sm text-muted-foreground hover:text-foreground transition-colors">নোটিস বোর্ড</Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">সম্পর্কে</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">যোগাযোগ</h4>
          <div className="flex gap-3">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Facebook</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Telegram</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">YouTube</a>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Target 🎯 — সকল স্বত্ব সংরক্ষিত
      </div>
    </div>
  </footer>
);

export default Footer;
