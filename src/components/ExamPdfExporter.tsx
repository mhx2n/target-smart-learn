import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Download, X, Image as ImageIcon, Loader2 } from "lucide-react";
import type { Exam, Question } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface PdfConfig {
  title: string;
  subtitle: string;
  headerText: string;
  footerText: string;
  footerLink: string;
  logoDataUrl: string;
  showAnswers: boolean;
  showExplanations: boolean;
  twoColumn: boolean;
  primaryColor: string;
}

const DEFAULT_CONFIG: PdfConfig = {
  title: "",
  subtitle: "",
  headerText: "Target — Smart Exam Platform",
  footerText: "© Target. সর্বস্বত্ব সংরক্ষিত।",
  footerLink: "",
  logoDataUrl: "",
  showAnswers: false,
  showExplanations: false,
  twoColumn: false,
  primaryColor: "#2563eb",
};

function renderMathHtml(text: string): string {
  if (!text) return "";
  let out = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Display math
  out = out.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => {
    try { return katex.renderToString(m.trim(), { displayMode: true, throwOnError: false }); } catch { return `$$${m}$$`; }
  });
  out = out.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => {
    try { return katex.renderToString(m.trim(), { displayMode: true, throwOnError: false }); } catch { return m; }
  });
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => {
    try { return katex.renderToString(m.trim(), { displayMode: false, throwOnError: false }); } catch { return m; }
  });
  out = out.replace(/\$([^\$\n]+?)\$/g, (_, m) => {
    try { return katex.renderToString(m.trim(), { displayMode: false, throwOnError: false }); } catch { return `$${m}$`; }
  });
  return out;
}

interface Props {
  exam: Exam;
  open: boolean;
  onClose: () => void;
}

