import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWrongAnswers, deleteWrongAnswersByExam, WrongAnswerEntry } from "@/lib/api";
import { CheckCircle2, XCircle, Trash2, ArrowLeft } from "lucide-react";
import { isAnswerMatch } from "@/lib/answerUtils";

const WrongAnswersBank = () => {
  const [entries, setEntries] = useState<WrongAnswerEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
                  <div key={entry.id || i} className="glass-card-static p-4">
                    <p className="text-base font-semibold mb-3">
                      <span className="text-muted-foreground mr-2">{i + 1}.</span>{entry.questionText}
                    </p>
                    {entry.questionImage && <img src={entry.questionImage} alt="" className="max-w-full max-h-48 rounded-lg border border-border mb-3 object-contain" />}
                    <div className="space-y-2 mb-3">
                      {entry.options.map((opt, oi) => {
                        const isCorrectOpt = isAnswerMatch(opt, entry.correctAnswer);
                        const isUserOpt = isAnswerMatch(opt, entry.userAnswer);
                        let cls = "border-border";
                        if (isCorrectOpt) cls = "border-success bg-success/10";
                        else if (isUserOpt) cls = "border-destructive bg-destructive/10";
                        return (
                          <div key={opt} className={`px-4 py-3 rounded-lg text-sm border ${cls}`}>
                            <div className="flex items-center gap-2">
                              {isCorrectOpt && <CheckCircle2 size={16} className="text-success flex-shrink-0" />}
                              {isUserOpt && !isCorrectOpt && <XCircle size={16} className="text-destructive flex-shrink-0" />}
                              <span>{opt}</span>
                            </div>
                            {entry.optionImages?.[oi] && <img src={entry.optionImages[oi]!} alt="" className="mt-2 max-h-24 rounded border border-border object-contain" />}
                          </div>
                        );
                      })}
                    </div>
                    {entry.explanation && <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 mt-2">💡 <strong>ব্যাখ্যা:</strong> {entry.explanation}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WrongAnswersBank;
