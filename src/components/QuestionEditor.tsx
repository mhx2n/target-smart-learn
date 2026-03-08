import { useState } from "react";
import { Question, Exam } from "@/lib/types";
import { store } from "@/lib/store";
import { compressImage } from "@/lib/imageUtils";
import { X, ImagePlus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  exam: Exam;
  onClose: () => void;
  onSaved: (exam: Exam) => void;
}

const QuestionEditor = ({ exam, onClose, onSaved }: Props) => {
  const [questions, setQuestions] = useState<Question[]>(JSON.parse(JSON.stringify(exam.questions)));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  const updateQ = (id: string, patch: Partial<Question>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const handleQuestionImage = async (qId: string, file: File) => {
    try {
      const compressed = await compressImage(file);
      updateQ(qId, { questionImage: compressed });
    } catch { toast({ title: "ছবি লোড করতে সমস্যা", variant: "destructive" }); }
  };

  const handleOptionImage = async (qId: string, optIndex: number, file: File) => {
    try {
      const compressed = await compressImage(file, 400, 300, 0.5);
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id !== qId) return q;
          const imgs = [...(q.optionImages || q.options.map(() => null))];
          imgs[optIndex] = compressed;
          return { ...q, optionImages: imgs };
        })
      );
    } catch { toast({ title: "ছবি লোড করতে সমস্যা", variant: "destructive" }); }
  };

  const removeQuestionImage = (qId: string) => updateQ(qId, { questionImage: undefined });

  const removeOptionImage = (qId: string, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const imgs = [...(q.optionImages || q.options.map(() => null))];
        imgs[optIndex] = null;
        return { ...q, optionImages: imgs };
      })
    );
  };

  const saveAll = () => {
    const updatedExam = { ...exam, questions };
    const allExams = store.getExams().map((e) => (e.id === exam.id ? updatedExam : e));
    store.setExams(allExams);
    onSaved(updatedExam);
    toast({ title: "✅ প্রশ্ন সংরক্ষিত হয়েছে" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-card rounded-2xl w-full max-w-3xl shadow-2xl border border-border my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
          <div>
            <h2 className="font-bold text-sm">✏️ প্রশ্ন সম্পাদনা</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{exam.title} • {questions.length} প্রশ্ন</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={saveAll} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              <Save size={14} /> সংরক্ষণ
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X size={18} /></button>
          </div>
        </div>

        {/* Questions */}
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {questions.map((q, qi) => {
            const isOpen = expandedId === q.id;
            return (
              <div key={q.id} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isOpen ? null : q.id)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium truncate flex-1">
                    <span className="text-muted-foreground mr-2">{qi + 1}.</span>
                    {q.question.slice(0, 80)}{q.question.length > 80 ? "..." : ""}
                  </span>
                  <div className="flex items-center gap-2 ml-2">
                    {q.questionImage && <span className="text-xs text-primary">🖼️</span>}
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 pt-0 space-y-4 animate-fade-in">
                    {/* Question text */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">প্রশ্ন</label>
                      <textarea
                        value={q.question}
                        onChange={(e) => updateQ(q.id, { question: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    {/* Question image */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">প্রশ্নের ছবি</label>
                      {q.questionImage ? (
                        <div className="relative inline-block">
                          <img src={q.questionImage} alt="" className="max-h-40 rounded-lg border border-border" />
                          <button onClick={() => removeQuestionImage(q.id)} className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground shadow">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:border-primary/50 hover:text-primary transition-colors">
                          <ImagePlus size={14} /> ছবি যোগ করুন
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleQuestionImage(q.id, e.target.files[0])} />
                        </label>
                      )}
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                      <label className="text-xs font-medium text-muted-foreground block">অপশনসমূহ</label>
                      {q.options.map((opt, oi) => (
                        <div key={oi} className={`p-3 rounded-lg border ${opt === q.answer ? "border-success/50 bg-success/5" : "border-border"}`}>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-muted text-xs flex items-center justify-center font-medium flex-shrink-0">
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <input
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...q.options];
                                const wasAnswer = q.answer === opt;
                                newOpts[oi] = e.target.value;
                                updateQ(q.id, { options: newOpts, ...(wasAnswer ? { answer: e.target.value } : {}) });
                              }}
                              className="flex-1 bg-transparent text-sm focus:outline-none"
                            />
                            <button
                              onClick={() => updateQ(q.id, { answer: opt })}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${opt === q.answer ? "bg-success/20 text-success" : "bg-muted text-muted-foreground hover:bg-success/10"}`}
                            >
                              {opt === q.answer ? "✅ সঠিক" : "সঠিক?"}
                            </button>
                          </div>

                          {/* Option image */}
                          <div className="mt-2 ml-8">
                            {q.optionImages?.[oi] ? (
                              <div className="relative inline-block">
                                <img src={q.optionImages[oi]!} alt="" className="max-h-24 rounded-lg border border-border" />
                                <button onClick={() => removeOptionImage(q.id, oi)} className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-destructive text-destructive-foreground shadow">
                                  <X size={10} />
                                </button>
                              </div>
                            ) : (
                              <label className="inline-flex items-center gap-1 px-2 py-1 rounded border border-dashed border-border text-[10px] text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors">
                                <ImagePlus size={10} /> ছবি
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleOptionImage(q.id, oi, e.target.files[0])} />
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">ব্যাখ্যা</label>
                      <textarea
                        value={q.explanation}
                        onChange={(e) => updateQ(q.id, { explanation: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-[50px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;
