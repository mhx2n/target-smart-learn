import { store } from "@/lib/store";
import ExamCard from "@/components/ExamCard";
import { useState } from "react";
import { Search, X } from "lucide-react";

const ExamsPage = () => {
  const allExams = store.getExams().filter((e) => e.published);
  const sections = store.getSections();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  const subjects = ["all", ...new Set(allExams.map((e) => e.subject))];
  const diffLabels: Record<string, string> = { all: "সকল", easy: "সহজ", medium: "মাঝারি", hard: "কঠিন" };

  const filtered = allExams
    .filter((e) => {
      if (subject !== "all" && e.subject !== subject) return false;
      if (difficulty !== "all" && e.difficulty !== difficulty) return false;
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const sectionedExams = sections
    .map((s) => ({
      section: s,
      exams: filtered.filter((e) => e.sectionId === s.id),
    }))
    .filter((g) => g.exams.length > 0);

  const unsectionedExams = filtered.filter((e) => !e.sectionId || !sections.find((s) => s.id === e.sectionId));

  const openSection = sectionedExams.find((g) => g.section.id === openSectionId);

  return (
    <div className="pt-24 pb-8 container min-h-screen">
      <h1 className="text-2xl font-bold mb-6">📝 পরীক্ষা সমূহ</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
        <div className="space-y-6">
          {/* Section cards as clickable tiles */}
          {sectionedExams.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionedExams.map(({ section, exams }) => (
                <button
                  key={section.id}
                  onClick={() => setOpenSectionId(section.id)}
                  className="glass-card p-0 overflow-hidden text-left group transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {section.image && (
                    <div className="w-full h-36 overflow-hidden">
                      <img
                        src={section.image}
                        alt={section.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="text-base font-bold text-primary">📂 {section.name}</h2>
                    {section.caption && (
                      <p className="text-xs text-primary/70 italic mt-1 font-medium">{section.caption}</p>
                    )}
                    {section.description && !section.caption && (
                      <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{exams.length} পরীক্ষা</span>
                      <span className="text-xs text-primary font-medium group-hover:underline">দেখুন →</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Unsectioned exams */}
          {unsectionedExams.length > 0 && (
            <div>
              {sectionedExams.length > 0 && (
                <h2 className="text-base font-bold mb-3">📝 অন্যান্য পরীক্ষা</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unsectionedExams.map((e) => <ExamCard key={e.id} exam={e} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section Exam Popup Modal */}
      {openSection && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpenSectionId(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] bg-background rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden animate-scale-in flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-primary">📂 {openSection.section.name}</h2>
                {openSection.section.caption && (
                  <p className="text-xs text-primary/70 italic mt-0.5">{openSection.section.caption}</p>
                )}
                {openSection.section.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{openSection.section.description}</p>
                )}
              </div>
              <button
                onClick={() => setOpenSectionId(null)}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body - scrollable exam list */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {openSection.exams.map((e) => (
                  <ExamCard key={e.id} exam={e} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsPage;
