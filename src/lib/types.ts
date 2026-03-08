export interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  type: string;
  section: string;
}

export interface Section {
  id: string;
  name: string;
  description: string;
  order: number;
  createdAt: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  category: string;
  chapter: string;
  sectionId?: string;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  duration: number; // minutes
  negativeMarking: number; // e.g. 0, 0.25, 0.5, 1
  questions: Question[];
  published: boolean;
  featured: boolean;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
}

export interface ExamResult {
  examId: string;
  examTitle: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  skipped: number;
  negativeMarks: number;
  finalScore: number;
  maxScore: number;
  percentage: number;
  answers: Record<string, string>;
  timestamp: string;
}
