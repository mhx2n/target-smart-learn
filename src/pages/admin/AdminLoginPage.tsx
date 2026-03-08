import { useState } from "react";
import { store } from "@/lib/store";
import { useNavigate, Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminLoginPage = () => {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      store.setAdmin(true);
      navigate("/admin/dashboard");
    } else {
      toast({ title: "ভুল পাসওয়ার্ড", description: "সঠিক পাসওয়ার্ড দিন", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-accent/20">
      <div className="glass-card-static p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold mb-4">
            <span>🎯</span>
            <span className="gradient-text">Target</span>
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="text-primary" size={24} />
          </div>
          <h1 className="text-xl font-bold">Admin Login</h1>
          <p className="text-xs text-muted-foreground mt-1">ডেমো পাসওয়ার্ড: admin123</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="পাসওয়ার্ড"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full glass-strong rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="submit" className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
            লগইন
          </button>
        </form>
        <Link to="/" className="block text-center text-xs text-muted-foreground mt-4 hover:text-foreground">← ফিরে যান</Link>
      </div>
    </div>
  );
};

export default AdminLoginPage;
