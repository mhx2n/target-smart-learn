import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Clock, Trophy, CheckCircle2, Send, Medal } from "lucide-react";
import MathText from "@/components/MathText";

interface Question { id: string; question: string; options: string[]; answer: string; section: string; }
interface LiveExam { id: string; title: string; exam_id: string; duration: number; status: string; show_leaderboard: boolean; end_time: string; }
interface Participant { id: string; user_id: string; score: number; max_score: number; correct: number; wrong: number; skipped: number; percentage: number; time_taken_seconds: number; status: string; started_at: string | null; }
interface Profile { user_id: string; full_name: string | null; unique_code: string | null; avatar_url: string | null; }

const LiveExamAttempt = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [liveExam, setLiveExam] = useState<LiveExam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [allParts, setAllParts] = useState<Participant[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const startedAtRef = useRef<Date | null>(null);

  // Load exam + participant + questions
  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: le } = await supabase.from("live_exams").select("*").eq("id", id).single();
      if (!le) { toast({ title: "পরীক্ষা পাওয়া যায়নি", variant: "destructive" }); navigate("/live-exams"); return; }
      setLiveExam(le as LiveExam);

      const { data: q } = await supabase.from("questions").select("id,question,options,answer,section")
        .eq("exam_id", le.exam_id).order("sort_order");
      setQuestions((q || []) as any);

      let { data: p } = await supabase.from("live_exam_participants").select("*")
        .eq("live_exam_id", id).eq("user_id", user.id).maybeSingle();

      if (!p) {
        const { data: ins } = await supabase.from("live_exam_participants").insert({
          live_exam_id: id, user_id: user.id, status: "in_progress",
          started_at: new Date().toISOString(), max_score: (q || []).length,
        }).select().single();
        p = ins;
      } else if (!p.started_at) {
        const { data: upd } = await supabase.from("live_exam_participants").update({
          started_at: new Date().toISOString(), status: "in_progress", max_score: (q || []).length,
        }).eq("id", p.id).select().single();
        p = upd;
      }
      setParticipant(p as Participant);
      startedAtRef.current = p?.started_at ? new Date(p.started_at) : new Date();
      if (p?.status === "submitted") setSubmitted(true);

      // Load existing answers
      const { data: ans } = await supabase.from("live_exam_answers").select("question_id,selected_answer")
        .eq("participant_id", p!.id);
      const map: Record<string, string> = {};
      (ans || []).forEach((a: any) => { map[a.question_id] = a.selected_answer; });
      setAnswers(map);

      setLoading(false);
    })();
  }, [id, user]);

  // Timer
  useEffect(() => {
    if (!liveExam || !startedAtRef.current || submitted) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current!.getTime()) / 1000);
      const total = liveExam.duration * 60;
      const left = Math.max(0, total - elapsed);
      setTimeLeft(left);
      if (left === 0) handleSubmit(true);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [liveExam, submitted]);

  // Realtime leaderboard
  useEffect(() => {
    if (!id) return;
    const refresh = async () => {
      const { data } = await supabase.from("live_exam_participants").select("*")
        .eq("live_exam_id", id).order("score", { ascending: false });
      setAllParts((data || []) as Participant[]);
      const ids = Array.from(new Set((data || []).map((x: any) => x.user_id)));
      if (ids.length) {
        const { data: pr } = await supabase.from("profiles").select("user_id,full_name,unique_code,avatar_url").in("user_id", ids);
        const map: Record<string, Profile> = {};
        (pr || []).forEach((x: any) => { map[x.user_id] = x; });
        setProfiles(map);
      }
    };
    refresh();
    const ch = supabase.channel(`live-exam-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_exam_participants", filter: `live_exam_id=eq.${id}` },
        () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const selectAnswer = async (q: Question, opt: string) => {
    if (submitted || !participant) return;
    if (answers[q.id]) return; // lock once selected
    setAnswers((prev) => ({ ...prev, [q.id]: opt }));
    await supabase.from("live_exam_answers").upsert({
      participant_id: participant.id, live_exam_id: id!, user_id: user!.id,
      question_id: q.id, selected_answer: opt, is_correct: opt === q.answer,
    }, { onConflict: "participant_id,question_id" });
  };

  const handleSubmit = async (auto = false) => {
    if (!participant || submitted) return;
    if (!auto && !confirm("পরীক্ষা জমা দিতে চান?")) return;

    let correct = 0, wrong = 0, skipped = 0;
    questions.forEach((q) => {
      const a = answers[q.id];
      if (!a) skipped++;
      else if (a === q.answer) correct++;
      else wrong++;
    });
    const score = correct;
    const max = questions.length;
    const pct = max ? (score / max) * 100 : 0;
    const elapsed = startedAtRef.current ? Math.floor((Date.now() - startedAtRef.current.getTime()) / 1000) : 0;

    await supabase.from("live_exam_participants").update({
      status: "submitted", submitted_at: new Date().toISOString(),
      score, max_score: max, correct, wrong, skipped,
      percentage: pct, time_taken_seconds: elapsed,
    }).eq("id", participant.id);

    setSubmitted(true);
    toast({ title: auto ? "সময় শেষ! জমা হয়েছে" : "জমা সফল ✅" });
  };

  if (loading) return <div className="p-6 text-center text-sm text-muted-foreground">লোড হচ্ছে...</div>;
  if (!liveExam) return null;

  const sortedLB = [...allParts].sort((a, b) => b.score - a.score || a.time_taken_seconds - b.time_taken_seconds);
  const myRank = sortedLB.findIndex((p) => p.user_id === user?.id) + 1;
  const mins = Math.floor(timeLeft / 60), secs = timeLeft % 60;

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card-static p-4 flex items-center justify-between sticky top-2 z-10">
            <div>
              <h1 className="font-bold">{liveExam.title}</h1>
              <p className="text-xs text-muted-foreground">প্রশ্ন: {questions.length} • উত্তর: {Object.keys(answers).length}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold ${
                timeLeft < 60 ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"
              }`}>
                <Clock size={14} /> {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
              {!submitted && (
                <button onClick={() => handleSubmit(false)} className="px-3 py-1.5 rounded-lg bg-success text-success-foreground text-xs font-bold flex items-center gap-1">
                  <Send size={12} /> জমা
                </button>
              )}
            </div>
          </div>

          {submitted ? (
            <div className="glass-card-static p-8 text-center space-y-3">
              <CheckCircle2 className="mx-auto text-success" size={48} />
              <h2 className="text-xl font-bold">পরীক্ষা জমা হয়েছে</h2>
              <p className="text-sm text-muted-foreground">আপনার র‍্যাঙ্ক: <span className="font-bold text-primary">{myRank || "—"}</span></p>
              <button onClick={() => navigate("/live-exams")} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                ফিরে যান
              </button>
            </div>
          ) : questions.map((q, i) => (
            <div key={q.id} className="glass-card-static p-4">
              <p className="text-xs text-muted-foreground mb-1">প্রশ্ন {i + 1} / {questions.length}</p>
              <div className="font-medium mb-3"><MathText text={q.question} /></div>
              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const selected = answers[q.id] === opt;
                  const locked = !!answers[q.id];
                  return (
                    <button key={idx} onClick={() => selectAnswer(q, opt)} disabled={locked}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm ${
                        selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                      } ${locked && !selected ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                      <MathText text={opt} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {liveExam.show_leaderboard && (
          <div className="lg:col-span-1">
            <div className="glass-card-static p-4 sticky top-2">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Trophy size={16} className="text-warning" /> লাইভ র‍্যাঙ্কিং</h3>
              <div className="space-y-1.5 max-h-[70vh] overflow-auto">
                {sortedLB.map((p, i) => {
                  const pr = profiles[p.user_id];
                  const isMe = p.user_id === user?.id;
                  return (
                    <div key={p.id} className={`flex items-center gap-2 p-2 rounded-lg ${isMe ? "bg-primary/15 border border-primary/30" : "bg-muted/30"}`}>
                      <div className="w-6 text-center font-bold text-xs">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </div>
                      {pr?.avatar_url ? <img src={pr.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" /> :
                        <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                          {(pr?.full_name || "U")[0]}
                        </div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{pr?.full_name || "—"} {isMe && <span className="text-primary">(আপনি)</span>}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{pr?.unique_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">{p.score}/{p.max_score}</p>
                        <p className="text-[10px] text-muted-foreground">{p.status === "submitted" ? "✓" : "..."}</p>
                      </div>
                    </div>
                  );
                })}
                {sortedLB.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">এখনও কেউ যোগ দেয়নি</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveExamAttempt;
