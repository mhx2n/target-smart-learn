import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "katex/dist/katex.min.css";
import { Download, X, Image as ImageIcon, Loader2, Link as LinkIcon } from "lucide-react";
import type { Exam, Question } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_PDF_CONFIG,
  type PdfConfig,
  type PdfTextSlot,
  getCorrectAnswerText,
  normalizePdfUrl,
  renderMathHtml,
  splitIntoColumns,
} from "@/lib/examPdf";

interface Props {
  exam: Exam;
  open: boolean;
  onClose: () => void;
}

const perPageSingle = 5;
const perPageDouble = 8;

const ExamPdfExporter = ({ exam, open, onClose }: Props) => {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<PdfConfig>({
    ...DEFAULT_PDF_CONFIG,
    title: exam.title,
    subtitle: exam.subject || "",
  });
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCfg((current) => ({
      ...current,
      title: exam.title,
      subtitle: exam.subject || current.subtitle,
    }));
  }, [exam.id, exam.title, exam.subject]);

  const perPage = cfg.twoColumn ? perPageDouble : perPageSingle;
  const pages = useMemo(() => {
    const groups: Question[][] = [];
    for (let index = 0; index < exam.questions.length; index += perPage) {
      groups.push(exam.questions.slice(index, index + perPage));
    }
    return groups.length ? groups : [[]];
  }, [exam.questions, perPage]);

  const updateSlot = (
    section: "header" | "footer",
    position: "left" | "center" | "right",
    field: keyof PdfTextSlot,
    value: string,
  ) => {
    setCfg((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [position]: {
          ...current[section][position],
          [field]: value,
        },
      },
    }));
  };

  const onLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      return toast({ title: "লোগো ১MB এর মধ্যে হতে হবে", variant: "destructive" });
    }
    const reader = new FileReader();
    reader.onload = () => setCfg((current) => ({ ...current, logoDataUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const applySlotLinks = (pdf: jsPDF, cfgValue: PdfConfig, pageWidth: number, pageHeight: number, margin: number) => {
    const innerWidth = pageWidth - margin * 2;
    const slotWidth = innerWidth / 3;

    (["left", "center", "right"] as const).forEach((position, index) => {
      const headerSlot = cfgValue.header[position];
      const footerSlot = cfgValue.footer[position];
      const x = margin + index * slotWidth;

      if (headerSlot.link.trim()) {
        pdf.link(x, margin + 1.5, slotWidth, 7, { url: normalizePdfUrl(headerSlot.link) });
      }
      if (footerSlot.link.trim()) {
        pdf.link(x, pageHeight - margin - 6.5, slotWidth, 7, { url: normalizePdfUrl(footerSlot.link) });
      }
    });
  };

  const generatePdf = async () => {
    if (!previewRef.current) return;
    setGenerating(true);

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      const pageNodes = previewRef.current.querySelectorAll<HTMLElement>("[data-pdf-page]");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 6;

      for (let index = 0; index < pageNodes.length; index += 1) {
        const node = pageNodes[index];
        const canvas = await html2canvas(node, {
          scale: 2.2,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
          windowWidth: node.scrollWidth,
          windowHeight: node.scrollHeight,
        });
        const image = canvas.toDataURL("image/jpeg", 0.96);
        const ratio = canvas.height / canvas.width;
        const imageWidth = pageWidth - margin * 2;
        const imageHeight = imageWidth * ratio;

        if (index > 0) pdf.addPage();
        pdf.addImage(image, "JPEG", margin, margin, imageWidth, Math.min(imageHeight, pageHeight - margin * 2));
        applySlotLinks(pdf, cfg, pageWidth, pageHeight, margin);
      }

      pdf.save(`${cfg.title || "exam"}.pdf`);
      toast({ title: "PDF তৈরি হয়েছে ✅" });
    } catch (error: any) {
      toast({ title: "PDF তৈরিতে ত্রুটি", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm overflow-y-auto overscroll-contain p-2 md:p-6">
      <div className="min-h-[calc(100vh-1rem)] md:min-h-0 flex items-start justify-center">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-7xl flex flex-col md:flex-row overflow-hidden my-2 md:my-0 md:max-h-[92vh]">
          <div className="md:w-[360px] shrink-0 border-b md:border-b-0 md:border-r border-border p-5 overflow-y-visible md:overflow-y-auto max-h-none md:max-h-[92vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">PDF কাস্টমাইজ</h2>
              <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X size={16} /></button>
            </div>

            <div className="space-y-4 text-sm pb-4">
              <section className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">শিরোনাম</label>
                  <input value={cfg.title} onChange={(e) => setCfg({ ...cfg, title: e.target.value })} className="w-full glass-strong rounded-lg px-3 py-2 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">সাবটাইটেল</label>
                  <input value={cfg.subtitle} onChange={(e) => setCfg({ ...cfg, subtitle: e.target.value })} className="w-full glass-strong rounded-lg px-3 py-2 mt-1" />
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
                      <img src={cfg.logoDataUrl} alt="logo preview" className="w-12 h-12 rounded object-contain bg-white border" />
                      <button onClick={() => setCfg({ ...cfg, logoDataUrl: "" })} className="text-xs text-destructive">সরাও</button>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold">হেডার</h3>
                  <span className="text-[10px] text-muted-foreground">বাম / মাঝ / ডান</span>
                </div>
                {(["left", "center", "right"] as const).map((position) => (
                  <SlotEditor
                    key={`header-${position}`}
                    label={position === "left" ? "বাম" : position === "center" ? "মাঝখান" : "ডান"}
                    slot={cfg.header[position]}
                    onTextChange={(value) => updateSlot("header", position, "text", value)}
                    onLinkChange={(value) => updateSlot("header", position, "link", value)}
                  />
                ))}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold">ফুটার</h3>
                  <span className="text-[10px] text-muted-foreground">বাম / মাঝ / ডান</span>
                </div>
                {(["left", "center", "right"] as const).map((position) => (
                  <SlotEditor
                    key={`footer-${position}`}
                    label={position === "left" ? "বাম" : position === "center" ? "মাঝখান" : "ডান"}
                    slot={cfg.footer[position]}
                    onTextChange={(value) => updateSlot("footer", position, "text", value)}
                    onLinkChange={(value) => updateSlot("footer", position, "link", value)}
                  />
                ))}
              </section>

              <section className="space-y-2">
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
              </section>

              <button onClick={generatePdf} disabled={generating} className="w-full mt-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {generating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                {generating ? "তৈরি হচ্ছে..." : "PDF ডাউনলোড"}
              </button>
              <p className="text-[10px] text-muted-foreground text-center">{exam.questions.length} প্রশ্ন • {pages.length} পেজ</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-muted/30 p-4 max-h-[55vh] md:max-h-[92vh]">
            <p className="text-xs text-center text-muted-foreground mb-3">প্রিভিউ (PDF এর ভিতরে এমনই দেখাবে)</p>
            <div ref={previewRef} className="space-y-4">
              {pages.map((pageQuestions, pageIndex) => (
                <PdfPage
                  key={pageIndex}
                  cfg={cfg}
                  exam={exam}
                  pageIndex={pageIndex}
                  pageCount={pages.length}
                  pageQuestions={pageQuestions}
                  pageStartIndex={pageIndex * perPage}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

function SlotEditor({
  label,
  slot,
  onTextChange,
  onLinkChange,
}: {
  label: string;
  slot: PdfTextSlot;
  onTextChange: (value: string) => void;
  onLinkChange: (value: string) => void;
}) {
  return (
    <div className="glass-strong rounded-xl p-3 space-y-2">
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <input value={slot.text} onChange={(e) => onTextChange(e.target.value)} placeholder="লেখা" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs" />
      <div className="relative">
        <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={slot.link} onChange={(e) => onLinkChange(e.target.value)} placeholder="লিংক (ঐচ্ছিক)" className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-xs" />
      </div>
    </div>
  );
}

function PdfPage({
  cfg,
  exam,
  pageIndex,
  pageCount,
  pageQuestions,
  pageStartIndex,
}: {
  cfg: PdfConfig;
  exam: Exam;
  pageIndex: number;
  pageCount: number;
  pageQuestions: Question[];
  pageStartIndex: number;
}) {
  const columns = cfg.twoColumn ? splitIntoColumns(pageQuestions) : { left: pageQuestions, right: [] as Question[] };

  return (
    <div
      data-pdf-page
      style={{
        width: "210mm",
        minHeight: "297mm",
        background: "white",
        color: "#111",
        fontFamily: "Hind Siliguri, Noto Sans Bengali, system-ui, sans-serif",
      }}
      className="mx-auto shadow-lg flex flex-col"
    >
      <div style={{ padding: "18px 28px 10px", borderBottom: `2px solid ${cfg.primaryColor}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", gap: 12, fontSize: 10.5, color: "#555" }}>
          <SlotView align="left" slot={cfg.header.left} color={cfg.primaryColor} />
          <SlotView align="center" slot={cfg.header.center} color={cfg.primaryColor} />
          <SlotView align="right" slot={cfg.header.right} color={cfg.primaryColor} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
          {cfg.logoDataUrl && <img src={cfg.logoDataUrl} alt="logo" style={{ width: 46, height: 46, objectFit: "contain" }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            {pageIndex === 0 ? (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: cfg.primaryColor, margin: 0 }}>{cfg.title}</h1>
                {cfg.subtitle && <p style={{ fontSize: 12, color: "#444", margin: "2px 0 0" }}>{cfg.subtitle}</p>}
              </>
            ) : (
              <p style={{ fontSize: 12, fontWeight: 700, color: cfg.primaryColor, margin: 0 }}>{cfg.title}</p>
            )}
          </div>
          <div style={{ fontSize: 10, color: "#666", textAlign: "right", minWidth: 90 }}>
            <p style={{ margin: 0 }}>সময়: {exam.duration} মিনিট</p>
            <p style={{ margin: 0 }}>মোট: {exam.questions.length}</p>
            <p style={{ margin: 0 }}>পেজ {pageIndex + 1}/{pageCount}</p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "14px 28px", display: "grid", gridTemplateColumns: cfg.twoColumn ? "1fr 1fr" : "1fr", gap: 18 }}>
        <QuestionColumn questions={columns.left} startIndex={pageStartIndex} cfg={cfg} />
        {cfg.twoColumn && <QuestionColumn questions={columns.right} startIndex={pageStartIndex + columns.left.length} cfg={cfg} />}
      </div>

      <div style={{ marginTop: "auto", padding: "8px 28px 12px", borderTop: `1px solid ${cfg.primaryColor}40` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", gap: 12, fontSize: 10, color: "#555" }}>
          <SlotView align="left" slot={cfg.footer.left} color={cfg.primaryColor} />
          <SlotView align="center" slot={cfg.footer.center} color={cfg.primaryColor} />
          <SlotView align="right" slot={cfg.footer.right} color={cfg.primaryColor} />
        </div>
      </div>
    </div>
  );
}

function QuestionColumn({ questions, startIndex, cfg }: { questions: Question[]; startIndex: number; cfg: PdfConfig }) {
  return (
    <div>
      {questions.map((question, questionIndex) => (
        <PdfQuestion key={question.id} question={question} questionNumber={startIndex + questionIndex + 1} cfg={cfg} />
      ))}
    </div>
  );
}

function PdfQuestion({ question, questionNumber, cfg }: { question: Question; questionNumber: number; cfg: PdfConfig }) {
  const correctAnswer = getCorrectAnswerText(question);

  return (
    <div style={{ marginBottom: 14, breakInside: "avoid", pageBreakInside: "avoid" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.2, lineHeight: 1.5, marginBottom: 6 }}>
        <span style={{ fontWeight: 700, color: cfg.primaryColor, minWidth: 24 }}>{questionNumber}.</span>
        <div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: renderMathHtml(question.question) }} />
      </div>

      {question.questionImage && (
        <img src={question.questionImage} alt="question" style={{ maxWidth: "100%", maxHeight: 130, marginLeft: 32, marginBottom: 6, objectFit: "contain" }} />
      )}

      <div style={{ marginLeft: 32, display: "grid", gap: 4 }}>
        {question.options.map((option, optionIndex) => {
          const letter = String.fromCharCode(65 + optionIndex);
          const isCorrect = cfg.showAnswers && option === correctAnswer;
          return (
            <div
              key={`${question.id}-${optionIndex}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: isCorrect ? "6px 8px" : "2px 0",
                borderRadius: 6,
                border: isCorrect ? `1px solid ${cfg.primaryColor}55` : "1px solid transparent",
                background: isCorrect ? `${cfg.primaryColor}16` : "transparent",
                color: isCorrect ? cfg.primaryColor : "#222",
                fontWeight: isCorrect ? 700 : 400,
                fontSize: 11.2,
                lineHeight: 1.5,
              }}
            >
              <span style={{ width: 26, flexShrink: 0, fontWeight: 700 }}>({letter})</span>
              <div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: renderMathHtml(option) }} />
            </div>
          );
        })}
      </div>

      {cfg.showExplanations && question.explanation && (
        <div style={{ marginLeft: 32, marginTop: 6, padding: 8, background: "#f5f7fb", fontSize: 10.5, lineHeight: 1.55, borderLeft: `3px solid ${cfg.primaryColor}`, borderRadius: 4 }}>
          <strong>ব্যাখ্যা: </strong>
          <span dangerouslySetInnerHTML={{ __html: renderMathHtml(question.explanation) }} />
        </div>
      )}
    </div>
  );
}

function SlotView({ align, slot, color }: { align: "left" | "center" | "right"; slot: PdfTextSlot; color: string }) {
  return (
    <div style={{ textAlign: align as "left" | "center" | "right", minHeight: 22 }}>
      {slot.text ? (
        <span style={{ color: slot.link ? color : "#555", fontWeight: slot.link ? 700 : 500, textDecoration: slot.link ? "underline" : "none", textUnderlineOffset: 2 }}>
          {slot.text}
        </span>
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}

export default ExamPdfExporter;