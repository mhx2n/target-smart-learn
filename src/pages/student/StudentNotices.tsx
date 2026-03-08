import { store } from "@/lib/store";
import { Bell } from "lucide-react";
import { useState } from "react";

const StudentNotices = () => {
  const notices = store.getNotices();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-5 flex items-center gap-2">
        <Bell size={20} className="text-primary" /> নোটিস বোর্ড
      </h1>
      {notices.length === 0 ? (
        <div className="glass-card-static p-12 text-center text-muted-foreground">কোনো নোটিস নেই</div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n.id} className="glass-card-static p-5 cursor-pointer" onClick={() => setExpanded(expanded === n.id ? null : n.id)}>
              <div className="flex items-center gap-2 mb-2">
                {n.pinned && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">📌 পিন</span>}
                <span className="text-xs text-muted-foreground ml-auto">{n.createdAt}</span>
              </div>
              <h3 className="font-semibold mb-1">{n.title}</h3>
              {expanded === n.id && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed animate-fade-in">{n.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNotices;
