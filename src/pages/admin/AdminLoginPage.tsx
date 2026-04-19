import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signIn, signUp, signInWithGoogle } from "@/hooks/useAuth";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      if (isSignUp) {
        const result = await signUp(email, password);

        if (!result?.session) {
          toast({
            title: "ভেরিফিকেশন ইমেইল পাঠানো হয়েছে ✅",
            description: "ইমেইল verify করে পরে লগইন করুন।",
          });
          setIsSignUp(false);
          return;
        }

        toast({ title: "অ্যাকাউন্ট তৈরি হয়েছে ✅" });
      } else {
        await signIn(email, password);
      }
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message || "লগইন ব্যর্থ হয়েছে", variant: "destructive" });
    } finally {
      setLoading(false);
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
          <h1 className="text-xl font-bold">{isSignUp ? "অ্যাডমিন রেজিস্ট্রেশন" : "অ্যাডমিন লগইন"}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isSignUp ? "নতুন অ্যাডমিন অ্যাকাউন্ট তৈরি করুন" : "ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন"}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="email"
              placeholder="ইমেইল"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass-strong rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="password"
              placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="w-full glass-strong rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "অপেক্ষা করুন..." : isSignUp ? (
              <><UserPlus size={16} /> রেজিস্ট্রেশন</>
            ) : (
              "লগইন"
            )}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="block w-full text-center text-xs text-primary mt-4 hover:underline"
        >
          {isSignUp ? "ইতোমধ্যে অ্যাকাউন্ট আছে? লগইন করুন" : "নতুন অ্যাকাউন্ট তৈরি করুন"}
        </button>
        <Link to="/" className="block text-center text-xs text-muted-foreground mt-3 hover:text-foreground">← ফিরে যান</Link>
      </div>
    </div>
  );
};

export default AdminLoginPage;
