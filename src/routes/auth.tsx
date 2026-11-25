import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, ShieldCheck, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Lockbizz" },
      { name: "description", content: "Sign in or create your shop account on Lockbizz." },
      { property: "og:title", content: "Sign in — Lockbizz" },
      { property: "og:description", content: "Sign in or create your shop account on Lockbizz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { t, lang, setLang } = useI18n();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [f, setF] = useState({ email: "", password: "", shop: "", name: "", phone: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
        if (error) throw error;
        nav({ to: "/dashboard" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: f.email,
          password: f.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { shop_name: f.shop, name: f.name, phone: f.phone },
          },
        });
        if (error) throw error;
        if (data.session) nav({ to: "/dashboard" });
        else setSent(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 text-sidebar-foreground lg:flex [background:var(--gradient-hero)]">
        <div className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Lock className="size-5" />
          </span>
          Lockbizz
        </div>
        <div className="space-y-6">
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Sell on installments.
            <br />
            Stay in control of every phone.
          </h1>
          <ul className="space-y-3 text-sm opacity-90">
            <li className="flex gap-3"><Smartphone className="size-5 shrink-0 text-sidebar-primary" /> Enroll phones with a QR code, track due dates and collections.</li>
            <li className="flex gap-3"><Lock className="size-5 shrink-0 text-sidebar-primary" /> Lock overdue devices — works even offline with one-time codes.</li>
            <li className="flex gap-3"><ShieldCheck className="size-5 shrink-0 text-sidebar-primary" /> Calls and emergency dialer always stay available.</li>
          </ul>
        </div>
        <p className="text-xs opacity-60">For mobile installment shops in Pakistan</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">{mode === "in" ? t("signIn") : t("signUp")}</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => setLang(lang === "en" ? "ur" : "en")}>
              {lang === "en" ? "اردو" : "English"}
            </Button>
          </div>

          {sent ? (
            <div className="lb-card p-5 text-sm">
              <p className="font-semibold">Check your email</p>
              <p className="mt-1 text-muted-foreground">
                We sent a confirmation link to {f.email}. Open it, then sign in.
              </p>
            </div>
          ) : (
            <>
              {mode === "up" && (
                <>
                  <Field label="Shop name"><Input required value={f.shop} onChange={set("shop")} /></Field>
                  <Field label="Your name"><Input required value={f.name} onChange={set("name")} /></Field>
                  <Field label="Phone"><Input type="tel" value={f.phone} onChange={set("phone")} /></Field>
                </>
              )}
              <Field label="Email"><Input type="email" required value={f.email} onChange={set("email")} /></Field>
              <Field label="Password"><Input type="password" required minLength={8} value={f.password} onChange={set("password")} /></Field>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : mode === "in" ? t("signIn") : t("signUp")}
              </Button>
            </>
          )}
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => { setMode(mode === "in" ? "up" : "in"); setSent(false); }}
          >
            {mode === "in" ? "New shop? Create an account" : "Already registered? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