const ExamPdfExporter = ({ exam, open, onClose }: Props) => {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<PdfConfig>({ ...DEFAULT_CONFIG, title: exam.title, subtitle: exam.subject || "" });
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCfg((c) => ({ ...c, title: exam.title, subtitle: exam.subject || "" }));
  }, [exam.id, exam.title, exam.subject]);

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 1024 * 1024) return toast({ title: "লোগো ১MB এর মধ্যে হতে হবে", variant: "destructive" });
    const r = new FileReader();
    r.onload = () => setCfg((c) => ({ ...c, logoDataUrl: String(r.result || "") }));
    r.readAsDataURL(f);
  };

  const generatePdf = async () => {
    if (!previewRef.current) return;
    setGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const pages = previewRef.current.querySelectorAll<HTMLElement>("[data-pdf-page]");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 6;

      for (let i = 0; i < pages.length; i++) {
        const el = pages[i];
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
        const img = canvas.toDataURL("image/jpeg", 0.92);
        const ratio = canvas.height / canvas.width;
        const imgW = pageW - margin * 2;
        const imgH = imgW * ratio;
        if (i > 0) pdf.addPage();
        pdf.addImage(img, "JPEG", margin, margin, imgW, Math.min(imgH, pageH - margin * 2));
        if (cfg.footerLink) {
          try {
            pdf.link(0, pageH - 12, pageW, 12, { url: cfg.footerLink });
          } catch {}
        }
      }

      pdf.save(`${cfg.title || "exam"}.pdf`);
      toast({ title: "PDF তৈরি হয়েছে ✅" });
    } catch (err: any) {
      toast({ title: "PDF তৈরিতে ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  // Split questions into pages of approx 8 (single col) or 12 (two col)
  const perPage = cfg.twoColumn ? 10 : 6;
  const pages = useMemo(() => {
    const arr: Question[][] = [];
    for (let i = 0; i < exam.questions.length; i += perPage) {
      arr.push(exam.questions.slice(i, i + perPage));
    }
    return arr.length ? arr : [[]];
  }, [exam.questions, perPage]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 md:p-6 overflow-y-auto overscroll-contain">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col md:flex-row overflow-hidden my-4 md:my-0 md:max-h-[92vh]">
        {/* Settings panel */}
        <div className="md:w-80 shrink-0 border-r border-border p-5 overflow-y-auto max-h-[45vh] md:max-h-[92vh]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">PDF কাস্টমাইজ</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X size={16} /></button>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-muted-foreground">শিরোনাম</label>
              <input value={cfg.title} onChange={(e) => setCfg({ ...cfg, title: e.target.value })} className="w-full glass-strong rounded-lg px-3 py-2 mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">সাবটাইটেল</label>
              <input value={cfg.subtitle} onChange={(e) => setCfg({ ...cfg, subtitle: e.target.value })} className="w-full glass-strong rounded-lg px-3 py-2 mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">হেডার টেক্সট</label>
              <input value={cfg.headerText} onChange={(e) => setCfg({ ...cfg, headerText: e.target.value })} className="w-full glass-strong rounded-lg px-3 py-2 mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">ফুটার টেক্সট</label>
              <input value={cfg.footerText} onChange={(e) => setCfg({ ...cfg, footerText: e.target.value })} className="w-full glass-strong rounded-lg px-3 py-2 mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">ফুটার লিংক (URL)</label>
              <input type="url" placeholder="https://..." value={cfg.footerLink} onChange={(e) => setCfg({ ...cfg, footerLink: e.target.value })} className="w-full glass-strong rounded-lg px-3 py-2 mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">প্রাইমারি রঙ</label>
              <input type="color" value={cfg.primaryColor} onChange={(e) => setCfg({ ...cfg, primaryColor: e.target.value })} className="w-full h-10 rounded-lg mt-1 cursor-pointer" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">লোগো</label>
              <label className="flex items-center gap-2 mt-1 px-3 py-2 glass-strong rounded-lg cursor-pointer text-xs">
                <ImageIcon size={14} /> {cfg.logoDataUrl ? "লোগো পরিবর্তন" : "লোগো আপলোড"}
                <input type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
              </label>
              {cfg.logoDataUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={cfg.logoDataUrl} alt="" className="w-12 h-12 rounded object-contain bg-white border" />
                  <button onClick={() => setCfg({ ...cfg, logoDataUrl: "" })} className="text-xs text-destructive">সরাও</button>
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cfg.twoColumn} onChange={(e) => setCfg({ ...cfg, twoColumn: e.target.checked })} />
              <span className="text-xs">দুই-কলাম লেআউট</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cfg.showAnswers} onChange={(e) => setCfg({ ...cfg, showAnswers: e.target.checked })} />
              <span className="text-xs">সঠিক উত্তর হাইলাইট করো</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cfg.showExplanations} onChange={(e) => setCfg({ ...cfg, showExplanations: e.target.checked })} />
              <span className="text-xs">ব্যাখ্যা যোগ করো</span>
            </label>

            <button onClick={generatePdf} disabled={generating}
              className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {generating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              {generating ? "তৈরি হচ্ছে..." : "PDF ডাউনলোড"}
            </button>
            <p className="text-[10px] text-muted-foreground text-center">{exam.questions.length} প্রশ্ন • {pages.length} পেজ</p>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto bg-muted/30 p-4 max-h-[50vh] md:max-h-[92vh]">
          <p className="text-xs text-center text-muted-foreground mb-3">প্রিভিউ (PDF এর ভিতরে এমনই দেখাবে)</p>
          <div ref={previewRef} className="space-y-4">
            {pages.map((qs, pi) => (
              <div key={pi} data-pdf-page
                style={{ width: "210mm", minHeight: "297mm", background: "white", color: "#111", fontFamily: "Hind Siliguri, Noto Sans Bengali, system-ui, sans-serif" }}
                className="mx-auto shadow-lg flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 px-8 pt-6 pb-3 border-b-2" style={{ borderColor: cfg.primaryColor }}>
                  {cfg.logoDataUrl && <img src={cfg.logoDataUrl} alt="" style={{ width: 48, height: 48, objectFit: "contain" }} />}
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 11, color: "#666" }}>{cfg.headerText}</p>
                    {pi === 0 && (
                      <>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: cfg.primaryColor, margin: 0 }}>{cfg.title}</h1>
                        {cfg.subtitle && <p style={{ fontSize: 12, color: "#444", margin: 0 }}>{cfg.subtitle}</p>}
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "#666", textAlign: "right" }}>
                    <p style={{ margin: 0 }}>সময়: {exam.duration} মিনিট</p>
                    <p style={{ margin: 0 }}>মোট: {exam.questions.length}</p>
                    <p style={{ margin: 0 }}>পেজ {pi + 1}/{pages.length}</p>
                  </div>
                </div>

                {/* Questions */}
                <div className="flex-1 px-8 py-4" style={cfg.twoColumn ? { columnCount: 2, columnGap: "20px" } : {}}>
                  {qs.map((q, qi) => {
                    const num = pi * perPage + qi + 1;
                    return (
                      <div key={q.id} style={{ marginBottom: 14, breakInside: "avoid", pageBreakInside: "avoid" }}>
                        <div style={{ display: "flex", gap: 6, fontSize: 12, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: cfg.primaryColor, minWidth: 22 }}>{num}.</span>
                          <div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: renderMathHtml(q.question) }} />
                        </div>
                        {q.questionImage && <img src={q.questionImage} alt="" style={{ maxWidth: "100%", maxHeight: 120, marginLeft: 28, marginBottom: 4 }} />}
                        <ol style={{ marginLeft: 28, marginTop: 2, paddingLeft: 0, listStyle: "none" }}>
                          {q.options.map((opt, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            const isCorrect = cfg.showAnswers && opt === q.answer;
                            return (
                              <li key={idx} style={{
                                fontSize: 11.5, marginBottom: 2,
                                background: isCorrect ? `${cfg.primaryColor}15` : "transparent",
                                color: isCorrect ? cfg.primaryColor : "#222",
                                fontWeight: isCorrect ? 700 : 400,
                                padding: isCorrect ? "1px 6px" : 0,
                                borderRadius: 3,
                                display: "flex", gap: 4,
                              }}>
                                <span style={{ fontWeight: 600 }}>({letter})</span>
                                <span dangerouslySetInnerHTML={{ __html: renderMathHtml(opt) }} />
                              </li>
                            );
                          })}
                        </ol>
                        {cfg.showExplanations && q.explanation && (
                          <div style={{ marginLeft: 28, marginTop: 4, padding: 6, background: "#f5f5f5", fontSize: 10.5, borderLeft: `3px solid ${cfg.primaryColor}` }}>
                            <strong>ব্যাখ্যা: </strong>
                            <span dangerouslySetInnerHTML={{ __html: renderMathHtml(q.explanation) }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div style={{ marginTop: "auto", padding: "8px 32px", borderTop: `1px solid ${cfg.primaryColor}40`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: "#555" }}>
                  <span>{cfg.footerText}</span>
                  {cfg.footerLink && <span style={{ color: cfg.primaryColor, fontWeight: 600 }}>{cfg.footerLink}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExamPdfExporter;