import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download, X, Image as ImageIcon, Loader2, Link as LinkIcon } from "lucide-react";
import type { Exam } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { resolveCorrectOptionText } from "@/lib/answerUtils";
import MathText from "@/components/MathText";

interface Slot {
  text: string;
  link: string;
}

interface PdfConfig {
  title: string;
  subtitle: string;
  logoDataUrl: string;
  showAnswers: boolean;
  showExplanations: boolean;
  twoColumn: boolean;
  primaryColor: string;
  header: { left: Slot; center: Slot; right: Slot };
  footer: { left: Slot; center: Slot; right: Slot };
}

const emptySlot = (): Slot => ({ text: "", link: "" });

const DEFAULT_CFG: PdfConfig = {
  title: "",
  subtitle: "",
  logoDataUrl: "",
  showAnswers: false,
  showExplanations: false,
  twoColumn: false,
  primaryColor: "#2563eb",
  header: {
    left: { text: "Target — Smart Exam Platform", link: "" },
    center: emptySlot(),
    right: emptySlot(),
  },
  footer: {
    left: { text: "© Target", link: "" },
    center: emptySlot(),
    right: emptySlot(),
  },
};

const PAGE_WIDTH = 794;
const PAGE_MIN_HEIGHT = 1123;
const PAGE_PADDING = 44;

function normalizeUrl(u: string) {
  const t = u.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function safeFileName(name: string) {
  return (name || "exam").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 80);
}

