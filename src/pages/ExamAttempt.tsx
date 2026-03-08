import { useParams, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { useState, useEffect, useMemo } from "react";
import { ExamResult, Question } from "@/lib/types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ExamAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const exam = store.getExams().find((e) => e.id === id);

  const questions = useMemo(() => {
    if (!exam) return [];
    return shuffle(exam.questions).map((q) => ({
      ...q,
      options: shuffle(q.options),
    }));
  }, [exam?.id]);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState((exam?.duration || 10) * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  if (!exam) {
    return <div className="pt-24 container text-center min-h-screen text-muted-foreground">পরীক্ষা পাওয়া যায়নি</div>;
  }

  const q = questions[current];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const selectAnswer = (opt: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: opt }));
  };

  const handleSubmit = () => {
    let correct = 0, wrong = 0, skipped = 0;
    questions.forEach((question) => {
      const ans = answers[question.id];
      if (!ans) skipped++;
      else if (ans === question.answer) correct++;
      else wrong++;
    });

    const result: ExamResult = {
      examId: exam.id,
      examTitle: exam.title,
      totalQuestions: questions.length,
      correct,
      wrong,
      skipped,
      score: Math.round((correct / questions.length) * 100),
      answers,
      timestamp: new Date().toISOString(),
    };
    store.addResult(result);
    navigate(`/results`, { state: { result, questions } });
  };

  return (
    <div className="pt-20 pb-8 container max-w-3xl min-h-screen">
      {/* Header */}
      <div className="glass-card-static p-4 mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-sm truncate flex-1">{exam.title}</h2>
        <span className={`text-sm font-mono font-bold px-3 py-1 rounded-full ${timeLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
        </span>
      </div>

      {/* Question palette */}
      <div className="glass-card-static p-3 mb-4 flex flex-wrap gap-2">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
              i === current
                ? "bg-primary text-primary-foreground"
                : answers[questions[i].id]
                ? "bg-success/20 text-success"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <div className="glass-card-static p-6 mb-4">
        <p className="text-xs text-muted-foreground mb-2">
          প্রশ্ন {current + 1} / {questions.length}
        </p>
        <h3 className="text-lg font-semibold mb-5">{q.question}</h3>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => selectAnswer(opt)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                answers[q.id] === opt
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border hover:border-primary/30 hover:bg-primary/5"
              }`}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs mr-3">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="btn-glass text-sm disabled:opacity-40"
        >
          ← আগের
        </button>
        {current === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-6 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            জমা দিন ✓
          </button>
        ) : (
          <button
            onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))}
            className="btn-glass text-sm"
          >
            পরের →
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamAttempt;
