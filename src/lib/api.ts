import { supabase } from "@/integrations/supabase/client";
import type { Exam, Question, Notice, Section, SiteSettings, ExamResult, Reminder, EventBanner } from "./types";
import { store } from "./store";
import {
  BACKEND_CACHE_KEYS,
  readCachedData,
  writeCachedData,
  withBackendReadFallback,
  withBackendWrite,
} from "./backend";

// ============ HELPERS ============

function dbExamToApp(row: any, questions: Question[] = []): Exam {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    category: row.category || "",
    chapter: row.chapter || "",
    sectionId: row.section_id || undefined,
    difficulty: row.difficulty as "easy" | "medium" | "hard",
    questionCount: row.question_count,
    duration: row.duration,
    negativeMarking: Number(row.negative_marking),
    published: row.published,
    featured: row.featured,
    createdAt: row.created_at,
    questions,
    mandatorySubjects: Array.isArray(row.mandatory_subjects) ? row.mandatory_subjects : [],
  };
}

function dbQuestionToApp(row: any): Question {
  return {
    id: row.id,
    question: row.question,
    questionImage: row.question_image || undefined,
    options: Array.isArray(row.options) ? row.options as string[] : JSON.parse(row.options as string),
    optionImages: row.option_images ? (Array.isArray(row.option_images) ? row.option_images : JSON.parse(row.option_images as string)) : undefined,
    answer: row.answer,
    explanation: row.explanation,
    type: row.type,
    section: row.section,
  };
}

function upsertCachedExam(exam: Exam) {
  const cachedExams = readCachedData<Exam[]>(BACKEND_CACHE_KEYS.exams, []);
  const next = cachedExams.some((cachedExam) => cachedExam.id === exam.id)
    ? cachedExams.map((cachedExam) => (cachedExam.id === exam.id ? exam : cachedExam))
    : [exam, ...cachedExams];

  writeCachedData(BACKEND_CACHE_KEYS.exams, next);
}

// ============ EXAMS ============

export async function fetchExams(): Promise<Exam[]> {
  return withBackendReadFallback(
    async () => {
      const { data: exams, error } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!exams?.length) return [];

      const { data: questions } = await supabase
        .from("questions")
        .select("*")
        .in("exam_id", exams.map((e) => e.id))
        .order("sort_order", { ascending: true });

      const qMap = new Map<string, Question[]>();
      (questions || []).forEach((q) => {
        const arr = qMap.get(q.exam_id) || [];
        arr.push(dbQuestionToApp(q));
        qMap.set(q.exam_id, arr);
      });

      return exams.map((e) => dbExamToApp(e, qMap.get(e.id) || []));
    },
    () => readCachedData<Exam[]>(BACKEND_CACHE_KEYS.exams, []),
    (data) => writeCachedData(BACKEND_CACHE_KEYS.exams, data),
  );
}

export async function fetchExamById(id: string): Promise<Exam | null> {
  return withBackendReadFallback(
    async () => {
      const { data: exam, error } = await supabase
        .from("exams")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!exam) return null;

      const { data: questions } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", id)
        .order("sort_order", { ascending: true });

      return dbExamToApp(exam, (questions || []).map(dbQuestionToApp));
    },
    () => readCachedData<Exam[]>(BACKEND_CACHE_KEYS.exams, []).find((exam) => exam.id === id) || null,
    (exam) => {
      if (exam) upsertCachedExam(exam);
    },
  );
}

export async function upsertExam(exam: Exam): Promise<void> {
  const { questions, ...rest } = exam;
  await withBackendWrite(
    async () => {
      const { error } = await supabase.from("exams").upsert({
        id: rest.id,
        title: rest.title,
        subject: rest.subject,
        category: rest.category,
        chapter: rest.chapter,
        section_id: rest.sectionId || null,
        difficulty: rest.difficulty,
        question_count: rest.questionCount,
        duration: rest.duration,
        negative_marking: rest.negativeMarking,
        published: rest.published,
        featured: rest.featured,
        created_at: rest.createdAt,
        mandatory_subjects: rest.mandatorySubjects || [],
      } as any);
      if (error) throw error;

      await supabase.from("questions").delete().eq("exam_id", exam.id);
      if (questions.length > 0) {
        const { error: qErr } = await supabase.from("questions").insert(
          questions.map((q, i) => ({
            id: q.id,
            exam_id: exam.id,
            question: q.question,
            question_image: q.questionImage || null,
            options: q.options as any,
            option_images: q.optionImages as any || null,
            answer: q.answer,
            explanation: q.explanation,
            type: q.type,
            section: q.section,
            sort_order: i,
          }))
        );
        if (qErr) throw qErr;
      }
    },
    { action: "পরীক্ষা সেভ" },
  );
}

