import katex from "katex";
import type { Question } from "@/lib/types";
import { resolveCorrectOptionText } from "@/lib/answerUtils";

export interface PdfTextSlot {
  text: string;
  link: string;
}

export interface PdfConfig {
  title: string;
  subtitle: string;
  logoDataUrl: string;
  showAnswers: boolean;
  showExplanations: boolean;
  twoColumn: boolean;
  primaryColor: string;
  header: {
    left: PdfTextSlot;
    center: PdfTextSlot;
    right: PdfTextSlot;
  };
  footer: {
    left: PdfTextSlot;
    center: PdfTextSlot;
    right: PdfTextSlot;
  };
}

export const createEmptyPdfSlot = (): PdfTextSlot => ({ text: "", link: "" });

export const DEFAULT_PDF_CONFIG: PdfConfig = {
  title: "",
  subtitle: "",
  logoDataUrl: "",
  showAnswers: false,
  showExplanations: false,
  twoColumn: false,
  primaryColor: "#2563eb",
  header: {
    left: { text: "Target — Smart Exam Platform", link: "" },
    center: createEmptyPdfSlot(),
    right: createEmptyPdfSlot(),
  },
  footer: {
    left: { text: "© Target. সর্বস্বত্ব সংরক্ষিত।", link: "" },
    center: createEmptyPdfSlot(),
    right: createEmptyPdfSlot(),
  },
};

export function renderMathHtml(text: string): string {
  if (!text) return "";

  let out = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  out = out.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `$$${math}$$`;
    }
  });

  out = out.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return math;
    }
  });

  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return math;
    }
  });

  out = out.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `$${math}$`;
    }
  });

  return out;
}

export function getCorrectAnswerText(question: Question): string {
  return resolveCorrectOptionText(question);
}

export function splitIntoColumns<T>(items: T[]) {
  const midpoint = Math.ceil(items.length / 2);
  return {
    left: items.slice(0, midpoint),
    right: items.slice(midpoint),
  };
}

export function normalizePdfUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}