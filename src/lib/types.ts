export interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  type: string;
  section: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  category: string;
  chapter: string;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  duration: number; // minutes
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
  score: number;
  answers: Record<string, string>;
  timestamp: string;
}
