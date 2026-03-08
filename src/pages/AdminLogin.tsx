import { useState } from "react";
import { store } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
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
    <div className="pt-24 pb-8 container max-w-sm min-h-screen flex items-center justify-center">
      <div className="glass-card-static p-8 w-full">
        <div className="text-center mb-6">
          <Lock className="mx-auto mb-3 text-primary" size={32} />
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
          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            লগইন
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