export async function deleteExam(id: string): Promise<void> {
  await withBackendWrite(async () => {
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) throw error;
  }, { action: "পরীক্ষা ডিলিট" });
}

export async function updateExamField(id: string, field: string, value: any): Promise<void> {
  const dbField = field === "sectionId" ? "section_id" : field;
  await withBackendWrite(async () => {
    const { error } = await supabase.from("exams").update({ [dbField]: value } as any).eq("id", id);
    if (error) throw error;
  }, { action: "পরীক্ষা আপডেট" });
}

// ============ NOTICES ============

export async function fetchNotices(): Promise<Notice[]> {
  return withBackendReadFallback(
    async () => {
      const { data, error } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        image: n.image || undefined,
        pinned: n.pinned,
        createdAt: n.created_at,
      }));
    },
    () => readCachedData<Notice[]>(BACKEND_CACHE_KEYS.notices, []),
    (data) => writeCachedData(BACKEND_CACHE_KEYS.notices, data),
  );
}

export async function upsertNotice(notice: Notice): Promise<void> {
  await withBackendWrite(async () => {
    const { error } = await supabase.from("notices").upsert({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      image: notice.image || null,
      pinned: notice.pinned,
      created_at: notice.createdAt,
    });
    if (error) throw error;
  }, { action: "নোটিস সেভ" });
}

export async function deleteNotice(id: string): Promise<void> {
  await withBackendWrite(async () => {
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) throw error;
  }, { action: "নোটিস ডিলিট" });
}

// ============ SECTIONS ============

export async function fetchSections(): Promise<Section[]> {
  return withBackendReadFallback(
    async () => {
      const { data, error } = await supabase.from("sections").select("*").order("order", { ascending: true });
      if (error) throw error;
      return (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        image: s.image || undefined,
        caption: s.caption || undefined,
        order: s.order,
        createdAt: s.created_at,
      }));
    },
    () => readCachedData<Section[]>(BACKEND_CACHE_KEYS.sections, []),
    (data) => writeCachedData(BACKEND_CACHE_KEYS.sections, data),
  );
}

export async function upsertSection(section: Section): Promise<void> {
  await withBackendWrite(async () => {
    const { error } = await supabase.from("sections").upsert({
      id: section.id,
      name: section.name,
      description: section.description,
      image: section.image || null,
      caption: section.caption || null,
      order: section.order,
      created_at: section.createdAt,
    });
    if (error) throw error;
  }, { action: "সেকশন সেভ" });
}

export async function deleteSection(id: string): Promise<void> {
  await withBackendWrite(async () => {
    const { error } = await supabase.from("sections").delete().eq("id", id);
    if (error) throw error;
  }, { action: "সেকশন ডিলিট" });
}

// ============ SESSION ============

function getSessionId(): string {
  let id = localStorage.getItem("target_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("target_session_id", id);
  }
  return id;
}

// ============ RESULTS ============

export async function fetchResults(): Promise<ExamResult[]> {
  const sessionId = getSessionId();
  return withBackendReadFallback(
    async () => {
      const { data, error } = await supabase
        .from("results")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => ({
        examId: r.exam_id,
        examTitle: r.exam_title,
        totalQuestions: r.total_questions,
        correct: r.correct,
        wrong: r.wrong,
        skipped: r.skipped,
        negativeMarks: Number(r.negative_marks),
        finalScore: Number(r.final_score),
        maxScore: Number(r.max_score),
        percentage: Number(r.percentage),
        answers: r.answers as Record<string, string>,
        timestamp: r.created_at,
      }));
    },
    () => store.getResults(),
    (data) => store.setResults(data),
  );
}