const Exporter = ({ exam, open, onClose }: { exam: Exam; open: boolean; onClose: () => void }) => {
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);
  const [cfg, setCfg] = useState<PdfConfig>({
    ...DEFAULT_CFG,
    title: exam.title,
    subtitle: exam.subject || "",
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCfg((c) => ({ ...c, title: exam.title, subtitle: exam.subject || c.subtitle }));
  }, [open, exam.id, exam.title, exam.subject]);

  const updateSlot = (
    section: "header" | "footer",
    pos: "left" | "center" | "right",
    field: keyof Slot,
    value: string,
  ) => setCfg((c) => ({
    ...c,
    [section]: { ...c[section], [pos]: { ...c[section][pos], [field]: value } },
  }));

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1024 * 1024) {
      return toast({ title: "লোগো ১MB এর মধ্যে হতে হবে", variant: "destructive" });
    }
    const r = new FileReader();
    r.onload = () => setCfg((c) => ({ ...c, logoDataUrl: String(r.result || "") }));
    r.readAsDataURL(f);
  };

  const generate = async () => {
    if (!previewRef.current) return;
    setGenerating(true);
    try {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const pages = Array.from(previewRef.current.querySelectorAll<HTMLElement>("[data-pdf-page]"));
      if (!pages.length) throw new Error("PDF preview তৈরি হয়নি");

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: PAGE_WIDTH,
        });
        const img = canvas.toDataURL("image/jpeg", 0.96);
        pdf.addImage(img, "JPEG", 0, 0, pageW, pageH, undefined, "FAST");

        const pageLinks = pages[i].querySelectorAll<HTMLElement>("[data-pdf-link]");
        pageLinks.forEach((node) => {
          const href = normalizeUrl(node.dataset.pdfLink || "");
          if (!href) return;
          const pageBox = pages[i].getBoundingClientRect();
          const box = node.getBoundingClientRect();
          pdf.link(
            ((box.left - pageBox.left) / pageBox.width) * pageW,
            ((box.top - pageBox.top) / pageBox.height) * pageH,
            (box.width / pageBox.width) * pageW,
            (box.height / pageBox.height) * pageH,
            { url: href },
          );
        });
      }

      pdf.save(`${safeFileName(cfg.title)}.pdf`);
      toast({ title: "PDF তৈরি হয়েছে ✅" });
    } catch (err: any) {
      toast({ title: "PDF তৈরিতে ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const pagedQuestions = useMemo(() => {
    const perPage = cfg.twoColumn ? 10 : 6;
    const chunks = [] as typeof exam.questions[];
    for (let i = 0; i < exam.questions.length; i += perPage) chunks.push(exam.questions.slice(i, i + perPage));
    return chunks.length ? chunks : [[]];
  }, [exam.questions, cfg.twoColumn]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm overflow-y-auto p-2 md:p-6">
      <div className="min-h-[calc(100vh-1rem)] flex items-start justify-center">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden my-2 border border-border">
          <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
            <div>
              <h2 className="font-bold text-lg">PDF এক্সপোর্ট</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">আগের visual PDF style • alignment fixed • LaTeX render support</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X size={16} /></button>
          </div>

          <div className="p-5 space-y-5 max-h-[calc(100vh-9rem)] overflow-y-auto overscroll-contain">
            <section className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">শিরোনাম</label>
                <input value={cfg.title} onChange={(e) => setCfg({ ...cfg, title: e.target.value })} className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">সাবটাইটেল</label>
                <input value={cfg.subtitle} onChange={(e) => setCfg({ ...cfg, subtitle: e.target.value })} className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">প্রাইমারি রঙ</label>
                <input type="color" value={cfg.primaryColor} onChange={(e) => setCfg({ ...cfg, primaryColor: e.target.value })} className="w-full h-10 mt-1 rounded-lg cursor-pointer" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">লোগো</label>
                <label className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg border border-border cursor-pointer text-xs">
                  <ImageIcon size={14} /> {cfg.logoDataUrl ? "লোগো পরিবর্তন" : "লোগো আপলোড"}
                  <input type="file" accept="image/png,image/jpeg" onChange={onLogo} className="hidden" />
                </label>
                {cfg.logoDataUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={cfg.logoDataUrl} alt="" className="w-10 h-10 object-contain rounded border" />
                    <button onClick={() => setCfg({ ...cfg, logoDataUrl: "" })} className="text-xs text-destructive">সরাও</button>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold mb-2">হেডার (বাম / মাঝ / ডান)</h3>
              <div className="grid sm:grid-cols-3 gap-2">
                {(["left", "center", "right"] as const).map((p) => (
                  <SlotEditor key={`h-${p}`} slot={cfg.header[p]}
                    onText={(v) => updateSlot("header", p, "text", v)}
                    onLink={(v) => updateSlot("header", p, "link", v)}
                    label={p === "left" ? "বাম" : p === "center" ? "মাঝ" : "ডান"} />
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold mb-2">ফুটার (বাম / মাঝ / ডান)</h3>
              <div className="grid sm:grid-cols-3 gap-2">
                {(["left", "center", "right"] as const).map((p) => (
                  <SlotEditor key={`f-${p}`} slot={cfg.footer[p]}
                    onText={(v) => updateSlot("footer", p, "text", v)}
                    onLink={(v) => updateSlot("footer", p, "link", v)}
                    label={p === "left" ? "বাম" : p === "center" ? "মাঝ" : "ডান"} />
                ))}
              </div>
            </section>

            <section className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cfg.twoColumn} onChange={(e) => setCfg({ ...cfg, twoColumn: e.target.checked })} />
                দুই-কলাম
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cfg.showAnswers} onChange={(e) => setCfg({ ...cfg, showAnswers: e.target.checked })} />
                সঠিক উত্তর হাইলাইট
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cfg.showExplanations} onChange={(e) => setCfg({ ...cfg, showExplanations: e.target.checked })} />
                ব্যাখ্যা যোগ
              </label>
            </section>

            <div className="rounded-xl border border-border bg-muted/20 p-3 overflow-auto">
              <div className="text-[11px] text-muted-foreground mb-2">প্রিভিউ</div>
              <div className="origin-top-left scale-[0.42] sm:scale-[0.58] md:scale-[0.72] h-[480px] sm:h-[660px] md:h-[820px] w-[794px] pointer-events-none">
                <PdfPreview ref={previewRef} exam={exam} cfg={cfg} pagedQuestions={pagedQuestions} />
              </div>
            </div>

            <button onClick={generate} disabled={generating} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {generating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              {generating ? "তৈরি হচ্ছে..." : "PDF ডাউনলোড"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

interface PdfPreviewProps {
  exam: Exam;
  cfg: PdfConfig;
  pagedQuestions: Exam["questions"][];
}

const PdfPreview = forwardRef<HTMLDivElement, PdfPreviewProps>(({ exam, cfg, pagedQuestions }, ref) => {
  return (
    <div ref={ref} className="pdf-export-preview" style={{ width: PAGE_WIDTH, color: "#111827", fontFamily: "Inter, Noto Sans Bengali, sans-serif" }}>
      {pagedQuestions.map((questions, pageIndex) => (
        <div
          key={pageIndex}
          data-pdf-page
          style={{
            width: PAGE_WIDTH,
            minHeight: PAGE_MIN_HEIGHT,
            background: "#ffffff",
            padding: PAGE_PADDING,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            pageBreakAfter: "always",
          }}
        >
          <PdfHeader cfg={cfg} exam={exam} page={pageIndex + 1} total={pagedQuestions.length} />
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: cfg.twoColumn ? "1fr 1fr" : "1fr",
              gap: cfg.twoColumn ? 18 : 0,
              alignContent: "start",
              paddingTop: 22,
            }}
          >
            {questions.map((question, index) => {
              const absoluteIndex = pageIndex * (cfg.twoColumn ? 10 : 6) + index;
              const correct = resolveCorrectOptionText(question);
              return (
                <div key={question.id || `${pageIndex}-${index}`} style={{ breakInside: "avoid", marginBottom: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 8, alignItems: "start", marginBottom: 10 }}>
                    <div style={{ color: cfg.primaryColor, fontWeight: 800, fontSize: 17, lineHeight: "26px" }}>{absoluteIndex + 1}.</div>
                    <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: "26px", wordBreak: "break-word" }}><MathText text={question.question} /></div>
                  </div>
                  <div style={{ display: "grid", gap: 7, paddingLeft: cfg.twoColumn ? 0 : 40 }}>
                    {question.options.map((opt, optionIndex) => {
                      const isCorrect = cfg.showAnswers && opt === correct;
                      return (
                        <div
                          key={`${question.id}-${optionIndex}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "30px minmax(0, 1fr) auto",
                            gap: 8,
                            alignItems: "start",
                            border: isCorrect ? "1.5px solid #16a34a" : "1px solid #dbe2ea",
                            background: isCorrect ? "#dcfce7" : "#f8fafc",
                            color: isCorrect ? "#166534" : "#1f2937",
                            borderRadius: 10,
                            padding: "8px 10px",
                            boxSizing: "border-box",
                            minHeight: 38,
                            lineHeight: "21px",
                          }}
                        >
                          <span style={{ fontWeight: 800, fontSize: 13, lineHeight: "21px" }}>{String.fromCharCode(65 + optionIndex)}.</span>
                          <span style={{ fontWeight: isCorrect ? 700 : 500, fontSize: 13.5, lineHeight: "21px", wordBreak: "break-word", minWidth: 0 }}><MathText text={opt} /></span>
                          {isCorrect && <span style={{ fontWeight: 800, fontSize: 11, lineHeight: "21px", whiteSpace: "nowrap" }}>✓ সঠিক</span>}
                        </div>
                      );
                    })}
                  </div>
                  {cfg.showExplanations && question.explanation && (
                    <div style={{ marginTop: 8, marginLeft: cfg.twoColumn ? 0 : 40, padding: 10, borderRadius: 10, background: "#f1f5f9", color: "#475569", fontSize: 12.5, lineHeight: "20px" }}>
                      <strong>ব্যাখ্যা: </strong><MathText text={question.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <PdfFooter cfg={cfg} page={pageIndex + 1} total={pagedQuestions.length} />
        </div>
      ))}
    </div>
  );
});

PdfPreview.displayName = "PdfPreview";

const PdfHeader = ({ cfg, exam, page, total }: { cfg: PdfConfig; exam: Exam; page: number; total: number }) => (
  <div style={{ borderBottom: `3px solid ${cfg.primaryColor}`, paddingBottom: 12 }}>
    <SlotRow slots={cfg.header} />
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
      {cfg.logoDataUrl && <img src={cfg.logoDataUrl} alt="" style={{ width: 54, height: 54, objectFit: "contain" }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: cfg.primaryColor, fontSize: 26, fontWeight: 900, lineHeight: "32px", wordBreak: "break-word" }}>{cfg.title || exam.title}</div>
        {cfg.subtitle && <div style={{ color: "#64748b", fontSize: 13, marginTop: 3 }}>{cfg.subtitle}</div>}
      </div>
      <div style={{ textAlign: "right", color: "#64748b", fontSize: 12, lineHeight: "20px", whiteSpace: "nowrap" }}>
        <div>সময়: {exam.duration} মিনিট</div>
        <div>মোট প্রশ্ন: {exam.questions.length}</div>
        <div>পেজ {page}/{total}</div>
      </div>
    </div>
  </div>
);

const PdfFooter = ({ cfg, page, total }: { cfg: PdfConfig; page: number; total: number }) => (
  <div style={{ borderTop: `1.5px solid ${cfg.primaryColor}`, paddingTop: 10, marginTop: 16 }}>
    <SlotRow slots={cfg.footer} />
    <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 10, marginTop: 5 }}>— {page} / {total} —</div>
  </div>
);

const SlotRow = ({ slots }: { slots: { left: Slot; center: Slot; right: Slot } }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, color: "#64748b", fontSize: 11, lineHeight: "16px" }}>
    {(["left", "center", "right"] as const).map((pos) => {
      const slot = slots[pos];
      return (
        <div
          key={pos}
          data-pdf-link={slot.link || undefined}
          style={{ textAlign: pos, minHeight: 16, overflowWrap: "anywhere", textDecoration: slot.link ? "underline" : "none" }}
        >
          {slot.text}
        </div>
      );
    })}
  </div>
);

function SlotEditor({ slot, label, onText, onLink }: { slot: Slot; label: string; onText: (v: string) => void; onLink: (v: string) => void }) {
  return (
    <div className="rounded-xl border border-border p-2 space-y-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
      <input value={slot.text} onChange={(e) => onText(e.target.value)} placeholder="লেখা" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs" />
      <div className="relative">
        <LinkIcon size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={slot.link} onChange={(e) => onLink(e.target.value)} placeholder="লিংক (ঐচ্ছিক)" className="w-full rounded-md border border-border bg-background pl-7 pr-2 py-1.5 text-xs" />
      </div>
    </div>
  );
}

export default Exporter;
