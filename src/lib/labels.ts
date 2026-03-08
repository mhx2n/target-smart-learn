import { store } from "./store";

// Default labels - these are the fallback values
export const defaultLabels: Record<string, string> = {
  // Navbar
  navHome: "হোম",
  navExams: "পরীক্ষা",
  navResults: "ফলাফল",
  navNotices: "নোটিস",
  navProfile: "প্রোফাইল",
  navAbout: "সম্পর্কে",

  // Homepage
  searchPlaceholder: "পরীক্ষা খুঁজুন...",
  ctaExams: "পরীক্ষা দিন",
  ctaResults: "ফলাফল দেখুন",
  statTotalExams: "মোট পরীক্ষা",
  statSubjects: "বিষয়",
  statPractice: "অনুশীলন",
  statNotices: "নোটিস",
  recentResults: "📊 সাম্প্রতিক ফলাফল",
  viewAll: "সব দেখুন",
  noticeBoard: "নোটিস বোর্ড",
  featuredExams: "⭐ বিশেষ পরীক্ষা",
  allExams: "📝 সকল পরীক্ষা",
  viewMore: "আরও দেখুন",
  pinned: "📌 পিন",

  // Exam Card
  startExam: "পরীক্ষা শুরু করুন",
  questions: "প্রশ্ন",
  minutes: "মিনিট",
  diffEasy: "সহজ",
  diffMedium: "মাঝারি",
  diffHard: "কঠিন",

  // Exams Page
  examsPageTitle: "📝 পরীক্ষা সমূহ",
  tabSections: "সেকশন",
  tabSubjects: "বিষয়",
  searchHint: "খুঁজুন...",
  allSubjects: "সকল বিষয়",
  diffAll: "সকল",
  noSections: "কোনো সেকশন পাওয়া যায়নি",
  noExams: "কোনো পরীক্ষা পাওয়া যায়নি",
  examCount: "পরীক্ষা",
  viewSection: "দেখুন →",

  // Footer
  quickLinks: "দ্রুত লিঙ্ক",
  contact: "যোগাযোগ",
  allRightsReserved: "সকল স্বত্ব সংরক্ষিত",

  // Results
  resultsTitle: "📊 ফলাফল",

  // Notices
  noticesTitle: "📢 নোটিস বোর্ড",
};

export function getLabel(key: string, fallback?: string): string {
  const settings = store.getSiteSettings();
  const custom = settings.uiLabels?.[key];
  if (custom) return custom;
  return defaultLabels[key] || fallback || key;
}
