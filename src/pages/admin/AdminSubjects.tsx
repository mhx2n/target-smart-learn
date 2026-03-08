import { store } from "@/lib/store";
import { subjects, categories } from "@/lib/data";

const AdminSubjects = () => {
  const exams = store.getExams();
  const examSubjects = [...new Set(exams.map((e) => e.subject))];
  const examCategories = [...new Set(exams.map((e) => e.category))];

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-5">📚 বিষয় ও ক্যাটেগরি</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card-static p-5">
          <h2 className="font-semibold text-sm mb-3">বিষয়সমূহ</h2>
          <div className="space-y-2">
            {[...new Set([...subjects, ...examSubjects])].map((s) => {
              const count = exams.filter((e) => e.subject === s).length;
              return (
                <div key={s} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <span className="text-sm">{s}</span>
                  <span className="text-xs text-muted-foreground">{count} পরীক্ষা</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card-static p-5">
          <h2 className="font-semibold text-sm mb-3">ক্যাটেগরি</h2>
          <div className="space-y-2">
            {[...new Set([...categories, ...examCategories])].map((c) => {
              const count = exams.filter((e) => e.category === c).length;
              return (
                <div key={c} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <span className="text-sm">{c}</span>
                  <span className="text-xs text-muted-foreground">{count} পরীক্ষা</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSubjects;
