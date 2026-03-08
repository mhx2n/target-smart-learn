import { useState } from "react";
import { store } from "@/lib/store";
import { Exam } from "@/lib/types";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminExams = () => {
  const [exams, setExams] = useState<Exam[]>(store.getExams());
  const { toast } = useToast();

  const togglePublish = (examId: string) => {
    const updated = exams.map((e) => e.id === examId ? { ...e, published: !e.published } : e);
    setExams(updated);
    store.setExams(updated);
  };

  const deleteExam = (examId: string) => {
    const updated = exams.filter((e) => e.id !== examId);
    setExams(updated);
    store.setExams(updated);
    toast({ title: "পরীক্ষা মুছে ফেলা হয়েছে" });
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-5">📝 পরীক্ষা ব্যবস্থাপনা</h1>

      {exams.length === 0 ? (
        <div className="glass-card-static p-12 text-center text-muted-foreground">কোনো পরীক্ষা নেই</div>
      ) : (
        <div className="space-y-3">
          {exams.map((e) => (
            <div key={e.id} className="glass-card-static p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{e.title}</h3>
                <p className="text-xs text-muted-foreground">{e.subject} • {e.questionCount} প্রশ্ন • {e.createdAt}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${e.published ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                {e.published ? "প্রকাশিত" : "অপ্রকাশিত"}
              </span>
              <button onClick={() => togglePublish(e.id)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                {e.published ? <Eye size={16} className="text-success" /> : <EyeOff size={16} className="text-muted-foreground" />}
              </button>
              <button onClick={() => deleteExam(e.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                <Trash2 size={16} className="text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminExams;
