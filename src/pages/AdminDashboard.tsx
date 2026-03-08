import { useEffect, useState } from "react";
import { store } from "@/lib/store";
import { useNavigate, Link } from "react-router-dom";
import { Exam, Notice, Question } from "@/lib/types";
import { Upload, BookOpen, Bell, LogOut, Plus, Trash2, Eye, EyeOff, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<"overview" | "exams" | "notices" | "upload">("overview");
  const [exams, setExams] = useState<Exam[]>(store.getExams());
  const [notices, setNotices] = useState<Notice[]>(store.getNotices());

  // CSV upload state
  const [csvQuestions, setCsvQuestions] = useState<Question[]>([]);
  const [csvPreview, setCsvPreview] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamSubject, setNewExamSubject] = useState("");
  const [newExamDifficulty, setNewExamDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [newExamDuration, setNewExamDuration] = useState(15);

  // Notice form
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");

  useEffect(() => {
    if (!store.isAdmin()) navigate("/admin");
  }, []);

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        toast({ title: "ত্রুটি", description: "CSV ফাইলে ডেটা নেই", variant: "destructive" });
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const questions: Question[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(",").map((v) => v.trim());
        if (vals.length < 7) {
          errors.push(`Row ${i + 1}: অপর্যাপ্ত কলাম`);
          continue;
        }

        const qIdx = headers.indexOf("questions");
        const o1 = headers.indexOf("option1");
        const o2 = headers.indexOf("option2");
        const o3 = headers.indexOf("option3");
        const o4 = headers.indexOf("option4");
        const o5 = headers.indexOf("option5");
        const ansIdx = headers.indexOf("answer");
        const expIdx = headers.indexOf("explanation");
        const secIdx = headers.indexOf("section");

        const questionText = vals[qIdx >= 0 ? qIdx : 0];
        if (!questionText) {
          errors.push(`Row ${i + 1}: প্রশ্ন খালি`);
          continue;
        }

        const options = [
          vals[o1 >= 0 ? o1 : 1],
          vals[o2 >= 0 ? o2 : 2],
          vals[o3 >= 0 ? o3 : 3],
          vals[o4 >= 0 ? o4 : 4],
        ].filter(Boolean);

        if (o5 >= 0 && vals[o5]) options.push(vals[o5]);

        questions.push({
          id: `csv-${Date.now()}-${i}`,
          question: questionText,
          options,
          answer: vals[ansIdx >= 0 ? ansIdx : 5] || options[0],
          explanation: vals[expIdx >= 0 ? expIdx : 6] || "",
          type: "mcq",
          section: vals[secIdx >= 0 ? secIdx : 8] || "General",
        });
      }

      if (errors.length > 0) {
        toast({ title: `${errors.length} সমস্যা পাওয়া গেছে`, description: errors.slice(0, 3).join("; "), variant: "destructive" });
      }

      setCsvQuestions(questions);
      setCsvPreview(true);
      toast({ title: "সফল!", description: `${questions.length}টি প্রশ্ন লোড হয়েছে` });
    };
    reader.readAsText(file);
  };

  const createExamFromCSV = () => {
    if (!newExamTitle || csvQuestions.length === 0) {
      toast({ title: "ত্রুটি", description: "শিরোনাম ও প্রশ্ন প্রয়োজন", variant: "destructive" });
      return;
    }

    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      title: newExamTitle,
      subject: newExamSubject || "সাধারণ",
      category: "আমদানি",
      chapter: csvQuestions[0]?.section || "General",
      difficulty: newExamDifficulty,
      questionCount: csvQuestions.length,
      duration: newExamDuration,
      questions: csvQuestions,
      published: true,
      featured: false,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updated = [...exams, newExam];
    setExams(updated);
    store.setExams(updated);
    setCsvQuestions([]);
    setCsvPreview(false);
    setNewExamTitle("");
    setNewExamSubject("");
    toast({ title: "পরীক্ষা তৈরি হয়েছে!", description: newExam.title });
    setTab("exams");
  };

  const togglePublish = (examId: string) => {
    const updated = exams.map((e) => e.id === examId ? { ...e, published: !e.published } : e);
    setExams(updated);
    store.setExams(updated);
  };

  const deleteExam = (examId: string) => {
    const updated = exams.filter((e) => e.id !== examId);
    setExams(updated);
    store.setExams(updated);
    toast({ title: "পরীক্ষা মুছে ফেলা হয়েছে" });
  };

  const addNotice = () => {
    if (!noticeTitle) return;
    const n: Notice = {
      id: `n-${Date.now()}`,
      title: noticeTitle,
      content: noticeContent,
      pinned: false,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [n, ...notices];
    setNotices(updated);
    store.setNotices(updated);
    setNoticeTitle("");
    setNoticeContent("");
    toast({ title: "নোটিস যুক্ত হয়েছে" });
  };

  const deleteNotice = (id: string) => {
    const updated = notices.filter((n) => n.id !== id);
    setNotices(updated);
    store.setNotices(updated);
  };

  const logout = () => {
    store.setAdmin(false);
    navigate("/admin");
  };

  const tabs = [
    { key: "overview" as const, label: "ড্যাশবোর্ড", icon: BookOpen },
    { key: "exams" as const, label: "পরীক্ষা", icon: FileText },
    { key: "notices" as const, label: "নোটিস", icon: Bell },
    { key: "upload" as const, label: "CSV আপলোড", icon: Upload },
  ];

  return (
    <div className="pt-20 pb-8 container min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">🔧 Admin Panel</h1>
        <button onClick={logout} className="flex items-center gap-1 text-sm text-destructive hover:underline">
          <LogOut size={16} /> লগআউট
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              tab === t.key ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <div className="glass-card-static p-5 text-center">
            <p className="text-3xl font-bold gradient-text">{exams.length}</p>
            <p className="text-xs text-muted-foreground mt-1">মোট পরীক্ষা</p>
          </div>
          <div className="glass-card-static p-5 text-center">
            <p className="text-3xl font-bold gradient-text">{exams.reduce((a, e) => a + e.questionCount, 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">মোট প্রশ্ন</p>
          </div>
          <div className="glass-card-static p-5 text-center">
            <p className="text-3xl font-bold gradient-text">{exams.filter((e) => e.published).length}</p>
            <p className="text-xs text-muted-foreground mt-1">প্রকাশিত</p>
          </div>
          <div className="glass-card-static p-5 text-center">
            <p className="text-3xl font-bold gradient-text">{notices.length}</p>
            <p className="text-xs text-muted-foreground mt-1">নোটিস</p>
          </div>
        </div>
      )}

      {/* Exams */}
      {tab === "exams" && (
        <div className="space-y-3 animate-fade-in">
          {exams.map((e) => (
            <div key={e.id} className="glass-card-static p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{e.title}</h3>
                <p className="text-xs text-muted-foreground">{e.subject} • {e.questionCount} প্রশ্ন</p>
              </div>
              <button onClick={() => togglePublish(e.id)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                {e.published ? <Eye size={16} className="text-success" /> : <EyeOff size={16} className="text-muted-foreground" />}
              </button>
              <button onClick={() => deleteExam(e.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                <Trash2 size={16} className="text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notices */}
      {tab === "notices" && (
        <div className="animate-fade-in">
          <div className="glass-card-static p-5 mb-4">
            <h3 className="font-semibold text-sm mb-3">নতুন নোটিস</h3>
            <input
              placeholder="শিরোনাম"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              className="w-full glass-strong rounded-xl px-4 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <textarea
              placeholder="বিবরণ"
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
              className="w-full glass-strong rounded-xl px-4 py-2.5 text-sm mb-3 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={addNotice} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              <Plus size={14} className="inline mr-1" /> যুক্ত করুন
            </button>
          </div>
          <div className="space-y-2">
            {notices.map((n) => (
              <div key={n.id} className="glass-card-static p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">{n.title}</h4>
                  <p className="text-xs text-muted-foreground">{n.createdAt}</p>
                </div>
                <button onClick={() => deleteNotice(n.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                  <Trash2 size={16} className="text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Upload */}
      {tab === "upload" && (
        <div className="animate-fade-in">
          <div className="glass-card-static p-8 text-center mb-4 border-2 border-dashed border-primary/30">
            <Upload className="mx-auto mb-3 text-primary" size={36} />
            <p className="text-sm font-medium mb-1">CSV ফাইল আপলোড করুন</p>
            <p className="text-xs text-muted-foreground mb-4">
              কলাম: questions, option1, option2, option3, option4, answer, explanation, type, section
            </p>
            <label className="cursor-pointer inline-block px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              ফাইল নির্বাচন করুন
              <input type="file" accept=".csv" onChange={handleCSV} className="hidden" />
            </label>
          </div>

          {csvPreview && csvQuestions.length > 0 && (
            <div className="glass-card-static p-5">
              <h3 className="font-semibold text-sm mb-3">📋 {csvQuestions.length}টি প্রশ্ন লোড হয়েছে</h3>

              <div className="max-h-48 overflow-y-auto mb-4 space-y-2">
                {csvQuestions.slice(0, 5).map((q, i) => (
                  <div key={i} className="text-xs p-2 bg-muted/50 rounded-lg">
                    <strong>{i + 1}.</strong> {q.question} — ✅ {q.answer}
                  </div>
                ))}
                {csvQuestions.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">...এবং আরও {csvQuestions.length - 5}টি</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <input
                  placeholder="পরীক্ষার নাম *"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="glass-strong rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  placeholder="বিষয়"
                  value={newExamSubject}
                  onChange={(e) => setNewExamSubject(e.target.value)}
                  className="glass-strong rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select
                  value={newExamDifficulty}
                  onChange={(e) => setNewExamDifficulty(e.target.value as "easy" | "medium" | "hard")}
                  className="glass-strong rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                >
                  <option value="easy">সহজ</option>
                  <option value="medium">মাঝারি</option>
                  <option value="hard">কঠিন</option>
                </select>
                <input
                  type="number"
                  placeholder="সময় (মিনিট)"
                  value={newExamDuration}
                  onChange={(e) => setNewExamDuration(Number(e.target.value))}
                  className="glass-strong rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <button
                onClick={createExamFromCSV}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                পরীক্ষা তৈরি করুন ✓
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
