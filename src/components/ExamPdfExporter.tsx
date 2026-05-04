import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import jsPDF from "jspdf";
import { Download, X, Image as ImageIcon, Loader2, Link as LinkIcon } from "lucide-react";
import type { Exam, Question } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { resolveCorrectOptionText } from "@/lib/answerUtils";
import { preloadBengaliFont, registerBengaliFont } from "@/lib/pdfFont";

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

function normalizeUrl(u: string) {
  const t = u.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const v = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Strip math delimiters / common LaTeX commands so plain text shows on PDF.
// Native jsPDF can't render KaTeX, so we keep the math source readable.
function cleanText(t: string): string {
  if (!t) return "";
  return String(t)
    .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
    .replace(/\\\[([\s\S]*?)\\\]/g, "$1")
    .replace(/\\\(([\s\S]*?)\\\)/g, "$1")
    .replace(/\$([^$\n]+?)\$/g, "$1")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^{}]+)\}/g, "√($1)")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\cdot/g, "·")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\infty/g, "∞")
    .replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\^(\{[^}]+\}|\S)/g, (_, g) => `^${g.replace(/[{}]/g, "")}`)
    .replace(/_(\{[^}]+\}|\S)/g, (_, g) => `_${g.replace(/[{}]/g, "")}`)
    .replace(/\\\\/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const Exporter = ({ exam, open, onClose }: { exam: Exam; open: boolean; onClose: () => void }) => {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<PdfConfig>({
    ...DEFAULT_CFG,
    title: exam.title,
    subtitle: exam.subject || "",
  });
  const [generating, setGenerating] = useState(false);
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCfg((c) => ({ ...c, title: exam.title, subtitle: exam.subject || c.subtitle }));
    preloadBengaliFont()
      .then(() => setFontReady(true))
      .catch(() => setFontReady(true)); // proceed even if font failed; PDF still works for ASCII
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
    if (f.size > 1024 * 1024) return toast({ title: "লোগো ১MB এর মধ্যে হতে হবে", variant: "destructive" });
    const r = new FileReader();
    r.onload = () => setCfg((c) => ({ ...c, logoDataUrl: String(r.result || "") }));
    r.readAsDataURL(f);
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      await registerBengaliFont(pdf);
      pdf.setFont("NotoBn", "normal");

      const pageW = pdf.internal.pageSize.getWidth();   // 210
      const pageH = pdf.internal.pageSize.getHeight();  // 297
      const margin = 14;
      const contentW = pageW - margin * 2;
      const headerH = 22;
      const footerH = 12;
      const bodyTop = margin + headerH;
      const bodyBottom = pageH - margin - footerH;
      const [pr, pg, pb] = hexToRgb(cfg.primaryColor);

      const drawHeader = (pageNum: number, totalPages: number) => {
        // Top text row (3 columns)
        pdf.setFont("NotoBn", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(110, 110, 110);
        const cellW = contentW / 3;
        const drawSlot = (slot: Slot, x: number, align: "left" | "center" | "right", y: number) => {
          if (!slot.text) return;
          const tx = align === "left" ? x : align === "right" ? x + cellW : x + cellW / 2;
          pdf.text(cleanText(slot.text), tx, y, { align, maxWidth: cellW - 2 });
          if (slot.link.trim()) {
            pdf.link(x, y - 3, cellW, 5, { url: normalizeUrl(slot.link) });
          }
        };
        drawSlot(cfg.header.left, margin, "left", margin + 3);
        drawSlot(cfg.header.center, margin + cellW, "center", margin + 3);
        drawSlot(cfg.header.right, margin + cellW * 2, "right", margin + 3);

        // Logo + title
        let titleX = margin;
        if (cfg.logoDataUrl) {
          try {
            pdf.addImage(cfg.logoDataUrl, "PNG", margin, margin + 5, 12, 12);
          } catch { /* invalid image */ }
          titleX = margin + 14;
        }
        pdf.setFont("NotoBn", "bold");
        pdf.setFontSize(13);
        pdf.setTextColor(pr, pg, pb);
        pdf.text(cleanText(cfg.title || "Exam"), titleX, margin + 10, { maxWidth: contentW - 50 });
        if (cfg.subtitle) {
          pdf.setFont("NotoBn", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(90, 90, 90);
          pdf.text(cleanText(cfg.subtitle), titleX, margin + 15, { maxWidth: contentW - 50 });
        }

        // Right-side meta
        pdf.setFont("NotoBn", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(90, 90, 90);
        const metaX = pageW - margin;
        pdf.text(`সময়: ${exam.duration} মিনিট`, metaX, margin + 8, { align: "right" });
        pdf.text(`মোট প্রশ্ন: ${exam.questions.length}`, metaX, margin + 12, { align: "right" });
        pdf.text(`পেজ ${pageNum}/${totalPages}`, metaX, margin + 16, { align: "right" });

        // Divider
        pdf.setDrawColor(pr, pg, pb);
        pdf.setLineWidth(0.4);
        pdf.line(margin, margin + headerH - 2, pageW - margin, margin + headerH - 2);
      };

      const drawFooter = (pageNum: number, totalPages: number) => {
        pdf.setDrawColor(pr, pg, pb);
        pdf.setLineWidth(0.2);
        pdf.line(margin, pageH - margin - footerH + 2, pageW - margin, pageH - margin - footerH + 2);
        pdf.setFont("NotoBn", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(110, 110, 110);
        const cellW = contentW / 3;
        const yText = pageH - margin - 4;
        const drawSlot = (slot: Slot, x: number, align: "left" | "center" | "right") => {
          if (!slot.text) return;
          const tx = align === "left" ? x : align === "right" ? x + cellW : x + cellW / 2;
          pdf.text(cleanText(slot.text), tx, yText, { align, maxWidth: cellW - 2 });
          if (slot.link.trim()) {
            pdf.link(x, yText - 3, cellW, 5, { url: normalizeUrl(slot.link) });
          }
        };
        drawSlot(cfg.footer.left, margin, "left");
        drawSlot(cfg.footer.center, margin + cellW, "center");
        drawSlot(cfg.footer.right, margin + cellW * 2, "right");
        // Page indicator center bottom (always shown)
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`— ${pageNum} / ${totalPages} —`, pageW / 2, pageH - margin + 1, { align: "center" });
      };

      // First-pass measure to know totalPages — we'll do a streaming layout
      // by drawing into a buffer of "page operations" then committing.
      type Op = (page: number, totalPages: number) => void;
      const pages: Op[][] = [[]];
      let cursor = bodyTop + 2;
      let column = 0; // 0 = left, 1 = right (for two-column)
      const colCount = cfg.twoColumn ? 2 : 1;
      const colGap = 6;
      const colW = (contentW - colGap * (colCount - 1)) / colCount;
      const colX = (i: number) => margin + i * (colW + colGap);

      const newPage = () => {
        pages.push([]);
        cursor = bodyTop + 2;
        column = 0;
      };

      const ensureSpace = (needed: number) => {
        if (cursor + needed <= bodyBottom) return;
        if (cfg.twoColumn && column === 0) {
          column = 1;
          cursor = bodyTop + 2;
          if (cursor + needed <= bodyBottom) return;
        }
        newPage();
      };

      const renderQuestion = (q: Question, qIndex: number) => {
        const correct = resolveCorrectOptionText(q);
        const numStr = `${qIndex + 1}.`;
        const numW = 8;
        const qText = cleanText(q.question);

        // Pre-measure this whole question block so it doesn't get split badly
        pdf.setFont("NotoBn", "bold");
        pdf.setFontSize(10.5);
        const qLines = pdf.splitTextToSize(qText, colW - numW);
        const qHeight = qLines.length * 5 + 2;

        const optsLines: string[][] = q.options.map((opt) => {
          pdf.setFontSize(10);
          return pdf.splitTextToSize(`${String.fromCharCode(65 + 0)}.  ${cleanText(opt)}`, colW - 6);
        });
        const optsHeight = optsLines.reduce((sum, lines) => sum + lines.length * 5 + 1.5, 0) + 2;
        let explHeight = 0;
        let explLines: string[] = [];
        if (cfg.showExplanations && q.explanation) {
          pdf.setFontSize(8.5);
          explLines = pdf.splitTextToSize("ব্যাখ্যা: " + cleanText(q.explanation), colW - 4);
          explHeight = explLines.length * 4 + 4;
        }
        const totalHeight = qHeight + optsHeight + explHeight + 4;
        ensureSpace(Math.min(totalHeight, bodyBottom - bodyTop));

        const xBase = colX(column);
        const startY = cursor;

        pages[pages.length - 1].push(() => {
          // Question number
          pdf.setFont("NotoBn", "bold");
          pdf.setFontSize(10.5);
          pdf.setTextColor(pr, pg, pb);
          pdf.text(numStr, xBase, startY);
          // Question text
          pdf.setTextColor(20, 20, 20);
          pdf.text(qLines, xBase + numW, startY);
        });
        cursor += qHeight;

        // Options
        q.options.forEach((opt, oi) => {
          const letter = String.fromCharCode(65 + oi);
          const isCorrect = cfg.showAnswers && opt === correct;
          pdf.setFontSize(10);
          const lines = pdf.splitTextToSize(`${letter}.  ${cleanText(opt)}`, colW - 6);
          const h = lines.length * 5 + 1.5;
          // If this option doesn't fit, push to next column/page
          if (cursor + h > bodyBottom) {
            ensureSpace(h);
          }
          const oxBase = colX(column);
          const oy = cursor;
          pages[pages.length - 1].push(() => {
            if (isCorrect) {
              pdf.setFillColor(220, 252, 231); // light green
              pdf.setDrawColor(34, 197, 94);
              pdf.setLineWidth(0.3);
              pdf.roundedRect(oxBase + 2, oy - 3.5, colW - 4, h - 0.5, 1.5, 1.5, "FD");
              pdf.setTextColor(21, 128, 61);
              pdf.setFont("NotoBn", "bold");
            } else {
              pdf.setTextColor(45, 45, 45);
              pdf.setFont("NotoBn", "normal");
            }
            pdf.setFontSize(10);
            pdf.text(lines, oxBase + 4, oy);
            if (isCorrect) {
              // small "✓ Correct" tag at right
              pdf.setFontSize(7.5);
              pdf.setTextColor(21, 128, 61);
              pdf.text("✓ সঠিক", oxBase + colW - 3, oy, { align: "right" });
            }
          });
          cursor += h;
        });

        if (explHeight > 0) {
          if (cursor + explHeight > bodyBottom) ensureSpace(explHeight);
          const eX = colX(column);
          const eY = cursor + 1;
          pages[pages.length - 1].push(() => {
            pdf.setFillColor(245, 245, 250);
            pdf.roundedRect(eX + 2, eY - 3, colW - 4, explHeight - 1, 1.5, 1.5, "F");
            pdf.setFont("NotoBn", "normal");
            pdf.setFontSize(8.5);
            pdf.setTextColor(70, 70, 90);
            pdf.text(explLines, eX + 4, eY);
          });
          cursor += explHeight;
        }

        cursor += 4; // gap between questions
      };

      exam.questions.forEach((q, i) => renderQuestion(q, i));

      // Commit pages
      pages.forEach((ops, pageIdx) => {
        if (pageIdx > 0) pdf.addPage();
        drawHeader(pageIdx + 1, pages.length);
        ops.forEach((op) => op(pageIdx + 1, pages.length));
        drawFooter(pageIdx + 1, pages.length);
      });

      pdf.save(`${(cfg.title || "exam").replace(/[^\w\s\-একু-৯ঁ-৾]/gi, "_")}.pdf`);
      toast({ title: "PDF তৈরি হয়েছে ✅" });
    } catch (err: any) {
      toast({ title: "PDF তৈরিতে ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm overflow-y-auto p-2 md:p-6">
      <div className="min-h-[calc(100vh-1rem)] flex items-start md:items-center justify-center">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden my-2">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="font-bold text-lg">PDF এক্সপোর্ট</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">{exam.questions.length} প্রশ্ন • selectable text • Bengali সাপোর্ট</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X size={16} /></button>
          </div>

          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
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

            <button onClick={generate} disabled={generating || !fontReady} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {generating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              {!fontReady ? "ফন্ট লোড হচ্ছে..." : generating ? "তৈরি হচ্ছে..." : "PDF ডাউনলোড"}
            </button>
            <p className="text-[10px] text-muted-foreground text-center -mt-2">* প্রথমবার ফন্ট ডাউনলোড হবে (~১MB), পরে cache থেকে instant।</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

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