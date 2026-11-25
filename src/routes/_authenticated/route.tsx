import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3, CalendarClock, CreditCard, Languages, LayoutDashboard, Lock, LogOut, Menu, Settings, Smartphone, Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { userId: data.user.id };
  },
  component: Shell,
});

const NAV = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/customers", key: "customers", icon: Users },
  { to: "/installments", key: "installments", icon: CalendarClock },
  { to: "/payments", key: "payments", icon: CreditCard },
  { to: "/devices", key: "devices", icon: Smartphone },
  { to: "/reports", key: "reports", icon: BarChart3 },
  { to: "/settings", key: "settings", icon: Settings },
] as const;

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t, lang, setLang } = useI18n();
  const nav = useNavigate();
  const { data: tenant } = useQuery({
    queryKey: ["tenant"],
    queryFn: async () => (await supabase.from("tenants").select("name, plan").single()).data,
  });
  return (
    <div className="flex h-full flex-col bg-sidebar p-4 text-sidebar-foreground">
      <div className="mb-6 flex items-center gap-2 px-2 font-display text-lg font-bold">
        <span className="grid size-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Lock className="size-4" />
        </span>
        Lockbizz
      </div>
      <div className="mb-4 rounded-lg bg-sidebar-accent px-3 py-2 text-xs">
        <p className="opacity-60">Shop</p>
        <p className="truncate text-sm font-semibold">{tenant?.name ?? "…"}</p>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium opacity-80 transition hover:bg-sidebar-accent hover:opacity-100"
            activeProps={{ className: "bg-sidebar-accent !opacity-100 text-sidebar-primary" }}
          >
            <n.icon className="size-4" />
            {t(n.key)}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border pt-3">
        <button
          onClick={() => setLang(lang === "en" ? "ur" : "en")}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-80 hover:bg-sidebar-accent"
        >
          <Languages className="size-4" /> {lang === "en" ? "اردو" : "English"}
        </button>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            nav({ to: "/auth" });
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-80 hover:bg-sidebar-accent"
        >
          <LogOut className="size-4" /> {t("signOut")}
        </button>
      </div>
    </div>
  );
}

function Shell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">
        <SideNav />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Menu"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-0 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SideNav onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-display font-bold">Lockbizz</span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
