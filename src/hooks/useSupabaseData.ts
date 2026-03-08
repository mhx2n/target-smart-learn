import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { Exam, Notice, Section, SiteSettings, ExamResult, Reminder, EventBanner } from "@/lib/types";

// ============ EXAMS ============
export function useExams() {
  return useQuery({ queryKey: ["exams"], queryFn: api.fetchExams });
}

export function useExamById(id: string | undefined) {
  return useQuery({
    queryKey: ["exams", id],
    queryFn: () => api.fetchExamById(id!),
    enabled: !!id,
  });
}

export function useUpsertExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exam: Exam) => api.upsertExam(exam),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteExam(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

export function useUpdateExamField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, field, value }: { id: string; field: string; value: any }) =>
      api.updateExamField(id, field, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

// ============ NOTICES ============
export function useNotices() {
  return useQuery({ queryKey: ["notices"], queryFn: api.fetchNotices });
}

export function useUpsertNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notice: Notice) => api.upsertNotice(notice),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notices"] }),
  });
}

export function useDeleteNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteNotice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notices"] }),
  });
}

// ============ SECTIONS ============
export function useSections() {
  return useQuery({ queryKey: ["sections"], queryFn: api.fetchSections });
}

export function useUpsertSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (section: Section) => api.upsertSection(section),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sections"] }),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteSection(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sections"] }),
  });
}

// ============ RESULTS ============
export function useResults() {
  return useQuery({ queryKey: ["results"], queryFn: api.fetchResults });
}

export function useAddResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (result: ExamResult) => api.addResult(result),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["results"] }),
  });
}

// ============ SITE SETTINGS ============
export function useSiteSettings() {
  return useQuery({ queryKey: ["site-settings"], queryFn: api.fetchSiteSettings });
}

export function useSaveSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: SiteSettings) => api.saveSiteSettings(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-settings"] }),
  });
}

// ============ SUBJECTS ============
export function useSubjects() {
  return useQuery({ queryKey: ["subjects"], queryFn: api.fetchSubjects });
}

export function useSetSubjects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) => api.setSubjects(names),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

// ============ CATEGORIES ============
export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: api.fetchCategories });
}

export function useSetCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) => api.setCategories(names),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

// ============ REMINDERS ============
export function useReminders() {
  return useQuery({ queryKey: ["reminders"], queryFn: api.fetchReminders });
}

export function useUpsertReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reminder: Reminder) => api.upsertReminder(reminder),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteReminder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

// ============ EVENT BANNERS ============
export function useEventBanners() {
  return useQuery({ queryKey: ["event-banners"], queryFn: api.fetchEventBanners });
}

export function useUpsertEventBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (banner: EventBanner) => api.upsertEventBanner(banner),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event-banners"] }),
  });
}

export function useDeleteEventBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteEventBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event-banners"] }),
  });
}
