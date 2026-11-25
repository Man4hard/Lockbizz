import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Stat } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv, installmentState, money, todayStr } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Lockbizz" },
      { name: "description", content: "Collections, outstanding balances and overdue lists with CSV export." },
      { property: "og:title", content: "Reports — Lockbizz" },
      { property: "og:description", content: "Collections, outstanding balances and overdue lists with CSV export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { t } = useI18n();
  const today = todayStr();
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const inst = await supabase
        .from("installments")
        .select("seq_no, due_date, amount, paid_amount, status, contracts(customers(name, phone, cnic))")
        .neq("status", "paid")
        .limit(2000);
      const pay = await supabase
        .from("payments")
        .select("amount, method, approved_at, created_at, contracts(customers(name))")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(2000);
      return { inst: inst.data ?? [], pay: pay.data ?? [] };
    },
  });
  const left = (i: { amount: number; paid_amount: number }) => Number(i.amount) - Number(i.paid_amount);
  const overdue = data?.inst.filter((i) => installmentState(i, today) === "overdue") ?? [];
  const outstanding = data?.inst.reduce((s, i) => s + left(i), 0) ?? 0;
  const byMethod: Record<string, number> = {};
  data?.pay.forEach((p) => (byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount)));

  return (
    <>
      <PageHeader title={t("reports")} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total outstanding" value={money(outstanding)} />
        <Stat label="Overdue amount" value={money(overdue.reduce((s, i) => s + left(i), 0))} tone="danger" />
        <Stat label="Overdue installments" value={overdue.length} />
        <Stat label="All-time collected" value={money(data?.pay.reduce((s, p) => s + Number(p.amount), 0))} tone="ok" />
      </div>

      <h2 className="mb-2 mt-8 font-display text-lg font-bold">Collections by method</h2>
      <div className="lb-card divide-y">
        {Object.entries(byMethod).map(([m, v]) => (
          <div key={m} className="flex justify-between px-4 py-3 text-sm"><span className="capitalize">{m}</span><b>{money(v)}</b></div>
        ))}
        {!Object.keys(byMethod).length && <p className="p-4 text-sm text-muted-foreground">No collections yet.</p>}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button variant="outline" disabled={!overdue.length} onClick={() =>
          downloadCsv("overdue.csv", overdue.map((i) => ({
            customer: i.contracts?.customers?.name, phone: i.contracts?.customers?.phone, cnic: i.contracts?.customers?.cnic,
            installment: i.seq_no, due_date: i.due_date, remaining: left(i),
          })))}>
          <Download /> Overdue list (CSV)
        </Button>
        <Button variant="outline" disabled={!data?.pay.length} onClick={() =>
          downloadCsv("collections.csv", (data?.pay ?? []).map((p) => ({
            date: p.approved_at ?? p.created_at, customer: p.contracts?.customers?.name, method: p.method, amount: p.amount,
          })))}>
          <Download /> Collections (CSV)
        </Button>
      </div>
    </>
  );
}
