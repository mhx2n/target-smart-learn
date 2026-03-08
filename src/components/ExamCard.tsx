import { Exam } from "@/lib/types";
import { Link } from "react-router-dom";
import { Clock, HelpCircle } from "lucide-react";

const difficultyConfig = {
  easy: { label: "সহজ", className: "bg-emerald-100 text-emerald-700" },
  medium: { label: "মাঝারি", className: "bg-amber-100 text-amber-700" },
  hard: { label: "কঠিন", className: "bg-rose-100 text-rose-700" },
};

const ExamCard = ({ exam }: { exam: Exam }) => {
  const diff = difficultyConfig[exam.difficulty];

  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">{exam.subject}</span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${diff.className}`}>{diff.label}</span>
      </div>
      <h3 className="font-semibold text-foreground leading-snug">{exam.title}</h3>
      <p className="text-xs text-muted-foreground">{exam.category} • {exam.chapter}</p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><HelpCircle size={13} /> {exam.questionCount} প্রশ্ন</span>
        <span className="flex items-center gap-1"><Clock size={13} /> {exam.duration} মিনিট</span>
      </div>
      <Link
        to={`/exams/${exam.id}`}
        className="mt-auto inline-flex items-center justify-center gap-2 text-sm font-medium rounded-xl px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
      >
        পরীক্ষা শুরু করুন
      </Link>
    </div>
  );
};

export default ExamCard;
