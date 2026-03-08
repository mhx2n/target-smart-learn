import { useLocation, Link, useNavigate } from "react-router-dom";
import { ExamResult, Question } from "@/lib/types";
import { CheckCircle2, XCircle, MinusCircle, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, questions } = (location.state || {}) as { result?: ExamResult; questions?: Question[] };
  const [showReview, setShowReview] = useState(false);

  if (!result) {
    return (
      <div className="pt-24 container text-center min-h-screen">
        <p className="text-muted-foreground">ফলাফল পাওয়া যায়নি</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block">হোমে যান</Link>
      </div>
    );
  }

  const getMessage = () => {
    if (result.score >= 80) return { text: "অসাধারণ! 🏆", color: "text-success" };
    if (result.score >= 60) return { text: "ভালো করেছেন! 👏", color: "text-primary" };
    if (result.score >= 40) return { text: "আরও চেষ্টা করুন 💪", color: "text-warning" };
    return { text: "আবার চেষ্টা করুন 📚", color: "text-destructive" };
  };

  const msg = getMessage();

  return (
    <div className="pt-24 pb-8 container max-w-2xl min-h-screen">
      <div className="glass-card-static p-8 text-center mb-6">
        <div className="text-5xl font-extrabold gradient-text mb-2">{result.score}%</div>
        <p className={`text-lg font-bold ${msg.color} mb-1`}>{msg.text}</p>
        <p className="text-sm text-muted-foreground">{result.examTitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
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
      </div>

      <div className="flex gap-3 mb-6">
        <Link
          to={`/exams/${result.examId}/attempt`}
          className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-xl px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <RotateCcw size={16} /> আবার চেষ্টা করুন
        </Link>
        <Link
          to="/exams"
          className="flex-1 btn-glass text-sm text-center font-semibold"
        >
          অন্য পরীক্ষা
        </Link>
      </div>

      {/* Answer review */}
      {questions && (
        <div>
          <button
            onClick={() => setShowReview(!showReview)}
            className="w-full glass-card-static p-4 flex items-center justify-between text-sm font-semibold mb-3"
          >
            📖 উত্তর পর্যালোচনা
            {showReview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showReview && (
            <div className="space-y-3 animate-fade-in">
              {questions.map((q, i) => {
                const userAns = result.answers[q.id];
                const isCorrect = userAns === q.answer;
                const isSkipped = !userAns;

                return (
                  <div key={q.id} className="glass-card-static p-4">
                    <p className="text-sm font-semibold mb-3">
                      <span className="text-muted-foreground mr-2">{i + 1}.</span>
                      {q.question}
                    </p>
                    <div className="space-y-1.5 mb-3">
                      {q.options.map((opt) => {
                        const isAnswer = opt === q.answer;
                        const isUser = opt === userAns;
                        let cls = "border-border";
                        if (isAnswer) cls = "border-success bg-success/10";
                        else if (isUser && !isCorrect) cls = "border-destructive bg-destructive/10";

                        return (
                          <div key={opt} className={`px-3 py-2 rounded-lg text-xs border ${cls} flex items-center gap-2`}>
                            {isAnswer && <CheckCircle2 size={14} className="text-success flex-shrink-0" />}
                            {isUser && !isCorrect && <XCircle size={14} className="text-destructive flex-shrink-0" />}
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                        💡 <strong>ব্যাখ্যা:</strong> {q.explanation}
                      </div>
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

export default ResultPage;
