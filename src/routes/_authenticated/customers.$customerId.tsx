import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Banknote, ExternalLink, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeviceControls, EmptyState, StatusBadge } from "@/components/brand";
import { fmtDate, fmtDateTime, installmentState, money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/customers/$customerId")({
  head: () => ({
    meta: [
      { title: "Customer ledger — Lockbizz" },
      { name: "description", content: "Customer installment ledger, phone status, commands and activity." },
      { property: "og:title", content: "Customer ledger — Lockbizz" },
      { property: "og:description", content: "Customer installment ledger, phone status, commands and activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomerPage,
});

function CustomerPage() {
  const { customerId } = Route.useParams();
  const qc = useQueryClient();
  const [payOpen, setPayOpen] = useState(false);

  const { data: c, isLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () =>
      (await supabase
        .from("customers")
        .select("*, devices(*), contracts(*, installments(*), payments(*))")
        .eq("id", customerId)
        .single()).data,
  });
  const device = c?.devices?.[0];
  const contract = c?.contracts?.find((x) => x.status === "active") ?? c?.contracts?.[0];

  const { data: events } = useQuery({
    queryKey: ["events", device?.id],
    enabled: !!device,
    queryFn: async () =>
      (await supabase.from("device_events").select("*").eq("device_id", device!.id).order("created_at", { ascending: false }).limit(15)).data ?? [],
  });
  const { data: commands } = useQuery({
    queryKey: ["commands", device?.id],
    enabled: !!device,
    queryFn: async () =>
      (await supabase.from("device_commands").select("*").eq("device_id", device!.id).order("created_at", { ascending: false }).limit(8)).data ?? [],
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!c) return <EmptyState>Customer not found.</EmptyState>;

  const insts = [...(contract?.installments ?? [])].sort((a, b) => a.seq_no - b.seq_no);
  const paid = insts.reduce((s, i) => s + Number(i.paid_amount), 0);
  const total = insts.reduce((s, i) => s + Number(i.amount), 0);

  async function openAgreement() {
    if (!c?.agreement_url) return;
    const { data } = await supabase.storage.from("agreements").createSignedUrl(c.agreement_url, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <>
      <Link to="/customers" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Customers
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{c.name}</h1>
          <p className="text-sm text-muted-foreground">
            {c.phone} · CNIC {c.cnic}{c.address ? ` · ${c.address}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Guarantor: {c.guarantor_name ?? "—"} {c.guarantor_phone ?? ""} · Consent {fmtDateTime(c.consent_at)}
          </p>
        </div>
        <div className="flex gap-2">
          {c.agreement_url && <Button variant="outline" size="sm" onClick={openAgreement}><FileText /> Agreement</Button>}
          {contract?.status === "active" && <Button size="sm" onClick={() => setPayOpen(true)}><Banknote /> Record payment</Button>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-6">
          {contract ? (
            <div className="lb-card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
                <div>
                  <p className="lb-stat-label">Ledger</p>
                  <p className="font-display text-lg font-bold">{money(paid)} <span className="text-sm font-normal text-muted-foreground">of {money(total)} paid</span></p>
                </div>
                <StatusBadge status={contract.status} />
              </div>
              <div className="h-1.5 bg-muted"><div className="h-full bg-success" style={{ width: `${total ? (paid / total) * 100 : 0}%` }} /></div>
              <div className="divide-y">
                {insts.map((i) => {
                  const st = installmentState(i);
                  return (
                    <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">#{i.seq_no} · {fmtDate(i.due_date)}</p>
                        {i.paid_at && <p className="text-xs text-muted-foreground">Paid {fmtDate(i.paid_at)}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-right">
                          <span className="font-semibold">{money(i.amount)}</span>
                          {Number(i.paid_amount) > 0 && st !== "paid" && <span className="block text-xs text-muted-foreground">paid {money(i.paid_amount)}</span>}
                        </span>
                        <StatusBadge status={st} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState>No contract yet.</EmptyState>
          )}

          {contract?.payments?.length ? (
            <div className="lb-card divide-y overflow-hidden">
              <p className="lb-stat-label p-4">Payments</p>
              {[...contract.payments].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>{fmtDateTime(p.created_at)} · <span className="capitalize">{p.method}</span>{p.reference_no ? ` · ${p.reference_no}` : ""}</span>
                  <span className="flex items-center gap-3"><b>{money(p.amount)}</b><StatusBadge status={p.status} /></span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          {device ? (
            <div className="lb-card space-y-4 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="lb-stat-label">Phone</p>
                  <p className="font-display text-lg font-bold">{[device.brand, device.model].filter(Boolean).join(" ")}</p>
                  <p className="text-xs text-muted-foreground">IMEI {device.imei1}</p>
                </div>
                <StatusBadge status={device.lock_state} />
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <dt className="text-muted-foreground">Enrollment</dt><dd className="text-right capitalize">{device.enrollment_status}</dd>
                <dt className="text-muted-foreground">Last seen</dt><dd className="text-right">{fmtDateTime(device.last_seen_at)}</dd>
                <dt className="text-muted-foreground">Battery</dt><dd className="text-right">{device.battery != null ? `${device.battery}%` : "—"}</dd>
                <dt className="text-muted-foreground">Location</dt>
                <dd className="text-right">
                  {device.last_lat != null ? (
                    <a className="inline-flex items-center gap-1 text-primary underline" target="_blank" rel="noreferrer"
                      href={`https://www.openstreetmap.org/?mlat=${device.last_lat}&mlon=${device.last_lng}#map=16/${device.last_lat}/${device.last_lng}`}>
                      Map <ExternalLink className="size-3" />
                    </a>
                  ) : "—"}
                </dd>
              </dl>
              <DeviceControls device={device} customerName={c.name} />
            </div>
          ) : (
            <EmptyState>No phone enrolled.</EmptyState>
          )}

          {!!commands?.length && (
            <div className="lb-card divide-y overflow-hidden">
              <p className="lb-stat-label p-4">Commands</p>
              {commands.map((x) => (
                <div key={x.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span>{x.type} <span className="text-xs text-muted-foreground">· {fmtDateTime(x.created_at)}</span></span>
                  <StatusBadge status={x.status} />
                </div>
              ))}
            </div>
          )}

          <div className="lb-card overflow-hidden">
            <p className="lb-stat-label p-4">Device timeline</p>
            {events?.length ? (
              <ul className="divide-y">
                {events.map((e) => (
                  <li key={e.id} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="capitalize">{e.type.replace("_", " ")}</span>
                    <span className="text-xs text-muted-foreground">{fmtDateTime(e.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 pb-4 text-sm text-muted-foreground">No events yet. They appear once the phone reports in.</p>
            )}
          </div>
        </aside>
      </div>

      {contract && (
        <PaymentDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          contractId={contract.id}
          suggested={(() => {
            const n = insts.find((i) => i.status !== "paid");
            return n ? String(Number(n.amount) - Number(n.paid_amount)) : "";
          })()}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ["customer", customerId] });
            qc.invalidateQueries({ queryKey: ["commands"] });
          }}
        />
      )}
    </>
  );
}

function PaymentDialog({ open, onOpenChange, contractId, suggested, onDone }: {
  open: boolean; onOpenChange: (o: boolean) => void; contractId: string; suggested: string; onDone: () => void;
}) {
  const key = useRef(crypto.randomUUID());
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [ref, setRef] = useState("");
  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("record_payment", {
        p_contract: contractId, p_amount: Number(amount || suggested), p_method: method, p_ref: ref, p_key: key.current,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment recorded and applied to installments");
      key.current = crypto.randomUUID();
      setAmount(""); setRef(""); onOpenChange(false); onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Amount (Rs)</Label><Input type="number" placeholder={suggested} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["cash", "jazzcash", "easypaisa", "bank"].map((x) => <SelectItem key={x} value={x} className="capitalize">{x}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Transaction ID (optional)</Label><Input value={ref} onChange={(e) => setRef(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">Applied to the oldest unpaid installments. If nothing is overdue afterwards, an unlock command is queued automatically.</p>
          <Button className="w-full" disabled={m.isPending || !(Number(amount || suggested) > 0)} onClick={() => m.mutate()}>
            {m.isPending ? "Saving…" : "Save payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
