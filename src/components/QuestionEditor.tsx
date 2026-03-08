import { useState } from "react";
import { Question, Exam } from "@/lib/types";
import { store } from "@/lib/store";
import { compressImage } from "@/lib/imageUtils";
import { X, ImagePlus, Save, ChevronDown, ChevronUp } from "lucide-react";
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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base sm:text-lg">✏️ প্রশ্ন সম্পাদনা</h2>
            <p className="text-sm text-muted-foreground">{exam.title} • {questions.length} প্রশ্ন</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveAll} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              <Save size={16} /> সংরক্ষণ
            </button>
            <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-muted transition-colors">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 px-4 sm:px-6 py-5 space-y-4 max-w-4xl mx-auto w-full">
          {questions.map((q, qi) => {
            const isOpen = expandedId === q.id;
            return (
              <div key={q.id} className="border border-border rounded-2xl overflow-hidden bg-card">
                {/* Accordion header */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : q.id)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm sm:text-base font-medium truncate flex-1">
                    <span className="text-muted-foreground mr-2 font-bold">{qi + 1}.</span>
                    {q.question.slice(0, 100)}{q.question.length > 100 ? "..." : ""}
                  </span>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {q.questionImage && <span className="text-sm">🖼️</span>}
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 space-y-5 animate-fade-in">
                    {/* Question text */}
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">📝 প্রশ্ন</label>
                      <textarea
                        value={q.question}
                        onChange={(e) => updateQ(q.id, { question: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    {/* Question image */}
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">🖼️ প্রশ্নের ছবি</label>
                      {q.questionImage ? (
                        <div className="relative inline-block">
                          <img src={q.questionImage} alt="" className="max-w-full max-h-56 rounded-xl border border-border" />
                          <button onClick={() => removeQuestionImage(q.id)} className="absolute top-2 right-2 p-2 rounded-full bg-destructive text-destructive-foreground shadow-lg">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-3 w-full py-8 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground cursor-pointer hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all">
                          <ImagePlus size={24} />
                          <span>ছবি যোগ করতে ট্যাপ করুন</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleQuestionImage(q.id, e.target.files[0])} />
                        </label>
                      )}
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-foreground block">📋 অপশনসমূহ</label>
                      {q.options.map((opt, oi) => (
                        <div key={oi} className={`p-4 rounded-xl border-2 ${opt === q.answer ? "border-success/60 bg-success/5" : "border-border"}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="w-9 h-9 rounded-full bg-muted text-sm flex items-center justify-center font-bold flex-shrink-0">
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
                              className="flex-1 bg-transparent text-base font-medium focus:outline-none border-b border-transparent focus:border-primary/30 pb-1"
                            />
                          </div>

                          <div className="flex items-center gap-3 ml-12">
                            <button
                              onClick={() => updateQ(q.id, { answer: opt })}
                              className={`text-xs px-4 py-2 rounded-lg font-semibold transition-all ${opt === q.answer ? "bg-success/20 text-success" : "bg-muted text-muted-foreground hover:bg-success/10 hover:text-success"}`}
                            >
                              {opt === q.answer ? "✅ সঠিক উত্তর" : "সঠিক করুন"}
                            </button>

                            {/* Option image */}
                            {q.optionImages?.[oi] ? (
                              <div className="relative inline-block">
                                <img src={q.optionImages[oi]!} alt="" className="max-h-32 rounded-lg border border-border" />
                                <button onClick={() => removeOptionImage(q.id, oi)} className="absolute top-1 right-1 p-1.5 rounded-full bg-destructive text-destructive-foreground shadow-lg">
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:border-primary/50 hover:text-primary transition-all">
                                <ImagePlus size={16} />
                                <span>ছবি যোগ</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleOptionImage(q.id, oi, e.target.files[0])} />
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">💡 ব্যাখ্যা</label>
                      <textarea
                        value={q.explanation}
                        onChange={(e) => updateQ(q.id, { explanation: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base min-h-[70px] focus:outline-none focus:ring-2 focus:ring-primary/30"
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
