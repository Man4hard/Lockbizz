export const SETUP_STEPS = [
  { key: "agreement", en: "Agreement signed & consent", ur: "معاہدہ اور رضامندی" },
  { key: "reset", en: "Phone reset, no Google account", ur: "موبائل ری سیٹ، گوگل اکاؤنٹ نہیں" },
  { key: "qr", en: "QR scanned & app installed", ur: "QR اسکین اور ایپ انسٹال" },
  { key: "checkin", en: "Phone checked in", ur: "موبائل کا رابطہ ہوا" },
  { key: "locktest", en: "Lock/unlock tested", ur: "لاک/اَن لاک آزمایا" },
] as const;

export type SetupSteps = Record<string, boolean>;

export function setupProgress(steps: unknown): { done: number; total: number; complete: boolean } {
  const s = (steps && typeof steps === "object" ? steps : {}) as SetupSteps;
  const done = SETUP_STEPS.filter((x) => s[x.key] === true).length;
  return { done, total: SETUP_STEPS.length, complete: done === SETUP_STEPS.length };
}
