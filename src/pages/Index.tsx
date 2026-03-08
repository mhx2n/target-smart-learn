import { Link } from "react-router-dom";
import { Search, ArrowRight, BookOpen, Award, Bell } from "lucide-react";
import { store } from "@/lib/store";
import ExamCard from "@/components/ExamCard";
import heroBg from "@/assets/hero-bg.jpg";
import { useState } from "react";

const Index = () => {
  const exams = store.getExams().filter((e) => e.published);
  const notices = store.getNotices();
  const featured = exams.filter((e) => e.featured);
  const [search, setSearch] = useState("");

  const filtered = search
    ? exams.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.subject.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative pt-28 pb-20 px-4 overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background" />
        <div className="container relative z-10 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 animate-fade-in">
            <span className="gradient-text">Target</span> 🎯
          </h1>
          <p className="text-lg text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            সীমাহীন অনুশীলন, নিখুঁত প্রস্তুতি
          </p>
          <div className="relative max-w-md mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="পরীক্ষা খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-strong rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {search && filtered.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 glass-strong rounded-2xl p-3 max-h-60 overflow-y-auto z-20">
                {filtered.map((e) => (
                  <Link
                    key={e.id}
                    to={`/exams/${e.id}`}
                    className="block px-3 py-2 rounded-xl text-sm hover:bg-primary/10 transition-colors"
                  >
                    {e.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container space-y-12 pb-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 -mt-8 relative z-10">
          {[
            { icon: BookOpen, label: "মোট পরীক্ষা", val: exams.length },
            { icon: Award, label: "বিষয়", val: new Set(exams.map((e) => e.subject)).size },
            { icon: Bell, label: "নোটিস", val: notices.length },
          ].map((s, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <s.icon className="mx-auto mb-2 text-primary" size={22} />
              <p className="text-2xl font-bold">{s.val}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Notices */}
        {notices.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Bell size={18} className="text-primary" /> নোটিস বোর্ড
              </h2>
              <Link to="/notices" className="text-xs text-primary font-medium flex items-center gap-1">
                সব দেখুন <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-2">
              {notices.slice(0, 3).map((n) => (
                <Link
                  key={n.id}
                  to={`/notices/${n.id}`}
                  className="glass-card p-4 flex items-center gap-3 group"
                >
                  {n.pinned && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">📌 পিন</span>}
                  <span className="text-sm font-medium group-hover:text-primary transition-colors flex-1">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{n.createdAt}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured exams */}
        {featured.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4">⭐ বিশেষ পরীক্ষা</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((e) => (
                <ExamCard key={e.id} exam={e} />
              ))}
            </div>
          </section>
        )}

        {/* All exams */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">📝 সকল পরীক্ষা</h2>
            <Link to="/exams" className="text-xs text-primary font-medium flex items-center gap-1">
              আরও দেখুন <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((e) => (
              <ExamCard key={e.id} exam={e} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
