import { store } from "@/lib/store";
import { useState } from "react";
import { Search } from "lucide-react";
import ExamCard from "@/components/ExamCard";

const StudentExams = () => {
  const exams = store.getExams().filter((e) => e.published);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const subjects = ["all", ...new Set(exams.map((e) => e.subject))];
  const diffLabels: Record<string, string> = { all: "সকল", easy: "সহজ", medium: "মাঝারি", hard: "কঠিন" };

  const filtered = exams.filter((e) => {
    if (subject !== "all" && e.subject !== subject) return false;
    if (difficulty !== "all" && e.difficulty !== difficulty) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold">📝 পরীক্ষা সমূহ</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-strong rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="glass-strong rounded-xl px-3 py-2.5 text-sm focus:outline-none">
          {subjects.map((s) => <option key={s} value={s}>{s === "all" ? "সকল বিষয়" : s}</option>)}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="glass-strong rounded-xl px-3 py-2.5 text-sm focus:outline-none">
          {["all", "easy", "medium", "hard"].map((d) => <option key={d} value={d}>{diffLabels[d]}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card-static p-12 text-center text-muted-foreground">কোনো পরীক্ষা পাওয়া যায়নি</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => <ExamCard key={e.id} exam={e} basePath="/student" />)}
        </div>
      )}
    </div>
  );
};

export default StudentExams;
