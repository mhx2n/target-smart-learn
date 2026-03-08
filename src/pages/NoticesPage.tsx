import { store } from "@/lib/store";
import { Link } from "react-router-dom";
import { Bell, Pin } from "lucide-react";

const NoticesPage = () => {
  const notices = store.getNotices();

  return (
    <div className="pt-24 pb-8 container max-w-2xl min-h-screen">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Bell size={22} className="text-primary" /> নোটিস বোর্ড
      </h1>
      {notices.length === 0 ? (
        <div className="glass-card-static p-12 text-center text-muted-foreground">কোনো নোটিস নেই</div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <Link key={n.id} to={`/notices/${n.id}`} className="glass-card p-5 block">
              <div className="flex items-center gap-2 mb-2">
                {n.pinned && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">📌 পিন করা</span>}
                <span className="text-xs text-muted-foreground ml-auto">{n.createdAt}</span>
              </div>
              <h3 className="font-semibold mb-1">{n.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(n.content) }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticesPage;
