import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "en" | "ur";

const dict: Record<string, { en: string; ur: string }> = {
  dashboard: { en: "Dashboard", ur: "ڈیش بورڈ" },
  customers: { en: "Customers", ur: "گاہک" },
  installments: { en: "Installments", ur: "اقساط" },
  payments: { en: "Payments", ur: "ادائیگیاں" },
  devices: { en: "Devices", ur: "موبائل" },
  reports: { en: "Reports", ur: "رپورٹس" },
  enrollGuide: { en: "Enroll a phone", ur: "موبائل کا اندراج" },
  settings: { en: "Settings", ur: "سیٹنگز" },
  signOut: { en: "Sign out", ur: "لاگ آؤٹ" },
  dueToday: { en: "Due today", ur: "آج کی اقساط" },
  overdue: { en: "Overdue", ur: "واجب الادا" },
  lockedDevices: { en: "Locked devices", ur: "لاک موبائل" },
  collectedToday: { en: "Collected today", ur: "آج کی وصولی" },
  collectedMonth: { en: "Collected this month", ur: "اس ماہ کی وصولی" },
  pendingApprovals: { en: "Pending approvals", ur: "منظوری کے منتظر" },
  addCustomer: { en: "Add customer", ur: "نیا گاہک" },
  newSale: { en: "New financed sale", ur: "نئی قسطوں پر فروخت" },
  signIn: { en: "Sign in", ur: "لاگ ان" },
  signUp: { en: "Create shop account", ur: "دکان کا اکاؤنٹ بنائیں" },
  lock: { en: "Lock", ur: "لاک" },
  unlock: { en: "Unlock", ur: "اَن لاک" },
  approve: { en: "Approve", ur: "منظور" },
  reject: { en: "Reject", ur: "مسترد" },
};

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("lb-lang") as Lang | null;
    if (saved === "ur" || saved === "en") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lb-lang", l);
  };
  const t = (k: string) => dict[k]?.[lang] ?? dict[k]?.en ?? k;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
