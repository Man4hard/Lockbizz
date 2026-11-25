import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/brand";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, installmentState, money, todayStr } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/installments")({
  head: () => ({
    meta: [
      { title: "Installments — Lockbizz" },
      { name: "description", content: "Every installment: due today, overdue, upcoming and paid." },
      { property: "og:title", content: "Installments — Lockbizz" },
      { property: "og:description", content: "Every installment: due today, overdue, upcoming and paid." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Installments,
});

function Installments() {
  const { t } = useI18n();
  const [tab, setTab] = useState("overdue");
  const today = todayStr();
  const { data, isLoading } = useQuery({
    queryKey: ["installments-all"],
    queryFn: async () =>
      (await supabase
        .from("installments")
        .select("id, seq_no, due_date, amount, paid_amount, status, contracts(customer_id, customers(name, phone))")
        .order("due_date")
        .limit(1000)).data ?? [],
  });
  const rows = (data ?? []).filter((i) => {
    const s = installmentState(i, today);
    if (tab === "today") return i.due_date === today && s !== "paid";
    if (tab === "upcoming") return i.due_date > today && s !== "paid";
    return s === tab;
  });

  return (
    <>
      <PageHeader title={t("installments")} />
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="today">Due today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>
      </Tabs>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : !rows.length ? (
        <EmptyState>Nothing here.</EmptyState>
      ) : (
        <div className="lb-card divide-y overflow-hidden">
          {rows.slice(0, 200).map((i) => (
            <Link key={i.id} to="/customers/$customerId" params={{ customerId: i.contracts?.customer_id ?? "" }}
              className="flex items-center justify-between gap-3 p-4 text-sm hover:bg-muted/60">
              <div className="min-w-0">
                <p className="truncate font-semibold">{i.contracts?.customers?.name}</p>
                <p className="text-xs text-muted-foreground">#{i.seq_no} · due {fmtDate(i.due_date)} · {i.contracts?.customers?.phone}</p>
              </div>
              <div className="flex items-center gap-3">
                <b>{money(Number(i.amount) - Number(i.paid_amount) || Number(i.amount))}</b>
                <StatusBadge status={installmentState(i, today)} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
