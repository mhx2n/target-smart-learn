import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWrongAnswers, deleteWrongAnswersByExam, WrongAnswerEntry } from "@/lib/api";
import { CheckCircle2, XCircle, Trash2, ArrowLeft, Sparkles } from "lucide-react";
import { isAnswerMatch } from "@/lib/answerUtils";
import { QuestionChatModal } from "@/components/QuestionChatModal";

const WrongAnswersBank = () => {
  const [entries, setEntries] = useState<WrongAnswerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatQuestion, setChatQuestion] = useState<WrongAnswerEntry | null>(null);

  const load = () => {
    setLoading(true);
    fetchWrongAnswers().then(setEntries).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Group by exam
  const grouped = entries.reduce<Record<string, { title: string; examId: string; items: WrongAnswerEntry[] }>>((acc, e) => {
    if (!acc[e.examId]) acc[e.examId] = { title: e.examTitle, examId: e.examId, items: [] };
    acc[e.examId].items.push(e);
    return acc;
  }, {});

  const handleDeleteExam = async (examId: string) => {
    await deleteWrongAnswersByExam(examId);
    load();
  };

  if (loading) {
    return <div className="pt-24 pb-8 container animate-fade-in text-center text-muted-foreground">লোড হচ্ছে...</div>;
  }

  return (
    <div className="pt-24 pb-8 container max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold">📕 ভুল উত্তর ব্যাংক</h1>
      </div>

      {entries.length === 0 ? (
        <div className="glass-card-static p-12 text-center text-muted-foreground">
          কোনো ভুল উত্তর সংরক্ষিত নেই
          <br />
          <Link to="/exams" className="text-primary text-sm mt-2 inline-block">পরীক্ষা দিন →</Link>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">মোট {entries.length}টি ভুল উত্তর • {Object.keys(grouped).length}টি পরীক্ষা থেকে</p>
          
          {Object.values(grouped).map((group) => (
            <div key={group.examId}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-foreground">{group.title}</h2>
                <button onClick={() => handleDeleteExam(group.examId)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                  <Trash2 size={13} /> মুছুন
                </button>
              </div>
              <div className="space-y-3">
                {group.items.map((entry, i) => (
                  <div key={entry.id || i} className="glass-card-static p-5 border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-4">
                        <p className="text-base font-semibold leading-relaxed">
                          <span className="text-muted-foreground mr-3 font-mono">{i + 1}.</span>
                          <span>{entry.questionText}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => setChatQuestion(entry)}
                        className="ml-2 p-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center flex-shrink-0 group"
                        title="AI সহায়তা নিন"
                      >
                        <Sparkles size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="sr-only">AI সহায়তা</span>
                      </button>
                    </div>
                    {entry.questionImage && <img src={entry.questionImage} alt="প্রশ্নের ছবি" className="max-w-full max-h-48 rounded-xl border border-border/30 mb-4 object-contain shadow-sm" />}
                    <div className="space-y-3 mb-4">
                      {entry.options.map((opt, oi) => {
                        const isCorrectOpt = isAnswerMatch(opt, entry.correctAnswer);
                        const isUserOpt = isAnswerMatch(opt, entry.userAnswer);
                        let cls = "border-border/30";
                        if (isCorrectOpt) cls = "border-success bg-success/10 shadow-success/20";
                        else if (isUserOpt) cls = "border-destructive bg-destructive/10 shadow-destructive/20";
                        return (
                          <div key={opt} className={`px-4 py-3 rounded-xl text-sm border ${cls} shadow-sm transition-colors`}>
                            <div className="flex items-center gap-3">
                              {isCorrectOpt && <CheckCircle2 size={18} className="text-success flex-shrink-0" />}
                              {isUserOpt && !isCorrectOpt && <XCircle size={18} className="text-destructive flex-shrink-0" />}
                              <span className="leading-relaxed">{opt}</span>
                            </div>
                            {entry.optionImages?.[oi] && <img src={entry.optionImages[oi]!} alt="অপশনের ছবি" className="mt-3 max-h-24 rounded-lg border border-border/30 object-contain shadow-sm" />}
                          </div>
                        );
                      })}
                    </div>
                    {entry.explanation && (
                      <div className="text-sm bg-gradient-to-r from-muted/80 to-muted/50 rounded-xl p-4 mt-3 border border-border/30">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">💡</span>
                          <div>
                            <strong className="text-foreground">ব্যাখ্যা:</strong>
                            <p className="mt-1 leading-relaxed text-muted-foreground">{entry.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Chat Modal */}
      {chatQuestion && (
        <QuestionChatModal
          isOpen={!!chatQuestion}
          onClose={() => setChatQuestion(null)}
          questionContext={chatQuestion}
        />
      )}
    </div>
  );
};

export default WrongAnswersBank;
