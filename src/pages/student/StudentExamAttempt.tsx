import { useParams, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ExamResult } from "@/lib/types";
import { List, X, Clock, AlertTriangle } from "lucide-react";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const StudentExamAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const exam = store.getExams().find((e) => e.id === id);

  const questions = useMemo(() => {
    if (!exam) return [];
    return shuffle(exam.questions).map((q) => ({ ...q, options: shuffle(q.options) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.id]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState((exam?.duration || 10) * 60);
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;
  const [showPalette, setShowPalette] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const negativeMarking = exam?.negativeMarking ?? 0.25;

  const doSubmit = useCallback(() => {
    if (submitted || !exam) return;
    setSubmitted(true);

    const currentAnswers = answersRef.current;
    let correct = 0, wrong = 0, skipped = 0;
    questions.forEach((question) => {
      const ans = currentAnswers[question.id];
      if (!ans) skipped++;
      else if (ans === question.answer) correct++;
      else wrong++;
    });

    const negativeMarks = wrong * negativeMarking;
    const rawScore = correct - negativeMarks;
    const finalScore = Math.max(0, rawScore);
    const maxScore = questions.length;
    const percentage = Math.round((finalScore / maxScore) * 100);

    const result: ExamResult = {
      examId: exam.id,
      examTitle: exam.title,
      totalQuestions: questions.length,
      correct,
      wrong,
      skipped,
      negativeMarks,
      finalScore,
      maxScore,
      percentage,
      answers: currentAnswers,
      timestamp: new Date().toISOString(),
    };
    store.addResult(result);
    navigate("/results", { state: { result, questions } });
  }, [submitted, exam, questions, negativeMarking, navigate]);

  const submittedRef = useRef(false);
  submittedRef.current = submitted;
  const doSubmitRef = useRef(doSubmit);
  doSubmitRef.current = doSubmit;

  useEffect(() => {
    if (submittedRef.current) return;
    const t = setInterval(() => {
      if (submittedRef.current) { clearInterval(t); return; }
      setTimeLeft((p) => {
        if (p <= 1) {
          clearInterval(t);
          setTimeout(() => doSubmitRef.current(), 0);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToQuestion = useCallback((index: number) => {
    questionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
    setShowPalette(false);
  }, []);

  if (!exam) return <div className="text-center py-20 text-muted-foreground">পরীক্ষা পাওয়া যায়নি</div>;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  const selectAnswer = (qId: string, opt: string) => setAnswers((prev) => ({ ...prev, [qId]: opt }));

  return (
    <div className="pt-24 pb-24 container max-w-3xl mx-auto animate-fade-in relative">
      {/* Floating Timer */}
      {createPortal(
        <div
          style={{ position: "fixed", top: 16, right: 16, zIndex: 9999 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow-lg font-mono text-sm font-bold transition-all ${
            timeLeft < 60
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : timeLeft < 300
              ? "bg-warning text-warning-foreground"
              : "bg-card border border-border"
          }`}
        >
          <Clock size={16} />
          {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="glass-card-static p-4 mb-4">
        <h2 className="font-semibold text-sm truncate">{exam.title}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          মোট: {questions.length} প্রশ্ন • উত্তর দেওয়া: {answeredCount} • নেগেটিভ মার্ক: {negativeMarking}
        </p>
      </div>

      {/* Scroll-based Questions */}
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div
            key={q.id}
            ref={(el) => { questionRefs.current[i] = el; }}
            className="glass-card-static p-5"
          >
            <p className="text-xs text-muted-foreground mb-2">প্রশ্ন {i + 1} / {questions.length}</p>
            <h3 className="text-base font-semibold mb-4">{q.question}</h3>
            <div className="space-y-2.5">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => selectAnswer(q.id, opt)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                    answers[q.id] === opt
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs mr-3 flex-shrink-0">
                    {String.fromCharCode(65 + oi)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      {createPortal(
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9998 }} className="bg-card/90 backdrop-blur-2xl border-t border-border p-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <button
              onClick={() => setShowPalette(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-muted hover:bg-muted/80 transition-all"
            >
              <List size={16} />
              প্রশ্ন তালিকা
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              জমা দিন ✓
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Question Palette Modal */}
      {showPalette && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 10000 }}
          className="flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
          onClick={() => setShowPalette(false)}
        >
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">📋 প্রশ্ন তালিকা</h3>
              <button onClick={() => setShowPalette(false)} className="p-1 rounded-lg hover:bg-muted"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {questions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => scrollToQuestion(i)}
                  className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${
                    answers[q.id]
                      ? "bg-success/20 text-success border border-success/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success/20 border border-success/30" /> উত্তর দেওয়া</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted" /> বাকি</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Submit Confirmation Modal */}
      {showConfirm && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 10000 }}
          className="flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-warning" />
              <h3 className="font-semibold text-sm">পরীক্ষা জমা দিন</h3>
            </div>
            <div className="space-y-2 mb-5 text-sm">
              <div className="flex justify-between p-2 rounded-lg bg-muted">
                <span className="text-muted-foreground">মোট প্রশ্ন</span>
                <span className="font-semibold">{questions.length}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-success/10">
                <span className="text-success">উত্তর দেওয়া</span>
                <span className="font-semibold text-success">{answeredCount}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-destructive/10">
                <span className="text-destructive">বাকি আছে</span>
                <span className="font-semibold text-destructive">{unansweredCount}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-all">ফিরে যান</button>
              <button onClick={doSubmit} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                জমা দিন ✓
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StudentExamAttempt;
