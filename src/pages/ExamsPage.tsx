import { useExams, useSections } from "@/hooks/useSupabaseData";
import ExamCard from "@/components/ExamCard";
import { useState } from "react";
import { Search, X, FolderOpen, BookOpen } from "lucide-react";
import { getLabel } from "@/lib/labels";

const ExamsPage = () => {
  const { data: allExamsRaw = [] } = useExams();
  const { data: sections = [] } = useSections();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [tab, setTab] = useState<"question-bank" | "subjects">("question-bank");

  const allExams = allExamsRaw.filter((e) => e.published);

  const diffLabels: Record<string, string> = { all: getLabel("diffAll"), easy: getLabel("diffEasy"), medium: getLabel("diffMedium"), hard: getLabel("diffHard") };

  const sectionedExamIds = new Set(
    allExams.filter((e) => e.sectionId && sections.some((s) => s.id === e.sectionId)).map((e) => e.id)
  );

  const unsectionedExams = allExams.filter((e) => !sectionedExamIds.has(e.id));
  const subjects = ["all", ...new Set(unsectionedExams.map((e) => e.subject))];

  // All exams sorted newest first for question bank
  const allExamsSorted = allExams
    .filter((e) => {
      if (difficulty !== "all" && e.difficulty !== difficulty) return false;
      if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.subject.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredUnsectioned = unsectionedExams
    .filter((e) => {
      if (subject !== "all" && e.subject !== subject) return false;
      if (difficulty !== "all" && e.difficulty !== difficulty) return false;
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const sectionGroups = sections
    .map((s) => ({
      section: s,
      exams: allExams
        .filter((e) => e.sectionId === s.id)
        .filter((e) => {
          if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
          if (difficulty !== "all" && e.difficulty !== difficulty) return false;
          return true;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }))
    .filter((g) => g.exams.length > 0);

  const openSection = sectionGroups.find((g) => g.section.id === openSectionId);

  const subjectGroups = subjects
    .filter((s) => s !== "all")
    .map((s) => ({
      subject: s,
      exams: filteredUnsectioned.filter((e) => e.subject === s),
    }))
    .filter((g) => g.exams.length > 0);

  return (
    <div className="pt-24 pb-8 container min-h-screen">
      <h1 className="text-2xl font-bold mb-6">{getLabel("examsPageTitle")}</h1>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("question-bank")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === "question-bank" ? "bg-primary text-primary-foreground shadow-md" : "glass-strong text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderOpen size={16} /> প্রশ্ন ব্যাংক
        </button>
        <button
          onClick={() => setTab("subjects")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === "subjects" ? "bg-primary text-primary-foreground shadow-md" : "glass-strong text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen size={16} /> {getLabel("tabSubjects")}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input type="text" placeholder="পরীক্ষা বা বিষয় খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-strong rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
        {tab === "subjects" && (
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="glass-strong rounded-xl px-3 py-2.5 text-sm focus:outline-none text-foreground bg-card">
            {subjects.map((s) => <option key={s} value={s} className="bg-card text-foreground">{s === "all" ? getLabel("allSubjects") : s}</option>)}
          </select>
        )}
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="glass-strong rounded-xl px-3 py-2.5 text-sm focus:outline-none text-foreground bg-card">
          {["all", "easy", "medium", "hard"].map((d) => <option key={d} value={d} className="bg-card text-foreground">{diffLabels[d]}</option>)}
        </select>
      </div>

      {tab === "question-bank" && (
        <>
          {allExamsSorted.length === 0 ? (
            <div className="glass-card-static p-12 text-center text-muted-foreground">কোনো পরীক্ষা পাওয়া যায়নি</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allExamsSorted.map((e) => <ExamCard key={e.id} exam={e} />)}
            </div>
          )}
        </>
      )}

      {tab === "subjects" && (
        <>
          {filteredUnsectioned.length === 0 ? (
            <div className="glass-card-static p-12 text-center text-muted-foreground">{getLabel("noExams")}</div>
          ) : subject === "all" ? (
            <div className="space-y-6">
              {subjectGroups.map(({ subject: subj, exams }) => (
                <div key={subj}>
                  <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                    <BookOpen size={16} className="text-primary" /> {subj}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exams.map((e) => <ExamCard key={e.id} exam={e} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUnsectioned.map((e) => <ExamCard key={e.id} exam={e} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExamsPage;
