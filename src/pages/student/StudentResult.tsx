import { useLocation, Link } from "react-router-dom";
import { ExamResult, Question } from "@/lib/types";
import { CheckCircle2, XCircle, MinusCircle, RotateCcw, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { store } from "@/lib/store";
import { isAnswerMatch, resolveCorrectOptionText } from "@/lib/answerUtils";

const StudentResult = () => {
  const location = useLocation();
  const { result, questions, originalQuestions } = (location.state || {}) as {
    result?: ExamResult;
    questions?: Question[];
    originalQuestions?: Question[];
  };
  const [showReview, setShowReview] = useState(false);
  const originalQuestionMap = useMemo(
    () => new Map((originalQuestions ?? []).map((q) => [q.id, q])),
    [originalQuestions]
  );

  // If no state, show history
  if (!result) {
    const results = store.getResults();
    return (
      <div className="pt-24 pb-8 container animate-fade-in">
        <h1 className="text-xl font-bold mb-5">📊 ফলাফল ইতিহাস</h1>
        {results.length === 0 ? (
          <div className="glass-card-static p-12 text-center text-muted-foreground">
            এখনও কোনো পরীক্ষা দেওয়া হয়নি
            <br />
            <Link to="/exams" className="text-primary text-sm mt-2 inline-block">পরীক্ষা দিন →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="glass-card-static p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{r.examTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    সঠিক: {r.correct} | ভুল: {r.wrong} | বাদ: {r.skipped}
                    {r.negativeMarks > 0 && ` | নেগেটিভ: -${r.negativeMarks.toFixed(2)}`}
                    {" • "}{new Date(r.timestamp).toLocaleDateString("bn-BD")}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${r.percentage >= 60 ? "text-success" : "text-destructive"}`}>{r.percentage}%</span>
                  <Link to={`/exams/${r.examId}/attempt`} className="block text-xs text-primary mt-1">আবার দিন →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const getMessage = () => {
    if (result.percentage >= 80) return { text: "অসাধারণ! 🏆", color: "text-success" };
    if (result.percentage >= 60) return { text: "ভালো করেছেন! 👏", color: "text-primary" };
    if (result.percentage >= 40) return { text: "আরও চেষ্টা করুন 💪", color: "text-warning" };
    return { text: "আবার চেষ্টা করুন 📚", color: "text-destructive" };
  };
  const msg = getMessage();

  return (
    <div className="pt-24 pb-8 container max-w-2xl mx-auto animate-fade-in">
      <div className="glass-card-static p-8 text-center mb-6">
        <div className="text-5xl font-extrabold gradient-text mb-2">{result.percentage}%</div>
        <p className={`text-lg font-bold ${msg.color} mb-1`}>{msg.text}</p>
        <p className="text-sm text-muted-foreground">{result.examTitle}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card-static p-4 text-center">
          <CheckCircle2 className="mx-auto mb-1 text-success" size={22} />
          <p className="text-xl font-bold">{result.correct}</p>
          <p className="text-xs text-muted-foreground">সঠিক</p>
        </div>
        <div className="glass-card-static p-4 text-center">
          <XCircle className="mx-auto mb-1 text-destructive" size={22} />
          <p className="text-xl font-bold">{result.wrong}</p>
          <p className="text-xs text-muted-foreground">ভুল</p>
        </div>
        <div className="glass-card-static p-4 text-center">
          <MinusCircle className="mx-auto mb-1 text-muted-foreground" size={22} />
          <p className="text-xl font-bold">{result.skipped}</p>
          <p className="text-xs text-muted-foreground">বাদ</p>
        </div>
        <div className="glass-card-static p-4 text-center">
          <AlertTriangle className="mx-auto mb-1 text-warning" size={22} />
          <p className="text-xl font-bold text-destructive">-{result.negativeMarks.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">নেগেটিভ</p>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="glass-card-static p-5 mb-6">
        <h3 className="text-sm font-semibold mb-3">📊 স্কোর বিশ্লেষণ</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">সঠিক উত্তর</span>
            <span className="font-medium">+{result.correct}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">নেগেটিভ মার্ক ({result.wrong} × নেগেটিভ)</span>
            <span className="font-medium text-destructive">-{result.negativeMarks.toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="font-semibold">চূড়ান্ত স্কোর</span>
            <span className="font-bold text-primary">{result.finalScore.toFixed(2)} / {result.maxScore}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Link to={`/exams/${result.examId}/attempt`} className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-xl px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
          <RotateCcw size={16} /> আবার চেষ্টা করুন
        </Link>
        <Link to="/exams" className="flex-1 inline-flex items-center justify-center text-sm text-center font-semibold rounded-xl px-4 py-3 glass hover:bg-muted/80 transition-all">অন্য পরীক্ষা</Link>
      </div>

      {questions && (
        <div>
          <button onClick={() => setShowReview(!showReview)} className="w-full glass-card-static p-4 flex items-center justify-between text-sm font-semibold mb-3">
            📖 উত্তর পর্যালোচনা
            {showReview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showReview && (
            <div className="space-y-3 animate-fade-in">
              {questions.map((q, i) => {
                const userAns = result.answers[q.id] || "";
                const sourceQuestion = originalQuestionMap.get(q.id) ?? q;
                const correctAnswer = resolveCorrectOptionText(sourceQuestion);
                const isSkipped = !userAns;
                const isCorrect = Boolean(userAns) && isAnswerMatch(userAns, correctAnswer);
                const isWrong = Boolean(userAns) && !isCorrect;
                const statusBadge = isCorrect
                  ? { text: "✅ সঠিক", cls: "bg-success/15 text-success border-success/30" }
                  : isWrong
                  ? { text: "❌ ভুল", cls: "bg-destructive/15 text-destructive border-destructive/30" }
                  : { text: "⏭ স্কিপ", cls: "bg-muted text-muted-foreground border-border" };
                return (
                  <div key={q.id} className="glass-card-static p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold"><span className="text-muted-foreground mr-2">{i + 1}.</span>{q.question}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ml-2 ${statusBadge.cls}`}>{statusBadge.text}</span>
                    </div>
                    {q.questionImage && (
                      <img src={q.questionImage} alt="" className="max-w-full max-h-48 rounded-lg border border-border mb-3 object-contain" />
                    )}
                    <div className="space-y-1.5 mb-3">
                      {q.options.map((opt, oi) => {
                        const isAnswer = opt === correctAnswer;
                        const isUser = opt === userAns;
                        let cls = "border-border";
                        if (isAnswer) cls = "border-success bg-success/10";
                        else if (isUser && !isCorrect) cls = "border-destructive bg-destructive/10";
                        return (
                          <div key={opt} className={`px-3 py-2 rounded-lg text-xs border ${cls}`}>
                            <div className="flex items-center gap-2">
                              {isAnswer && <CheckCircle2 size={14} className="text-success flex-shrink-0" />}
                              {isUser && !isCorrect && <XCircle size={14} className="text-destructive flex-shrink-0" />}
                              {opt}
                            </div>
                            {q.optionImages?.[oi] && (
                              <img src={q.optionImages[oi]!} alt="" className="mt-2 max-h-20 rounded border border-border object-contain" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">💡 <strong>ব্যাখ্যা:</strong> {q.explanation}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentResult;
