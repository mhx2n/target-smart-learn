import { useEffect, useRef, useState } from "react";
import { useResults } from "@/hooks/useSupabaseData";
import { User, BarChart3, Award, BookOpen, Camera, Save, Copy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const StudentProfile = () => {
  const { data: results = [] } = useResults();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const totalAttempts = results.length;
  const validResults = results.filter((r) => typeof r.percentage === "number" && !isNaN(r.percentage));
  const avgScore = validResults.length > 0 ? Math.round(validResults.reduce((s, r) => s + r.percentage, 0) / validResults.length) : 0;
  const bestScore = validResults.length > 0 ? Math.max(...validResults.map((r) => r.percentage)) : 0;
  const uniqueExams = new Set(results.map((r) => r.examId)).size;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: "সংরক্ষিত হয়েছে ✅" });
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "ছবি ৫MB এর মধ্যে হতে হবে", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      toast({ title: "ছবি আপডেট হয়েছে ✅" });
    } catch (err: any) {
      toast({ title: "আপলোড ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const copyCode = () => {
    if (!profile?.unique_code) return;
    navigator.clipboard.writeText(profile.unique_code);
    toast({ title: "কোড কপি হয়েছে ✅" });
  };

  const initial = (fullName[0] || user?.email?.[0] || "U").toUpperCase();

  return (
    <div className="pt-24 pb-8 container max-w-2xl mx-auto animate-fade-in px-4">
      <div className="glass-card-static p-6 text-center mb-6">
        <div className="relative w-24 h-24 mx-auto mb-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={fullName} className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/15 text-primary flex items-center justify-center text-3xl font-bold">
              {initial}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
          >
            <Camera size={14} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>
        <h1 className="text-xl font-bold">{fullName || "অনুশীলনকারী"}</h1>
        <p className="text-xs text-muted-foreground">{user?.email}</p>

        {profile?.unique_code ? (
          <button onClick={copyCode} className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <span className="font-mono font-bold">{profile.unique_code}</span>
            <Copy size={12} />
          </button>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">⏳ ইউনিক কোড এখনো বরাদ্দ হয়নি (অ্যাডমিন ব্যাচ অ্যাসাইন করবেন)</p>
        )}
        {profile?.batch_name && (
          <p className="mt-2 text-xs text-muted-foreground">ব্যাচ: <span className="font-semibold text-foreground">{profile.batch_name}</span></p>
        )}
      </div>

      {/* Edit info */}
      <div className="glass-card-static p-5 mb-6 space-y-3">
        <h2 className="text-sm font-bold mb-2">প্রোফাইল তথ্য</h2>
        <div>
          <label className="text-xs text-muted-foreground">পূর্ণ নাম</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full glass-strong rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">মোবাইল নাম্বার</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full glass-strong rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <Save size={14} /> {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: BookOpen, label: "মোট অনুশীলন", value: totalAttempts },
          { icon: BarChart3, label: "গড় স্কোর", value: `${avgScore}%` },
          { icon: Award, label: "সর্বোচ্চ স্কোর", value: `${bestScore}%` },
          { icon: BookOpen, label: "ভিন্ন পরীক্ষা", value: uniqueExams },
        ].map((s, i) => (
          <div key={i} className="glass-card-static p-4 text-center">
            <s.icon className="mx-auto mb-2 text-primary" size={20} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3">📈 সাম্প্রতিক ফলাফল</h2>
          <div className="space-y-2">
            {results.slice(0, 10).map((r, i) => (
              <div key={i} className="glass-card-static p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{r.examTitle}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.timestamp).toLocaleDateString("bn-BD")}</p>
                </div>
                <span className={`font-bold ${r.percentage >= 60 ? "text-success" : "text-destructive"}`}>{r.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
