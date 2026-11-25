import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader, StatusBadge } from "@/components/brand";
import { fmtDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/customers/")({
  head: () => ({
    meta: [
      { title: "Customers — Lockbizz" },
      { name: "description", content: "All installment customers, their contracts and phones." },
      { property: "og:title", content: "Customers — Lockbizz" },
      { property: "og:description", content: "All installment customers, their contracts and phones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Customers,
});

function Customers() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () =>
      (await supabase
        .from("customers")
        .select("id, name, cnic, phone, created_at, contracts(id, status), devices(id, lock_state, model)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })).data ?? [],
  });
  const rows = (data ?? []).filter((c) => `${c.name} ${c.cnic} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader
        title={t("customers")}
        actions={<Button asChild><Link to="/customers/new"><Plus /> {t("addCustomer")}</Link></Button>}
      />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search name, CNIC, phone" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !rows.length ? (
        <EmptyState>
          No customers yet. <Link to="/customers/new" className="font-semibold text-primary underline">Add your first financed sale</Link>.
        </EmptyState>
      ) : (
        <div className="lb-card divide-y overflow-hidden">
          {rows.map((c) => {
            const dev = c.devices?.[0];
            const active = c.contracts?.find((x) => x.status === "active");
            return (
              <Link
                key={c.id}
                to="/customers/$customerId"
                params={{ customerId: c.id }}
                className="flex items-center justify-between gap-3 p-4 transition hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone} · CNIC {c.cnic} · since {fmtDate(c.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {dev && <span className="hidden text-xs text-muted-foreground sm:inline">{dev.model}</span>}
                  {dev && <StatusBadge status={dev.lock_state} />}
                  <StatusBadge status={active ? "active" : c.contracts?.length ? "completed" : "pending"} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
