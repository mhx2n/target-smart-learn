import React, { createContext, useContext, ReactNode } from "react";
import { useSiteSettings } from "@/hooks/useSupabaseData";
import type { SiteSettings } from "@/lib/types";

const defaultSettings: SiteSettings = {
  aboutTitle: "Target 🎯 কী?",
  aboutContent: "",
  featuresTitle: "বৈশিষ্ট্যসমূহ",
  featuresContent: "",
  contactTitle: "যোগাযোগ",
  contactContent: "",
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

// Module-level cache so getLabel() still works as a plain function
let _cachedSettings: SiteSettings = defaultSettings;
export function getCachedSettings(): SiteSettings {
  return _cachedSettings;
}

const SiteSettingsContext = createContext<SiteSettings>(defaultSettings);

export function useSiteSettingsContext() {
  return useContext(SiteSettingsContext);
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings } = useSiteSettings();
  const value = settings || defaultSettings;
  
  // Update module-level cache for getLabel
  _cachedSettings = value;

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
