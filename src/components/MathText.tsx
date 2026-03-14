import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Renders text with inline LaTeX math expressions.
 * Supports $...$ for inline math and $$...$$ for display math.
 * Example: "m এর মান কত হলে $\vec{A} = m\hat{i}$"
 */
const MathText = ({ text, className = "" }: MathTextProps) => {
  const html = useMemo(() => {
    if (!text) return "";
    
    try {
      // Replace $$...$$ (display math) first, then $...$ (inline math)
      let result = text;
      
      // Display math: $$...$$
      result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch {
          return `$$${math}$$`;
        }
      });
      
      // Inline math: $...$
      result = result.replace(/\$([^\$]+?)\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `$${math}$`;
        }
      });
      
      return result;
    } catch {
      return text;
    }
  }, [text]);

  // If no math delimiters found, render as plain text
  if (!text?.includes("$")) {
    return <span className={className}>{text}</span>;
  }

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default MathText;
