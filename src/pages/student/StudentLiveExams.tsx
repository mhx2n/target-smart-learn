import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Radio, KeyRound, Clock, Calendar, Lock, Unlock, Trophy, Sparkles, Play } from "lucide-react";

interface LiveExam {
  id: string; title: string; description: string; exam_id: string;
  start_time: string; end_time: string; duration: number;
  access_mode: string; status: string;
}

function useTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const i = setInterval(() => set((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, []);
}

function formatCountdown(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}দিন ${h}ঘ ${m}মি`;
  if (h > 0) return `${h}ঘ ${m}মি ${sec}সে`;
  return `${m}মি ${String(sec).padStart(2, "0")}সে`;
}

const StudentLiveExams = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [exams, setExams] = useState<LiveExam[]>([]);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [redeemed, setRedeemed] = useState<string[]>([]);
  useTick();

  const load = async () => {
    const { data } = await supabase.from("live_exams").select("*")
      .in("status", ["scheduled", "live"]).order("start_time", { ascending: true });
    if (data) setExams(data as LiveExam[]);
    if (user) {
      const { data: codes } = await supabase.from("live_exam_access_codes")
        .select("live_exam_id").eq("used_by_user_id", user.id);
      setRedeemed((codes || []).map((c: any) => c.live_exam_id));
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const joinExam = async (le: LiveExam) => {
    if (!user) return;
    if (le.status !== "live") return toast({ title: "পরীক্ষা এখনও শুরু হয়নি", variant: "destructive" });
    if (le.access_mode === "code" && !redeemed.includes(le.id)) {
      return toast({ title: "এই পরীক্ষার জন্য অ্যাক্সেস কোড দরকার", variant: "destructive" });
    }
    const { error } = await supabase.from("live_exam_participants").insert({
      live_exam_id: le.id, user_id: user.id, status: "joined",
    });
    if (error && !error.message.toLowerCase().includes("duplicate") && !error.message.toLowerCase().includes("unique")) {
      return toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    }
    navigate(`/live-exam/${le.id}`);
  };

  const redeemCode = async () => {
    if (!code.trim() || !user) return;
    setJoining(true);
    const { data, error } = await supabase.rpc("redeem_live_exam_code", { _code: code.trim().toUpperCase() });
    setJoining(false);
    if (error) return toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    if (data) {
      setRedeemed((r) => [...new Set([...r, data as string])]);
      const { data: le } = await supabase.from("live_exams").select("status").eq("id", data).single();
      toast({ title: "কোড গৃহীত ✅", description: le?.status === "live" ? "এখনই যোগ দিন" : "পরীক্ষা শুরু হলে যোগ দিতে পারবেন" });
      setCode("");
      load();
      if (le?.status === "live") navigate(`/live-exam/${data}`);
    }
  };

  const liveNow = exams.filter((e) => e.status === "live");
  const upcoming = exams.filter((e) => e.status === "scheduled");

  return (
    <div className="pt-24 pb-10 px-4 max-w-5xl mx-auto animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-6 md:p-8 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
            <Sparkles size={14} /> লাইভ এক্সাম প্ল্যাটফর্ম
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-1">রিয়েলটাইম পরীক্ষা ও র‍্যাঙ্কিং</h1>
          <p className="text-sm text-muted-foreground max-w-xl">পরীক্ষা চলাকালীন সরাসরি অংশ নিন এবং অন্য পরীক্ষার্থীদের সাথে আপনার অবস্থান দেখুন।</p>
        </div>
      </div>

      {/* Code redeem */}
      <div className="glass-card-static p-5 mb-6">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <KeyRound size={14} className="text-primary" /> অ্যাক্সেস কোড আছে?
        </h2>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="যেমন: ABC12XYZ"
            className="flex-1 glass-strong rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider uppercase placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={redeemCode}
            disabled={joining || !code.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition active:scale-[0.98]"
          >
            {joining ? "..." : "গৃহণ"}
          </button>
        </div>
      </div>

      {/* Live now */}
      {liveNow.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
            এখন চলছে ({liveNow.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {liveNow.map((le) => (
              <ExamCardLive key={le.id} le={le} hasCode={redeemed.includes(le.id)} onJoin={() => joinExam(le)} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div>
        <h2 className="text-base font-bold mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-primary" /> আসন্ন পরীক্ষা ({upcoming.length})
        </h2>
        {upcoming.length === 0 && liveNow.length === 0 ? (
          <div className="glass-card-static p-10 text-center">
            <Trophy className="mx-auto text-muted-foreground/40 mb-3" size={40} />
            <p className="text-sm font-medium mb-1">এখন কোনো লাইভ পরীক্ষা নেই</p>
            <p className="text-xs text-muted-foreground">নতুন পরীক্ষার জন্য পরে দেখুন</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((le) => (
              <ExamCardLive key={le.id} le={le} hasCode={redeemed.includes(le.id)} onJoin={() => joinExam(le)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function ExamCardLive({ le, hasCode, onJoin }: { le: LiveExam; hasCode: boolean; onJoin: () => void }) {
  const isLive = le.status === "live";
  const startCountdown = formatCountdown(new Date(le.start_time));
  const needsCode = le.access_mode === "code";
  const canJoin = isLive && (!needsCode || hasCode);

  return (
    <div className="glass-card-static p-4 flex flex-col gap-3 hover:scale-[1.01] transition-transform">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-sm leading-tight flex-1">{le.title}</h3>
        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold ${
          isLive ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
        }`}>
          {isLive ? "🔴 লাইভ" : "নির্ধারিত"}
        </span>
      </div>
      {le.description && <p className="text-xs text-muted-foreground line-clamp-2">{le.description}</p>}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-muted/40 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
          <Clock size={12} className="text-primary" /> {le.duration} মি
        </div>
        <div className={`rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 ${
          needsCode ? (hasCode ? "bg-success/10 text-success" : "bg-warning/10 text-warning") : "bg-primary/10 text-primary"
        }`}>
          {needsCode ? (hasCode ? <Unlock size={12} /> : <Lock size={12} />) : <Unlock size={12} />}
          {needsCode ? (hasCode ? "অ্যাক্সেস" : "কোড দরকার") : "ফ্রি"}
        </div>
      </div>

      {!isLive && startCountdown && (
        <div className="text-[11px] text-center bg-primary/5 text-primary rounded-lg py-1.5 font-mono">
          ⏳ শুরু হবে: {startCountdown}
        </div>
      )}

      <button
        onClick={onJoin}
        disabled={!canJoin}
        className={`mt-auto w-full px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98] ${
          canJoin
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        <Play size={14} />
        {!isLive ? "অপেক্ষা করুন" : needsCode && !hasCode ? "কোড লাগবে" : "এখনই যোগ দিন"}
      </button>
    </div>
  );
}

export default StudentLiveExams;
