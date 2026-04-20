import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Calendar, CheckCircle2, Clock, Copy, KeyRound, Lock, Play, Radio, Sparkles, Trophy, Unlock } from "lucide-react";

interface LiveExam {
  id: string;
  title: string;
  description: string;
  exam_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  access_mode: string;
  status: string;
}

interface AccessCode {
  id: string;
  code: string;
  live_exam_id: string;
  used_at: string | null;
  used_by_user_id: string | null;
  assigned_to_user_id: string | null;
}

function useTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => set((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);
}

function formatCountdown(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}দিন ${hours}ঘ ${minutes}মি`;
  if (hours > 0) return `${hours}ঘ ${minutes}মি ${secs}সে`;
  return `${minutes}মি ${String(secs).padStart(2, "0")}সে`;
}

const StudentLiveExams = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [exams, setExams] = useState<LiveExam[]>([]);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [code, setCode] = useState("");
  const [joiningExamId, setJoiningExamId] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  useTick();

  const load = async () => {
    const examQuery = supabase
      .from("live_exams")
      .select("*")
      .in("status", ["scheduled", "live"])
      .order("start_time", { ascending: true });

    const codeQuery = user
      ? supabase
          .from("live_exam_access_codes")
          .select("id,code,live_exam_id,used_at,used_by_user_id,assigned_to_user_id")
          .or(`assigned_to_user_id.eq.${user.id},used_by_user_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as AccessCode[], error: null });

    const [examResult, codeResult] = await Promise.all([examQuery, codeQuery]);
    if (examResult.data) setExams(examResult.data as LiveExam[]);
    if (codeResult.data) setCodes(codeResult.data as AccessCode[]);
  };

  useEffect(() => {
    void load();
  }, [user?.id]);

  const codesByExam = useMemo(() => {
    const grouped: Record<string, AccessCode[]> = {};
    codes.forEach((entry) => {
      grouped[entry.live_exam_id] = [...(grouped[entry.live_exam_id] || []), entry];
    });
    return grouped;
  }, [codes]);

  const examMap = useMemo(
    () => Object.fromEntries(exams.map((exam) => [exam.id, exam])),
    [exams],
  );

  const redeemed = useMemo(
    () => [...new Set(codes.filter((entry) => !!entry.used_at || !!entry.used_by_user_id).map((entry) => entry.live_exam_id))],
    [codes],
  );

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast({ title: "কপি হয়েছে ✅" });
  };

  const redeemRawCode = async (rawCode: string) => {
    const normalized = rawCode.trim().toUpperCase();
    if (!normalized || !user) return null;
    const { data, error } = await supabase.rpc("redeem_live_exam_code", { _code: normalized });
    if (error) {
      throw error;
    }
    return data as string;
  };

  const joinExam = async (exam: LiveExam) => {
    if (!user) return;
    if (exam.status !== "live") {
      return toast({ title: "পরীক্ষা এখনও শুরু হয়নি", variant: "destructive" });
    }

    setJoiningExamId(exam.id);

    try {
      if (exam.access_mode === "code" && !redeemed.includes(exam.id)) {
        const ownCode = codesByExam[exam.id]?.[0];
        if (!ownCode) {
          return toast({
            title: "এই পরীক্ষার জন্য অ্যাক্সেস কোড দরকার",
            description: "উপরে ‘আমার কোড’ সেকশন থেকে কোড দেখুন, না থাকলে অ্যাডমিনের সাথে যোগাযোগ করুন।",
            variant: "destructive",
          });
        }
        await redeemRawCode(ownCode.code);
      }

      const { error } = await supabase.from("live_exam_participants").insert({
        live_exam_id: exam.id,
        user_id: user.id,
        status: "joined",
      });

      if (error && !error.message.toLowerCase().includes("duplicate") && !error.message.toLowerCase().includes("unique")) {
        return toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
      }

      await load();
      navigate(`/live-exam/${exam.id}`);
    } catch (error: any) {
      toast({ title: "যোগ দেওয়া যায়নি", description: error.message, variant: "destructive" });
    } finally {
      setJoiningExamId(null);
    }
  };

  const redeemCode = async () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized || !user) return;

    if (normalized.startsWith("TARGET-") || normalized === profile?.unique_code?.toUpperCase()) {
      return toast({
        title: "এটা আপনার প্রোফাইল কোড",
        description: "লাইভ পরীক্ষার জন্য আলাদা exam access code লাগে — সেটা নিচের ‘আমার কোড’ অংশে দেখুন বা অ্যাডমিনের কাছ থেকে নিন।",
        variant: "destructive",
      });
    }

    setRedeeming(true);
    try {
      const liveExamId = await redeemRawCode(normalized);
      const { data: liveExam } = await supabase.from("live_exams").select("status,title").eq("id", liveExamId).single();
      toast({
        title: "কোড গ্রহণ হয়েছে ✅",
        description: liveExam?.status === "live" ? `${liveExam?.title || "পরীক্ষা"} এখনই শুরু করতে পারবেন` : "পরীক্ষা শুরু হলে যোগ দিতে পারবেন",
      });
      setCode("");
      await load();
      if (liveExam?.status === "live") navigate(`/live-exam/${liveExamId}`);
    } catch (error: any) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  };

  const liveNow = exams.filter((exam) => exam.status === "live");
  const upcoming = exams.filter((exam) => exam.status === "scheduled");

  return (
    <div className="pt-24 pb-10 px-4 max-w-6xl mx-auto animate-fade-in space-y-6">
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Sparkles size={14} /> লাইভ এক্সাম প্ল্যাটফর্ম
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold">প্র্যাকটিস এক্সামের মতোই, এবার লাইভে</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              একই প্রশ্নধারা, একই exam flow, শুধু সাথে থাকবে রিয়েলটাইম leaderboard এবং নির্দিষ্ট access control।
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-xl">
            <div className="glass-card-static p-3 text-center">
              <p className="text-xl font-bold">{liveNow.length}</p>
              <p className="text-[11px] text-muted-foreground">এখন চলছে</p>
            </div>
            <div className="glass-card-static p-3 text-center">
              <p className="text-xl font-bold">{upcoming.length}</p>
              <p className="text-[11px] text-muted-foreground">আসছে</p>
            </div>
            <div className="glass-card-static p-3 text-center">
              <p className="text-xl font-bold">{codes.length}</p>
              <p className="text-[11px] text-muted-foreground">আমার কোড</p>
            </div>
          </div>
        </div>
      </div>

      {codes.length > 0 && (
        <div className="glass-card-static p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 size={14} className="text-success" /> আমার অ্যাক্সেস কোড
            </h2>
            <p className="text-[11px] text-muted-foreground">এগুলোই live exam access code — profile code নয়</p>
          </div>
          <div className="space-y-2">
            {codes.map((entry) => {
              const exam = examMap[entry.live_exam_id];
              const isUsed = !!entry.used_at || !!entry.used_by_user_id;
              return (
                <div key={entry.id} className="glass-strong rounded-2xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{exam?.title || "লাইভ পরীক্ষা"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isUsed ? "এই কোড ব্যবহার করা হয়েছে" : "এই কোড দিয়েই পরীক্ষায় join করা যাবে"}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary font-mono text-sm font-bold">
                      <KeyRound size={14} /> {entry.code}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(entry.code)}
                    className="shrink-0 p-2 rounded-xl bg-muted hover:bg-accent transition-colors"
                    title="কপি"
                  >
                    <Copy size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass-card-static p-5">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <KeyRound size={14} className="text-primary" /> অ্যাক্সেস কোড রিডিম করুন
        </h2>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="যেমন: ABC12XYZ"
            className="flex-1 glass-strong rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider uppercase placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={redeemCode}
            disabled={redeeming || !code.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition active:scale-[0.98]"
          >
            {redeeming ? "..." : "রিডিম"}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">যদি admin আপনার নামে কোড assign করে, তাহলে সেটা উপরের “আমার অ্যাক্সেস কোড” অংশেই দেখাবে।</p>
      </div>

      {liveNow.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
            এখন চলছে ({liveNow.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {liveNow.map((exam) => (
              <ExamCardLive
                key={exam.id}
                exam={exam}
                hasAccess={(codesByExam[exam.id] || []).length > 0}
                isRedeemed={redeemed.includes(exam.id)}
                joining={joiningExamId === exam.id}
                onJoin={() => joinExam(exam)}
              />
            ))}
          </div>
        </div>
      )}

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
            {upcoming.map((exam) => (
              <ExamCardLive
                key={exam.id}
                exam={exam}
                hasAccess={(codesByExam[exam.id] || []).length > 0}
                isRedeemed={redeemed.includes(exam.id)}
                joining={joiningExamId === exam.id}
                onJoin={() => joinExam(exam)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function ExamCardLive({
  exam,
  hasAccess,
  isRedeemed,
  joining,
  onJoin,
}: {
  exam: LiveExam;
  hasAccess: boolean;
  isRedeemed: boolean;
  joining: boolean;
  onJoin: () => void;
}) {
  const isLive = exam.status === "live";
  const startCountdown = formatCountdown(new Date(exam.start_time));
  const needsCode = exam.access_mode === "code";
  const canJoin = isLive && (!needsCode || hasAccess);

  return (
    <div className="glass-card-static p-4 flex flex-col gap-3 hover:scale-[1.01] transition-transform">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Radio size={14} className="text-primary" />
            <h3 className="font-bold text-sm leading-tight truncate">{exam.title}</h3>
          </div>
          {exam.description && <p className="text-xs text-muted-foreground line-clamp-2">{exam.description}</p>}
        </div>
        <span
          className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold ${
            isLive ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
          }`}
        >
          {isLive ? "🔴 লাইভ" : "নির্ধারিত"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-muted/40 rounded-lg px-2.5 py-2 flex items-center gap-1.5">
          <Clock size={12} className="text-primary" /> {exam.duration} মিনিট
        </div>
        <div
          className={`rounded-lg px-2.5 py-2 flex items-center gap-1.5 ${
            needsCode ? (hasAccess ? "bg-success/10 text-success" : "bg-warning/10 text-warning") : "bg-primary/10 text-primary"
          }`}
        >
          {needsCode ? (hasAccess ? <Unlock size={12} /> : <Lock size={12} />) : <Unlock size={12} />}
          {needsCode ? (isRedeemed ? "রিডিমড" : hasAccess ? "কোড প্রস্তুত" : "কোড দরকার") : "সবার জন্য"}
        </div>
      </div>

      {!isLive && startCountdown && (
        <div className="text-[11px] text-center bg-primary/5 text-primary rounded-lg py-1.5 font-mono">
          ⏳ শুরু হবে: {startCountdown}
        </div>
      )}

      <button
        onClick={onJoin}
        disabled={!canJoin || joining}
        className={`mt-auto w-full px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98] ${
          canJoin ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        <Play size={14} />
        {joining ? "যোগ দিচ্ছে..." : !isLive ? "শুরু হলে যোগ দিন" : needsCode && !hasAccess ? "অ্যাক্সেস কোড লাগবে" : "এখনই যোগ দিন"}
      </button>
    </div>
  );
}

export default StudentLiveExams;
