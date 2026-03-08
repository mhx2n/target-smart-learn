import { Exam, ExamResult, Notice } from "./types";
import { demoExams, demoNotices } from "./data";

const EXAMS_KEY = "target_exams";
const NOTICES_KEY = "target_notices";
const RESULTS_KEY = "target_results";
const ADMIN_KEY = "target_admin";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const store = {
  getExams: (): Exam[] => load(EXAMS_KEY, demoExams),
  setExams: (exams: Exam[]) => save(EXAMS_KEY, exams),

  getNotices: (): Notice[] => load(NOTICES_KEY, demoNotices),
  setNotices: (notices: Notice[]) => save(NOTICES_KEY, notices),

  getResults: (): ExamResult[] => load(RESULTS_KEY, []),
  addResult: (result: ExamResult) => {
    const results = load<ExamResult[]>(RESULTS_KEY, []);
    results.unshift(result);
    save(RESULTS_KEY, results);
  },

  isAdmin: (): boolean => load(ADMIN_KEY, false),
  setAdmin: (val: boolean) => save(ADMIN_KEY, val),
};