export async function addResult(result: ExamResult): Promise<void> {
  store.addResult(result);

  await withBackendWrite(async () => {
    const { error } = await supabase.from("results").insert({
      exam_id: result.examId,
      exam_title: result.examTitle,
      total_questions: result.totalQuestions,
      correct: result.correct,
      wrong: result.wrong,
      skipped: result.skipped,
      negative_marks: result.negativeMarks,
      final_score: result.finalScore,
      max_score: result.maxScore,
      percentage: result.percentage,
      answers: result.answers as any,
      session_id: getSessionId(),
    });
    if (error) throw error;
  }, { action: "ফলাফল সেভ", suppressConnectivityError: true });
}

// ============ SITE SETTINGS ============

const defaultSiteSettings: SiteSettings = {
  aboutTitle: "Target 🎯 কী?",
  aboutContent: "<p>Target 🎯 একটি আধুনিক শিক্ষামূলক পরীক্ষা অনুশীলন প্ল্যাটফর্ম।</p>",
  featuresTitle: "বৈশিষ্ট্যসমূহ",
  featuresContent: "<ul><li>সীমাহীন পরীক্ষা অনুশীলন</li></ul>",
  contactTitle: "যোগাযোগ",
  contactContent: "<p>আমাদের সাথে Telegram এ যোগাযোগ করুন।</p>",
  footerDescription: "আপনার পরীক্ষার প্রস্তুতি এখন আরও সহজ।",
  footerLinks: [
    { label: "পরীক্ষা সমূহ", url: "/exams" },
    { label: "ফলাফল", url: "/results" },
    { label: "নোটিস বোর্ড", url: "/notices" },
    { label: "সম্পর্কে", url: "/about" },
  ],
  socialLinks: [{ label: "Telegram", url: "https://t.me/FX_Ur_Target" }],
  brandName: "Target",
  brandEmoji: "🎯",
  heroTagline: "সীমাহীন অনুশীলন, নিখুঁত প্রস্তুতি",
  heroSubtitle: "",
  activeThemeId: "ocean-blue",
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  return withBackendReadFallback(
    async () => {
      const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return defaultSiteSettings;
      return {
        aboutTitle: data.about_title,
        aboutContent: data.about_content,
        featuresTitle: data.features_title,
        featuresContent: data.features_content,
        contactTitle: data.contact_title,
        contactContent: data.contact_content,
        footerDescription: data.footer_description,
        footerLinks: data.footer_links as any,
        socialLinks: data.social_links as any,
        brandName: data.brand_name,
        brandEmoji: data.brand_emoji,
        heroTagline: data.hero_tagline,
        heroSubtitle: data.hero_subtitle,
        activeThemeId: data.active_theme_id,
        customTheme: data.custom_theme as any || undefined,
        uiLabels: data.ui_labels as any || undefined,
      };
    },
    () => store.getSiteSettings(),
    (data) => store.setSiteSettings(data),
  );
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  store.setSiteSettings(settings);
  try {
    localStorage.setItem("target_site_settings", JSON.stringify(settings));
  } catch {}

  await withBackendWrite(async () => {
    const { data: existing } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
    const row = {
      about_title: settings.aboutTitle,
      about_content: settings.aboutContent,
      features_title: settings.featuresTitle,
      features_content: settings.featuresContent,
      contact_title: settings.contactTitle,
      contact_content: settings.contactContent,
      footer_description: settings.footerDescription,
      footer_links: settings.footerLinks as any,
      social_links: settings.socialLinks as any,
      brand_name: settings.brandName,
      brand_emoji: settings.brandEmoji,
      hero_tagline: settings.heroTagline,
      hero_subtitle: settings.heroSubtitle,
      active_theme_id: settings.activeThemeId,
      custom_theme: settings.customTheme as any || null,
      ui_labels: settings.uiLabels as any || null,
    };

    if (existing) {
      const { error } = await supabase.from("site_settings").update(row).eq("id", existing.id);
      if (error) throw error;
      return;
    }

    const { error } = await supabase.from("site_settings").insert(row);
    if (error) throw error;
  }, { action: "সাইট সেটিংস সেভ" });
}

// ============ SUBJECTS ============

export async function fetchSubjects(): Promise<string[]> {
  return withBackendReadFallback(
    async () => {
      const { data, error } = await supabase.from("subjects").select("name").order("name");
      if (error) throw error;
      return (data || []).map((s) => s.name);
    },
    () => readCachedData<string[]>(BACKEND_CACHE_KEYS.subjects, []),
    (data) => writeCachedData(BACKEND_CACHE_KEYS.subjects, data),
  );
}

