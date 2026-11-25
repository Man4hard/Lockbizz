import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, PageHeader, DeviceControls, StatusBadge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () =>
      (await supabase.from("devices").select("*, customers(id, name)").is("deleted_at", null).order("lock_state").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <>
      <PageHeader title={t("devices")} subtitle="Lock, unlock or generate an offline code for any phone." />
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : !data?.length ? (
        <EmptyState>No phones enrolled yet.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((d) => (
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
              <DeviceControls device={d} customerName={d.customers?.name} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
