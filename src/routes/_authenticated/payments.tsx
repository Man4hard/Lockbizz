import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, StatusBadge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime, money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments — Lockbizz" },
      { name: "description", content: "Approve or reject customer payment submissions and review payment history." },
      { property: "og:title", content: "Payments — Lockbizz" },
      { property: "og:description", content: "Approve or reject customer payment submissions and review payment history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Payments,
});

function Payments() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () =>
      (await supabase
        .from("payments")
        .select("*, contracts(customer_id, customers(name))")
        .order("created_at", { ascending: false })
        .limit(200)).data ?? [],
  });
  const act = useMutation({
    mutationFn: async ({ id, ok }: { id: string; ok: boolean }) => {
      const { error } = await supabase.rpc(ok ? "approve_payment" : "reject_payment", { p_id: id });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.ok ? "Approved — installments updated" : "Rejected");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const pending = data?.filter((p) => p.status === "pending") ?? [];
  const history = data?.filter((p) => p.status !== "pending") ?? [];

  return (
    <>
      <PageHeader title={t("payments")} subtitle="Customer-submitted receipts wait here for your approval." />
      <h2 className="mb-2 font-display text-lg font-bold">Waiting for approval</h2>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : !pending.length ? (
        <EmptyState>No payments waiting.</EmptyState>
      ) : (
        <div className="lb-card divide-y overflow-hidden">
          {pending.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <Link to="/customers/$customerId" params={{ customerId: p.contracts?.customer_id ?? "" }} className="font-semibold hover:underline">
                  {p.contracts?.customers?.name}
                </Link>
                <p className="text-xs capitalize text-muted-foreground">
                  {p.method} · {p.reference_no || "no reference"} · {fmtDateTime(p.created_at)} · by {p.submitted_by}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <b className="mr-2 font-display text-lg">{money(p.amount)}</b>
                <Button size="sm" onClick={() => act.mutate({ id: p.id, ok: true })} disabled={act.isPending}><Check /> {t("approve")}</Button>
                <Button size="sm" variant="outline" onClick={() => act.mutate({ id: p.id, ok: false })} disabled={act.isPending}><X /> {t("reject")}</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-2 mt-8 font-display text-lg font-bold">History</h2>
      {!history.length ? <EmptyState>No payment history yet.</EmptyState> : (
        <div className="lb-card divide-y overflow-hidden">
          {history.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{p.contracts?.customers?.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{p.method} · {fmtDateTime(p.created_at)}</p>
              </div>
              <div className="flex items-center gap-3"><b>{money(p.amount)}</b><StatusBadge status={p.status} /></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