export async function setSubjects(names: string[]): Promise<void> {
  await withBackendWrite(async () => {
    await supabase.from("subjects").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (names.length > 0) {
      const { error } = await supabase.from("subjects").insert(names.map((n) => ({ name: n })));
      if (error) throw error;
    }
  }, { action: "বিষয় সেভ" });
}

// ============ CATEGORIES ============

export async function fetchCategories(): Promise<string[]> {
  return withBackendReadFallback(
    async () => {
      const { data, error } = await supabase.from("categories").select("name").order("name");
      if (error) throw error;
      return (data || []).map((c) => c.name);
    },
    () => readCachedData<string[]>(BACKEND_CACHE_KEYS.categories, []),
    (data) => writeCachedData(BACKEND_CACHE_KEYS.categories, data),
  );
}

export async function setCategories(names: string[]): Promise<void> {
  await withBackendWrite(async () => {
    await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (names.length > 0) {
      const { error } = await supabase.from("categories").insert(names.map((n) => ({ name: n })));
      if (error) throw error;
    }
  }, { action: "ক্যাটেগরি সেভ" });
}

// ============ REMINDERS ============

export async function fetchReminders(): Promise<Reminder[]> {
  return withBackendReadFallback(
    async () => {
      const { data, error } = await supabase.from("reminders").select("*").order("target_date", { ascending: true });
      if (error) throw error;
      return (data || []).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        targetDate: r.target_date,
        color: r.color,
        createdAt: r.created_at,
      }));
    },
    () => readCachedData<Reminder[]>(BACKEND_CACHE_KEYS.reminders, []),
    (data) => writeCachedData(BACKEND_CACHE_KEYS.reminders, data),
  );
}

export async function upsertReminder(reminder: Reminder): Promise<void> {
  await withBackendWrite(async () => {
    const { error } = await supabase.from("reminders").upsert({
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      target_date: reminder.targetDate,
      color: reminder.color,
      created_at: reminder.createdAt,
    });
    if (error) throw error;
  }, { action: "রিমাইন্ডার সেভ" });
}

export async function deleteReminder(id: string): Promise<void> {
  await withBackendWrite(async () => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (error) throw error;
  }, { action: "রিমাইন্ডার ডিলিট" });
}

// ============ EVENT BANNERS ============

export async function fetchEventBanners(): Promise<EventBanner[]> {
  return withBackendReadFallback(
    async () => {
      const { data, error } = await supabase.from("event_banners").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((b) => ({
        id: b.id,
        image: b.image,
        caption: b.caption,
        targetDate: b.target_date,
        active: b.active,
        createdAt: b.created_at,
      }));
    },
    () => readCachedData<EventBanner[]>(BACKEND_CACHE_KEYS.eventBanners, []),
    (data) => writeCachedData(BACKEND_CACHE_KEYS.eventBanners, data),
  );
}

export async function upsertEventBanner(banner: EventBanner): Promise<void> {
  await withBackendWrite(async () => {
    const { error } = await supabase.from("event_banners").upsert({
      id: banner.id,
      image: banner.image,
      caption: banner.caption,
      target_date: banner.targetDate,
      active: banner.active,
      created_at: banner.createdAt,
    });
    if (error) throw error;
  }, { action: "ইভেন্ট ব্যানার সেভ" });
}

export async function deleteEventBanner(id: string): Promise<void> {
  await withBackendWrite(async () => {
    const { error } = await supabase.from("event_banners").delete().eq("id", id);
    if (error) throw error;
  }, { action: "ইভেন্ট ব্যানার ডিলিট" });
}

// ============ WRONG ANSWERS BANK ============

export interface WrongAnswerEntry {
  id?: string;
  sessionId: string;
  examId: string;
  examTitle: string;
  questionId: string;
  questionText: string;
  questionImage?: string;
  options: string[];
  optionImages?: (string | null)[];
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  section?: string;
  createdAt?: string;
}

