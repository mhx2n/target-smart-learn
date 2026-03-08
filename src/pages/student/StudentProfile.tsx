import { store } from "@/lib/store";
import { User, BarChart3, Award, BookOpen } from "lucide-react";

const StudentProfile = () => {
  const results = store.getResults();
  const totalAttempts = results.length;
  const avgScore = totalAttempts > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / totalAttempts)
    : 0;
  const bestScore = totalAttempts > 0 ? Math.max(...results.map((r) => r.percentage)) : 0;
  const uniqueExams = new Set(results.map((r) => r.examId)).size;

  return (
    <div className="pt-24 pb-8 container max-w-2xl mx-auto animate-fade-in">
      <div className="glass-card-static p-8 text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <User size={28} className="text-primary" />
        </div>
        <h1 className="text-xl font-bold">অনুশীলনকারী</h1>
        <p className="text-sm text-muted-foreground">আপনার অনুশীলন পরিসংখ্যান</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: BookOpen, label: "মোট অনুশীলন", value: totalAttempts },
          { icon: BarChart3, label: "গড় স্কোর", value: `${avgScore}%` },
          { icon: Award, label: "সর্বোচ্চ স্কোর", value: `${bestScore}%` },
          { icon: BookOpen, label: "ভিন্ন পরীক্ষা", value: uniqueExams },
        ].map((s, i) => (
          <div key={i} className="glass-card-static p-4 text-center">
            <s.icon className="mx-auto mb-2 text-primary" size={20} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3">📈 সাম্প্রতিক ফলাফল</h2>
          <div className="space-y-2">
            {results.slice(0, 10).map((r, i) => (
              <div key={i} className="glass-card-static p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{r.examTitle}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.timestamp).toLocaleDateString("bn-BD")}</p>
                </div>
                <span className={`font-bold ${r.percentage >= 60 ? "text-success" : "text-destructive"}`}>{r.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
