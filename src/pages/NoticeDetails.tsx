import { useParams, Link, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { ArrowLeft } from "lucide-react";
import DOMPurify from "dompurify";

const NoticeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notice = store.getNotices().find((n) => n.id === id);

  if (!notice) {
    return (
      <div className="pt-24 container text-center min-h-screen text-muted-foreground">
        নোটিস পাওয়া যায়নি
        <br />
        <Link to="/notices" className="text-primary text-sm">ফিরে যান</Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-8 container max-w-2xl min-h-screen">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> ফিরে যান
      </button>
      <div className="glass-card-static p-6">
        <div className="flex items-center gap-2 mb-3">
          {notice.pinned && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">📌 পিন করা</span>}
          <span className="text-xs text-muted-foreground">{notice.createdAt}</span>
        </div>
        <h1 className="text-2xl font-bold mb-4">{notice.title}</h1>
        <div className="text-muted-foreground leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.content) }} />
      </div>
    </div>
  );
};

export default NoticeDetails;