export async function saveWrongAnswers(entries: WrongAnswerEntry[]): Promise<void> {
  if (!entries.length) return;
  const sessionId = getSessionId();

  const cachedEntries = store.getWrongAnswers<WrongAnswerEntry>();
  const cachedKeys = new Set(cachedEntries.map((entry) => `${entry.examId}:${entry.questionId}`));
  const mergedEntries = [...cachedEntries];

  entries.forEach((entry) => {
    const cacheKey = `${entry.examId}:${entry.questionId}`;
    if (cachedKeys.has(cacheKey)) return;
    cachedKeys.add(cacheKey);
    mergedEntries.unshift({ ...entry, sessionId });
  });

  store.setWrongAnswers(mergedEntries);
  
  await withBackendWrite(async () => {
    const { data: existing } = await supabase
      .from("wrong_answers")
      .select("question_id")
      .eq("session_id", sessionId);
    
    const existingQuestionIds = new Set((existing || []).map((r: any) => r.question_id));
    const newEntries = entries.filter((entry) => !existingQuestionIds.has(entry.questionId));
    
    if (!newEntries.length) return;

    const { error } = await supabase.from("wrong_answers").insert(
      newEntries.map((entry) => ({
        session_id: sessionId,
        exam_id: entry.examId,
        exam_title: entry.examTitle,
        question_id: entry.questionId,
        question_text: entry.questionText,
        question_image: entry.questionImage || null,
        options: entry.options as any,
        option_images: entry.optionImages as any || null,
        correct_answer: entry.correctAnswer,
        user_answer: entry.userAnswer,
        explanation: entry.explanation || "",
        section: entry.section || "",
      }))
    );
    if (error) throw error;
  }, { action: "ভুল উত্তর সেভ", suppressConnectivityError: true });
}

export async function fetchWrongAnswers(): Promise<WrongAnswerEntry[]> {
  const sessionId = getSessionId();
  return withBackendReadFallback(
    async () => {
      const { data, error } = await supabase
        .from("wrong_answers")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const mapped = (data || []).map((r: any) => ({
        id: r.id,
        sessionId: r.session_id,
        examId: r.exam_id,
        examTitle: r.exam_title,
        questionId: r.question_id,
        questionText: r.question_text,
        questionImage: r.question_image || undefined,
        options: Array.isArray(r.options) ? r.options : JSON.parse(r.options),
        optionImages: r.option_images ? (Array.isArray(r.option_images) ? r.option_images : JSON.parse(r.option_images)) : undefined,
        correctAnswer: r.correct_answer,
        userAnswer: r.user_answer,
        explanation: r.explanation,
        section: r.section || "",
        createdAt: r.created_at,
      }));

      store.setWrongAnswers(mapped);
      return mapped;
    },
    () => store.getWrongAnswers<WrongAnswerEntry>(),
  );
}

export async function deleteWrongAnswersByExam(examId: string): Promise<void> {
  const sessionId = getSessionId();
  store.setWrongAnswers(store.getWrongAnswers<WrongAnswerEntry>().filter((entry) => entry.examId !== examId));

  await withBackendWrite(async () => {
    const { error } = await supabase.from("wrong_answers").delete().eq("session_id", sessionId).eq("exam_id", examId);
    if (error) throw error;
  }, { action: "ভুল উত্তর ডিলিট", suppressConnectivityError: true });
}

// ============ PAGE VISITS ============

export async function trackPageVisit(pagePath: string): Promise<void> {
  const sessionId = getSessionId();
  await withBackendWrite(async () => {
    const { error } = await supabase.from("page_visits").insert({
      session_id: sessionId,
      page_path: pagePath,
    });
    if (error) throw error;
  }, { action: "ভিজিট ট্র্যাক", suppressConnectivityError: true });
}

export async function fetchVisitorStats(): Promise<{
  totalVisits: number;
  todayVisits: number;
  activeNow: number;
}> {
  return withBackendReadFallback(
    async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

      const { count: totalVisits } = await supabase
        .from("page_visits")
        .select("session_id", { count: "exact", head: true });

      const { data: todayData } = await supabase
        .from("page_visits")
        .select("session_id")
        .gte("created_at", todayStart);
      const todayUnique = new Set((todayData || []).map((row) => row.session_id)).size;

      const { data: activeData } = await supabase
        .from("page_visits")
        .select("session_id")
        .gte("created_at", fiveMinAgo);
      const activeUnique = new Set((activeData || []).map((row) => row.session_id)).size;

      return {
        totalVisits: totalVisits || 0,
        todayVisits: todayUnique,
        activeNow: activeUnique,
      };
    },
    () => ({
      totalVisits: 0,
      todayVisits: 0,
      activeNow: 0,
    }),
  );
}
