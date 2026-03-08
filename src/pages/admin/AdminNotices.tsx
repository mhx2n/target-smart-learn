import { useState, useRef, useCallback } from "react";
import { store } from "@/lib/store";
import { Notice } from "@/lib/types";
import { Plus, Trash2, Pin, Bold, Italic, Link, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RichTextToolbar = ({ editorRef }: { editorRef: React.RefObject<HTMLDivElement> }) => {
  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-1 p-1.5 border-b border-border flex-wrap">
      <button type="button" onClick={() => exec("bold")} className="p-1.5 rounded hover:bg-muted transition-colors" title="Bold">
        <Bold size={14} />
      </button>
      <button type="button" onClick={() => exec("italic")} className="p-1.5 rounded hover:bg-muted transition-colors" title="Italic">
        <Italic size={14} />
      </button>
      <button type="button" onClick={() => {
        const url = prompt("লিংক URL দিন:");
        if (url) exec("createLink", url);
      }} className="p-1.5 rounded hover:bg-muted transition-colors" title="Link">
        <Link size={14} />
      </button>
      <select
        onChange={(e) => { if (e.target.value) exec("fontSize", e.target.value); e.target.value = ""; }}
        className="text-xs bg-transparent border border-border rounded px-1.5 py-1 focus:outline-none"
        defaultValue=""
      >
        <option value="" disabled>সাইজ</option>
        <option value="1">ছোট</option>
        <option value="3">স্বাভাবিক</option>
        <option value="5">বড়</option>
        <option value="7">অনেক বড়</option>
      </select>
    </div>
  );
};

const AdminNotices = () => {
  const [notices, setNotices] = useState<Notice[]>(store.getNotices());
  const [title, setTitle] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const addNotice = () => {
    if (!title) return;
    const content = contentRef.current?.innerHTML || "";
    const n: Notice = {
      id: `n-${Date.now()}`,
      title,
      content,
      pinned: false,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [n, ...notices];
    setNotices(updated);
    store.setNotices(updated);
    setTitle("");
    if (contentRef.current) contentRef.current.innerHTML = "";
    toast({ title: "নোটিস যুক্ত হয়েছে" });
  };

  const deleteNotice = (id: string) => {
    const updated = notices.filter((n) => n.id !== id);
    setNotices(updated);
    store.setNotices(updated);
    toast({ title: "নোটিস মুছে ফেলা হয়েছে" });
  };

  const togglePin = (id: string) => {
    const updated = notices.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n);
    setNotices(updated);
    store.setNotices(updated);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-5">📢 নোটিস ব্যবস্থাপনা</h1>

      <div className="glass-card-static p-5 mb-5">
        <h3 className="font-semibold text-sm mb-3">নতুন নোটিস</h3>
        <input placeholder="শিরোনাম" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full glass-strong rounded-xl px-4 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        
        <div className="border border-border rounded-xl overflow-hidden mb-3">
          <RichTextToolbar editorRef={contentRef} />
          <div
            ref={contentRef}
            contentEditable
            className="min-h-[80px] px-4 py-2.5 text-sm focus:outline-none bg-transparent"
            data-placeholder="বিবরণ লিখুন (বোল্ড, ইটালিক, লিংক সাপোর্ট)"
            style={{ minHeight: "80px" }}
          />
        </div>

        <button onClick={addNotice} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
          <Plus size={14} className="inline mr-1" /> যুক্ত করুন
        </button>
      </div>

      <div className="space-y-2">
        {notices.map((n) => (
          <div key={n.id} className="glass-card-static p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {n.pinned && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">📌</span>}
                <h4 className="text-sm font-medium truncate">{n.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground">{n.createdAt}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => togglePin(n.id)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Pin size={14} className={n.pinned ? "text-primary" : "text-muted-foreground"} />
              </button>
              <button onClick={() => deleteNotice(n.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                <Trash2 size={14} className="text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminNotices;
