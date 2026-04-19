import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Radio, KeyRound, Clock, Users as UsersIcon } from "lucide-react";

interface LiveExam {
  id: string; title: string; description: string; exam_id: string;
  start_time: string; end_time: string; duration: number;
  access_mode: string; status: string;
}

const StudentLiveExams = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [exams, setExams] = useState<LiveExam[]>([]);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("live_exams").select("*")
      .in("status", ["scheduled", "live"]).order("start_time", { ascending: true });
    if (data) setExams(data as LiveExam[]);
  };

  useEffect(() => { load(); }, []);

  const joinExam = async (le: LiveExam) => {
    if (!user) return;
    if (le.status !== "live") return toast({ title: "পরীক্ষা এখনও শুরু হয়নি", variant: "destructive" });
    if (le.access_mode === "code") return toast({ title: "এই পরীক্ষার জন্য কোড দরকার", variant: "destructive" });

    const { error } = await supabase.from("live_exam_participants").insert({
      live_exam_id: le.id, user_id: user.id, status: "joined",
    });
    if (error && !error.message.includes("duplicate")) {
      return toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    }
    navigate(`/live-exam/${le.id}`);
  };

  const redeemCode = async () => {
    if (!code.trim()) return;
    setJoining(true);
    const { data, error } = await supabase.rpc("redeem_live_exam_code", { _code: code.trim().toUpperCase() });
    setJoining(false);
    if (error) return toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    if (data && user) {
      await supabase.from("live_exam_participants").insert({
        live_exam_id: data, user_id: user.id, status: "joined",
      });
      toast({ title: "যোগদান সফল ✅" });
      navigate(`/live-exam/${data}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Radio className="text-primary" /> লাইভ পরীক্ষা</h1>
        <p className="text-sm text-muted-foreground">লাইভ পরীক্ষায় অংশ নিন এবং রিয়েলটাইম র‍্যাঙ্কিং দেখুন</p>
      </div>

      <div className="glass-card-static p-5">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2"><KeyRound size={14} /> অ্যাক্সেস কোড দিয়ে যোগ দিন</h2>
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="কোড লিখুন (যেমন: ABC12XYZ)"
            className="flex-1 glass-strong rounded-lg px-3 py-2 text-sm font-mono uppercase" />
          <button onClick={redeemCode} disabled={joining} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {joining ? "..." : "যোগ দাও"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold">উপলব্ধ পরীক্ষা ({exams.length})</h2>
        {exams.length === 0 ? (
          <div className="glass-card-static p-8 text-center text-sm text-muted-foreground">
            এখন কোনো লাইভ পরীক্ষা চলছে না
          </div>
        ) : exams.map((le) => (
          <div key={le.id} className="glass-card-static p-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold">{le.title}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                le.status === "live" ? "bg-success/15 text-success animate-pulse" : "bg-warning/15 text-warning"
              }`}>{le.status === "live" ? "🔴 লাইভ" : "নির্ধারিত"}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{le.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><Clock size={12} /> {le.duration} মিনিট</span>
              <span>শুরু: {new Date(le.start_time).toLocaleString()}</span>
            </div>
            {le.access_mode === "open" ? (
              <button onClick={() => joinExam(le)}
                disabled={le.status !== "live"}
                className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {le.status === "live" ? "যোগ দাও" : "এখনও শুরু হয়নি"}
              </button>
            ) : (
              <p className="text-xs text-center text-muted-foreground">🔒 অ্যাক্সেস কোড দরকার (উপরে লিখুন)</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentLiveExams;
