import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/brand";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/enroll-guide")({
  head: () => ({
    meta: [
      { title: "Enroll a phone — Lockbizz" },
      { name: "description", content: "Step-by-step guide to enrolling a financed phone with Lockbizz." },
      { property: "og:title", content: "Enroll a phone — Lockbizz" },
      { property: "og:description", content: "Step-by-step guide to enrolling a financed phone with Lockbizz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Guide,
});

type L = { en: string; ur: string };
const STEPS: { title: L; items: L[] }[] = [
  {
    title: { en: "Before you start", ur: "شروع کرنے سے پہلے" },
    items: [
      { en: "Use a new or factory-reset phone. Do not add a Google account yet.", ur: "نیا یا فیکٹری ری سیٹ موبائل استعمال کریں۔ ابھی گوگل اکاؤنٹ شامل نہ کریں۔" },
      { en: "Keep Wi-Fi ready and the phone charged above 50%.", ur: "وائی فائی تیار رکھیں اور موبائل کی بیٹری 50٪ سے زیادہ ہو۔" },
      { en: "The customer must sign the agreement and agree to the lock and location rules.", ur: "گاہک معاہدے پر دستخط کرے اور لاک اور لوکیشن کی شرائط سے رضامندی دے۔" },
    ],
  },
  {
    title: { en: "Create the contract", ur: "معاہدہ بنائیں" },
    items: [
      { en: "Add the customer, then record the financed sale and phone details.", ur: "گاہک شامل کریں، پھر قسطوں پر فروخت اور موبائل کی تفصیل درج کریں۔" },
      { en: "Open the customer's page and show the enrollment QR code.", ur: "گاہک کا صفحہ کھولیں اور اندراج کا QR کوڈ دکھائیں۔" },
    ],
  },
  {
    title: { en: "Scan the QR", ur: "QR اسکین کریں" },
    items: [
      { en: "On the phone's first welcome screen, tap the same spot 6 times.", ur: "موبائل کی پہلی ویلکم اسکرین پر ایک ہی جگہ 6 بار ٹیپ کریں۔" },
      { en: "Connect to Wi-Fi, then scan the QR code from the dashboard.", ur: "وائی فائی سے جڑیں، پھر ڈیش بورڈ کا QR کوڈ اسکین کریں۔" },
      { en: "Wait while Lockbizz installs and becomes the phone's manager. Finish setup.", ur: "Lockbizz کے انسٹال ہونے تک انتظار کریں، پھر سیٹ اپ مکمل کریں۔" },
    ],
  },
  {
    title: { en: "Confirm it worked", ur: "تصدیق کریں" },
    items: [
      { en: "The phone appears on the Devices page with a recent check-in.", ur: "موبائل، موبائل والے صفحے پر حالیہ رابطے کے ساتھ نظر آئے۔" },
      { en: "Test Lock and Unlock once in front of the customer.", ur: "گاہک کے سامنے ایک بار لاک اور اَن لاک آزمائیں۔" },
    ],
  },
  {
    title: { en: "If the client factory-resets the phone", ur: "اگر گاہک فیکٹری ری سیٹ کر دے" },
    items: [
      { en: "The app is removed, but Google account protection asks for the old account before the phone can be used.", ur: "ایپ ہٹ جاتی ہے، مگر گوگل اکاؤنٹ پروٹیکشن پرانا اکاؤنٹ مانگے گی۔" },
      { en: "Watch the \"last check-in\" time. A phone that stops checking in needs attention.", ur: "\"آخری رابطہ\" کا وقت دیکھتے رہیں۔ رابطہ بند ہو تو توجہ دیں۔" },
      { en: "Contact the customer, collect the phone, and enroll it again with a new QR.", ur: "گاہک سے رابطہ کریں، موبائل واپس لیں اور نئے QR سے دوبارہ اندراج کریں۔" },
    ],
  },
  {
    title: { en: "Releasing the phone", ur: "موبائل آزاد کرنا" },
    items: [
      { en: "When the final payment is approved, the phone is released automatically.", ur: "آخری ادائیگی منظور ہوتے ہی موبائل خود بخود آزاد ہو جاتا ہے۔" },
      { en: "Check the Devices page shows it as released, then the customer can uninstall the app.", ur: "تصدیق کریں کہ موبائل آزاد دکھا رہا ہے، پھر گاہک ایپ ہٹا سکتا ہے۔" },
    ],
  },
  {
    title: { en: "Rules to remember", ur: "یاد رکھنے کے اصول" },
    items: [
      { en: "Calls and the emergency dialer always work, even when locked.", ur: "لاک ہونے پر بھی کالز اور ایمرجنسی ڈائلر ہمیشہ کام کرتے ہیں۔" },
      { en: "Location is used only with the customer's consent.", ur: "لوکیشن صرف گاہک کی رضامندی سے استعمال ہوتی ہے۔" },
    ],
  },
];

function Guide() {
  const { lang } = useI18n();
  return (
    <>
      <PageHeader
        title={lang === "ur" ? "موبائل کا اندراج" : "Enroll a phone"}
        subtitle={lang === "ur" ? "قدم بہ قدم رہنمائی" : "Step-by-step setup for a financed phone."}
      />
      <ol className="space-y-4">
        {STEPS.map((s, i) => (
          <li key={i} className="lb-card p-5">
            <h2 className="mb-3 flex items-center gap-3 font-display text-lg font-bold">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm text-primary-foreground">{i + 1}</span>
              {s.title[lang]}
            </h2>
            <ul className="list-disc space-y-1.5 ps-12 text-sm text-muted-foreground">
              {s.items.map((it, j) => <li key={j}>{it[lang]}</li>)}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}
