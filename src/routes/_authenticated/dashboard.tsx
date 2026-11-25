import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Stat, StatusBadge } from "@/components/brand";
import { fmtDate, money, todayStr } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Lockbizz" },
      { name: "description", content: "Today's due installments, overdue customers, locked phones and collections." },
      { property: "og:title", content: "Dashboard — Lockbizz" },
      { property: "og:description", content: "Today's due installments, overdue customers, locked phones and collections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useI18n();
  const today = todayStr();
  const monthStart = today.slice(0, 8) + "01";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", today],
    queryFn: async () => {
      const unpaid = await supabase
        .from("installments")
        .select("id, seq_no, due_date, amount, paid_amount, status, contract_id, contracts(customer_id, customers(name, phone))")
        .neq("status", "paid")
        .lte("due_date", today)
        .order("due_date")
        .limit(500);
      const locked = await supabase.from("devices").select("id", { count: "exact", head: true }).eq("lock_state", "locked").is("deleted_at", null);
      const pending = await supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending");
      const paid = await supabase.from("payments").select("amount, approved_at").eq("status", "approved").gte("approved_at", monthStart);
      return { unpaid: unpaid.data ?? [], locked: locked.count ?? 0, pending: pending.count ?? 0, paid: paid.data ?? [] };
    },
  });

  const dueToday = data?.unpaid.filter((i) => i.due_date === today) ?? [];
  const overdue = data?.unpaid.filter((i) => i.due_date < today) ?? [];
  const sumLeft = (rows: typeof dueToday) => rows.reduce((s, i) => s + Number(i.amount) - Number(i.paid_amount), 0);
  const collectedMonth = data?.paid.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const collectedToday = data?.paid.filter((p) => p.approved_at?.slice(0, 10) === today).reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  return (
    <>
      <PageHeader
        title={t("dashboard")}
        subtitle={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        actions={
          <Button asChild>
            <Link to="/customers/new"><Plus /> {t("newSale")}</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label={t("dueToday")} value={isLoading ? "…" : dueToday.length} hint={money(sumLeft(dueToday))} />
        <Stat label={t("overdue")} value={isLoading ? "…" : overdue.length} tone={overdue.length ? "danger" : undefined} hint={money(sumLeft(overdue))} />
        <Stat label={t("lockedDevices")} value={isLoading ? "…" : data?.locked} />
        <Stat label={t("collectedToday")} value={money(collectedToday)} tone="ok" />
        <Stat label={t("collectedMonth")} value={money(collectedMonth)} tone="ok" />
        <Stat label={t("pendingApprovals")} value={isLoading ? "…" : data?.pending} />
      </div>

      <h2 className="mb-3 mt-8 font-display text-lg font-bold">Needs attention</h2>
      {!isLoading && !data?.unpaid.length ? (
        <EmptyState>Nothing is due or overdue. 🎉</EmptyState>
      ) : (
        <div className="lb-card divide-y overflow-hidden">
          {data?.unpaid.slice(0, 12).map((i) => {
            const c = i.contracts?.customers;
            const late = i.due_date < today;
            return (
              <Link
                key={i.id}
                to="/customers/$customerId"
                params={{ customerId: i.contracts?.customer_id ?? "" }}
                className="flex items-center justify-between gap-3 p-4 transition hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c?.phone} · installment #{i.seq_no} · due {fmtDate(i.due_date)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="font-display font-bold">{money(Number(i.amount) - Number(i.paid_amount))}</span>
                  <StatusBadge status={late ? "overdue" : "pending"} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
