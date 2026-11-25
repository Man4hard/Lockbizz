import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, PageHeader, DeviceControls, StatusBadge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { SetupChecklist } from "@/components/SetupChecklist";
import { setupProgress } from "@/lib/setup-steps";

export const Route = createFileRoute("/_authenticated/devices")({
  head: () => ({
    meta: [
      { title: "Devices — Lockbizz" },
      { name: "description", content: "All enrolled phones with lock state and remote commands." },
      { property: "og:title", content: "Devices — Lockbizz" },
      { property: "og:description", content: "All enrolled phones with lock state and remote commands." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Devices,
});

function Devices() {
  const { t, lang } = useI18n();
  const [onlyPending, setOnlyPending] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () =>
      (await supabase.from("devices").select("*, customers(id, name)").is("deleted_at", null).order("lock_state").order("created_at", { ascending: false })).data ?? [],
  });
  const pendingCount = data?.filter((d) => !setupProgress(d.setup_steps).complete).length ?? 0;
  const shown = onlyPending ? data?.filter((d) => !setupProgress(d.setup_steps).complete) : data;
  return (
    <>
      <PageHeader title={t("devices")} subtitle="Lock, unlock or generate an offline code for any phone." />
      <Link to="/enroll-guide" className="mb-4 inline-block text-sm text-primary hover:underline">{t("enrollGuide")} →</Link>
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setOnlyPending(false)} className={`rounded-full border px-3 py-1 text-sm ${!onlyPending ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
          {lang === "ur" ? "تمام" : "All"} ({data?.length ?? 0})
        </button>
        <button onClick={() => setOnlyPending(true)} className={`rounded-full border px-3 py-1 text-sm ${onlyPending ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
          {lang === "ur" ? "سیٹ اپ باقی" : "Needs setup"} ({pendingCount})
        </button>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : !shown?.length ? (
        <EmptyState>No phones enrolled yet.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((d) => (
            <div key={d.id} className="lb-card space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-bold">{[d.brand, d.model].filter(Boolean).join(" ")}</p>
                  {d.customers && (
                    <Link to="/customers/$customerId" params={{ customerId: d.customers.id }} className="text-sm text-primary hover:underline">
                      {d.customers.name}
                    </Link>
                  )}
                  <p className="text-xs text-muted-foreground">IMEI {d.imei1} · seen {fmtDateTime(d.last_seen_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={d.lock_state} />
                  <StatusBadge status={d.enrollment_status} />
                </div>
              </div>
              <SetupChecklist deviceId={d.id} steps={d.setup_steps} />
              <DeviceControls device={d} customerName={d.customers?.name} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
