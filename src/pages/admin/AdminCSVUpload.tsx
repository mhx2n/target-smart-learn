import { useState } from "react";
import { useUpsertExam } from "@/hooks/useSupabaseData";
import { Exam, Question } from "@/lib/types";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const AdminCSVUpload = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const upsertExam = useUpsertExam();

  const [csvQuestions, setCsvQuestions] = useState<Question[]>([]);
  const [csvPreview, setCsvPreview] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamSubject, setNewExamSubject] = useState("");
  const [newExamDifficulty, setNewExamDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [newExamDuration, setNewExamDuration] = useState(15);
  const [newExamNegativeMarking, setNewExamNegativeMarking] = useState(0.25);
  const [dragOver, setDragOver] = useState(false);
  const [importSummary, setImportSummary] = useState<{ total: number; imported: number; skipped: number; errors: string[] } | null>(null);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { result.push(current.trim()); current = ""; }
        else { current += ch; }
      }
    }
    result.push(current.trim());
    return result;
  };

  const reassembleCSVLines = (text: string): string[] => {
    const rawLines = text.split("\n");
    const result: string[] = [];
    let buffer = "";
    let open = false;
    for (const line of rawLines) {
      if (!open) { buffer = line; } else { buffer += "\n" + line; }
      const quoteCount = (buffer.match(/"/g) || []).length;
      open = quoteCount % 2 !== 0;
      if (!open) { if (buffer.trim()) result.push(buffer); buffer = ""; }
    }
    if (buffer.trim()) result.push(buffer);
    return result;
  };

  const parseCSV = (text: string) => {
    const lines = reassembleCSVLines(text);
    if (lines.length < 2) {
      toast({ title: "ত্রুটি", description: "CSV ফাইলে ডেটা নেই", variant: "destructive" });
      return;
    }

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
    const questions: Question[] = [];
    const errors: string[] = [];
    const seen = new Set<string>();
    let skippedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      if (vals.length < 6) { errors.push(`Row ${i + 1}: অপর্যাপ্ত কলাম`); skippedCount++; continue; }

      const qIdx = headers.indexOf("questions");
      const o1 = headers.indexOf("option1"), o2 = headers.indexOf("option2");
      const o3 = headers.indexOf("option3"), o4 = headers.indexOf("option4"), o5 = headers.indexOf("option5");
      const ansIdx = headers.indexOf("answer");
      const expIdx = headers.indexOf("explanation");
      const secIdx = headers.indexOf("section");

      const questionText = vals[qIdx >= 0 ? qIdx : 0];
      if (!questionText) { errors.push(`Row ${i + 1}: প্রশ্ন খালি`); skippedCount++; continue; }

      if (seen.has(questionText.toLowerCase())) { errors.push(`Row ${i + 1}: ডুপ্লিকেট প্রশ্ন`); skippedCount++; continue; }
      seen.add(questionText.toLowerCase());

      const options = [vals[o1 >= 0 ? o1 : 1], vals[o2 >= 0 ? o2 : 2], vals[o3 >= 0 ? o3 : 3], vals[o4 >= 0 ? o4 : 4]].filter(Boolean);
      if (o5 >= 0 && vals[o5]) options.push(vals[o5]);

      if (options.length < 2) { errors.push(`Row ${i + 1}: অপর্যাপ্ত অপশন`); skippedCount++; continue; }

      questions.push({
        id: crypto.randomUUID(),
        question: questionText,
        options,
        answer: vals[ansIdx >= 0 ? ansIdx : 5] || options[0],
        explanation: expIdx >= 0 ? (vals[expIdx] || "") : "",
        type: "mcq",
        section: (secIdx >= 0 ? vals[secIdx] : "") || "1",
      });
    }

    setImportSummary({ total: lines.length - 1, imported: questions.length, skipped: skippedCount, errors });
    if (errors.length > 0) {
      toast({ title: `${skippedCount} সারি বাদ পড়েছে`, description: errors.slice(0, 3).join("; "), variant: "destructive" });
    }
    setCsvQuestions(questions);
    setCsvPreview(true);
    toast({ title: "সফল!", description: `${questions.length}টি প্রশ্ন লোড হয়েছে (${skippedCount}টি বাদ)` });
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => parseCSV(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) handleFile(file);
  };

  const createExamFromCSV = () => {
    if (!newExamTitle || csvQuestions.length === 0) {
      toast({ title: "ত্রুটি", description: "শিরোনাম ও প্রশ্ন প্রয়োজন", variant: "destructive" });
      return;
    }

    const newExam: Exam = {
      id: crypto.randomUUID(),
      title: newExamTitle,
      subject: newExamSubject || "সাধারণ",
      category: "আমদানি",
      chapter: csvQuestions[0]?.section || "1",
      difficulty: newExamDifficulty,
      questionCount: csvQuestions.length,
      duration: newExamDuration,
      negativeMarking: newExamNegativeMarking,
      questions: csvQuestions,
      published: true,
      featured: false,
      createdAt: new Date().toISOString().split("T")[0],
    };

    upsertExam.mutate(newExam, {
      onSuccess: () => {
        setCsvQuestions([]); setCsvPreview(false); setNewExamTitle(""); setNewExamSubject(""); setImportSummary(null);
        toast({ title: "পরীক্ষা তৈরি হয়েছে!", description: newExam.title });
        navigate("/admin/exams");
      },
    });
  };

  const sections = [...new Set(csvQuestions.map((q) => q.section))];

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-5">📤 CSV আপলোড</h1>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`glass-card-static p-8 text-center mb-5 border-2 border-dashed transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-primary/30"}`}
      >
        <Upload className="mx-auto mb-3 text-primary" size={36} />
        <p className="text-sm font-medium mb-1">CSV ফাইল আপলোড করুন বা ড্র্যাগ করুন</p>
        <p className="text-xs text-muted-foreground mb-4">কলাম: questions, option1, option2, option3, option4, option5, answer, explanation, type, section</p>
        <label className="cursor-pointer inline-block px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
          ফাইল নির্বাচন করুন
          <input type="file" accept=".csv" onChange={handleCSV} className="hidden" />
        </label>
      </div>

      {importSummary && (
        <div className="glass-card-static p-4 mb-5">
          <h3 className="font-semibold text-sm mb-3">📊 আমদানি সারাংশ</h3>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="p-3 rounded-xl bg-muted"><p className="text-lg font-bold">{importSummary.total}</p><p className="text-xs text-muted-foreground">মোট সারি</p></div>
            <div className="p-3 rounded-xl bg-success/10"><p className="text-lg font-bold text-success">{importSummary.imported}</p><p className="text-xs text-muted-foreground">আমদানি</p></div>
            <div className="p-3 rounded-xl bg-destructive/10"><p className="text-lg font-bold text-destructive">{importSummary.skipped}</p><p className="text-xs text-muted-foreground">বাদ</p></div>
          </div>
          {importSummary.errors.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-destructive cursor-pointer">ত্রুটি তালিকা ({importSummary.errors.length})</summary>
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {importSummary.errors.map((e, i) => (<p key={i} className="text-xs text-destructive/80 bg-destructive/5 p-1.5 rounded">{e}</p>))}
              </div>
            </details>
          )}
        </div>
      )}

      {csvPreview && csvQuestions.length > 0 && (
        <div className="glass-card-static p-5">
          <h3 className="font-semibold text-sm mb-3">📋 {csvQuestions.length}টি প্রশ্ন লোড হয়েছে</h3>
          {sections.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {sections.map((s) => (<span key={s} className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full">{s}: {csvQuestions.filter((q) => q.section === s).length}</span>))}
            </div>
          )}
          <div className="max-h-48 overflow-y-auto mb-4 space-y-2">
            {csvQuestions.slice(0, 5).map((q, i) => (
              <div key={i} className="text-xs p-2 bg-muted/50 rounded-lg"><strong>{i + 1}.</strong> {q.question} — ✅ {q.answer}</div>
            ))}
            {csvQuestions.length > 5 && (<p className="text-xs text-muted-foreground text-center">...এবং আরও {csvQuestions.length - 5}টি</p>)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <input placeholder="পরীক্ষার নাম *" value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)} className="glass-strong rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input placeholder="বিষয়" value={newExamSubject} onChange={(e) => setNewExamSubject(e.target.value)} className="glass-strong rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <select value={newExamDifficulty} onChange={(e) => setNewExamDifficulty(e.target.value as "easy" | "medium" | "hard")} className="glass-strong rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="easy">সহজ</option><option value="medium">মাঝারি</option><option value="hard">কঠিন</option>
            </select>
            <input type="number" placeholder="সময় (মিনিট)" value={newExamDuration} onChange={(e) => setNewExamDuration(Number(e.target.value))} className="glass-strong rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <select value={newExamNegativeMarking} onChange={(e) => setNewExamNegativeMarking(Number(e.target.value))} className="glass-strong rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value={0}>নেগেটিভ মার্ক: ০</option><option value={0.25}>নেগেটিভ মার্ক: ০.২৫</option><option value={0.5}>নেগেটিভ মার্ক: ০.৫</option><option value={1}>নেগেটিভ মার্ক: ১</option>
            </select>
          </div>
          <button onClick={createExamFromCSV} disabled={upsertExam.isPending}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all">
            {upsertExam.isPending ? "সেভ হচ্ছে..." : "পরীক্ষা তৈরি করুন ✓"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminCSVUpload;
