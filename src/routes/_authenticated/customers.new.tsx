import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/brand";
import { enrollDevice, getEnrollPayload } from "@/lib/devices.functions";
import { money, todayStr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/customers/new")({
  head: () => ({
    meta: [
      { title: "New financed sale — Lockbizz" },
      { name: "description", content: "Register a customer, enroll their phone and create the installment plan." },
      { property: "og:title", content: "New financed sale — Lockbizz" },
      { property: "og:description", content: "Register a customer, enroll their phone and create the installment plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Wizard,
});

const STEPS = ["Customer", "Phone", "Plan", "Enroll"];

function Wizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<{ customerId: string; qr?: string | undefined; qrError?: string | undefined } | null>(null);
  const [c, setC] = useState({ name: "", cnic: "", phone: "", whatsapp: "", address: "", gname: "", gphone: "" });
  const [d, setD] = useState({ brand: "", model: "", imei1: "", imei2: "" });
  const [p, setP] = useState({ total: "", down: "0", markup: "0", count: "6", frequency: "monthly", start: todayStr(), grace: "2" });
  const sc = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) => setC({ ...c, [k]: e.target.value });
  const sd = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => setD({ ...d, [k]: e.target.value });
  const sp = (k: keyof typeof p) => (e: React.ChangeEvent<HTMLInputElement>) => setP({ ...p, [k]: e.target.value });

  const financed = Math.max(0, Number(p.total || 0) - Number(p.down || 0) + Number(p.markup || 0));
  const per = p.count ? Math.ceil(financed / Number(p.count)) : 0;

  const valid = [
    c.name && /^\d{5}-?\d{7}-?\d$/.test(c.cnic) && c.phone && consent && file,
    d.model && /^\d{14,16}$/.test(d.imei1),
    Number(p.total) > 0 && Number(p.count) > 0 && Number(p.down) <= Number(p.total),
  ][step];

  async function submit() {
    setBusy(true);
    try {
      const { data: tenantId } = await supabase.rpc("current_tenant_id");
      const customerId = crypto.randomUUID();
      const ext = file!.name.split(".").pop() ?? "jpg";
      const path = `${tenantId}/${customerId}/agreement.${ext}`;
      const up = await supabase.storage.from("agreements").upload(path, file!);
      if (up.error) throw up.error;

      const ins = await supabase.from("customers").insert({
        id: customerId, name: c.name, cnic: c.cnic, phone: c.phone, whatsapp: c.whatsapp || null,
        address: c.address || null, guarantor_name: c.gname || null, guarantor_phone: c.gphone || null,
        agreement_url: path, consent_at: new Date().toISOString(),
      });
      if (ins.error) throw ins.error;

      const { deviceId } = await enrollDevice({ data: { customerId, ...d } });
      const ct = await supabase.rpc("create_contract", {
        p_customer: customerId, p_device: deviceId, p_total: Number(p.total), p_down: Number(p.down),
        p_markup: Number(p.markup), p_count: Number(p.count), p_frequency: p.frequency,
        p_start: p.start, p_grace: Number(p.grace),
      });
      if (ct.error) throw ct.error;

      let qr: string | undefined, qrError: string | undefined;
      try { qr = (await getEnrollPayload({ data: { deviceId } })).json; }
      catch (e) { qrError = (e as Error).message; }
      setResult({ customerId, qr, qrError });
      setStep(3);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="New financed sale" subtitle="Customer consent, phone enrollment and installment plan" />
      <ol className="mb-6 flex gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-semibold ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <div className="lb-card max-w-2xl space-y-4 p-5 md:p-6">
        {step === 0 && (
          <>
            <Grid>
              <F label="Full name"><Input value={c.name} onChange={sc("name")} /></F>
              <F label="CNIC (13 digits)"><Input placeholder="35202-1234567-1" value={c.cnic} onChange={sc("cnic")} /></F>
              <F label="Phone"><Input type="tel" value={c.phone} onChange={sc("phone")} /></F>
              <F label="WhatsApp"><Input type="tel" value={c.whatsapp} onChange={sc("whatsapp")} /></F>
              <F label="Guarantor name"><Input value={c.gname} onChange={sc("gname")} /></F>
              <F label="Guarantor phone"><Input type="tel" value={c.gphone} onChange={sc("gphone")} /></F>
            </Grid>
            <F label="Address"><Input value={c.address} onChange={sc("address")} /></F>
            <F label="Signed agreement / CNIC photo (required)">
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </F>
            <label className="flex items-start gap-3 rounded-lg bg-muted p-3 text-sm">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              <span>
                The customer has read and signed the installment agreement and consents to device locking and location
                tracking while installments are unpaid.
              </span>
            </label>
          </>
        )}
        {step === 1 && (
          <Grid>
            <F label="Brand"><Input value={d.brand} onChange={sd("brand")} /></F>
            <F label="Model"><Input value={d.model} onChange={sd("model")} /></F>
            <F label="IMEI 1 (dial *#06#)"><Input inputMode="numeric" value={d.imei1} onChange={sd("imei1")} /></F>
            <F label="IMEI 2 (optional)"><Input inputMode="numeric" value={d.imei2} onChange={sd("imei2")} /></F>
          </Grid>
        )}
        {step === 2 && (
          <>
            <Grid>
              <F label="Phone price (Rs)"><Input type="number" value={p.total} onChange={sp("total")} /></F>
              <F label="Down payment (Rs)"><Input type="number" value={p.down} onChange={sp("down")} /></F>
              <F label="Markup / profit (Rs)"><Input type="number" value={p.markup} onChange={sp("markup")} /></F>
              <F label="Number of installments"><Input type="number" min={1} max={36} value={p.count} onChange={sp("count")} /></F>
              <F label="Frequency">
                <Select value={p.frequency} onValueChange={(v) => setP({ ...p, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="First due date"><Input type="date" value={p.start} onChange={sp("start")} /></F>
              <F label="Grace days before lock"><Input type="number" min={0} value={p.grace} onChange={sp("grace")} /></F>
            </Grid>
            <div className="rounded-lg bg-secondary p-4 text-sm">
              Financed <b>{money(financed)}</b> → <b>{money(per)}</b> × {p.count || 0} installments
            </div>
          </>
        )}
        {step === 3 && result && (
          <div className="space-y-4 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-success/15 text-success"><Check /></div>
            <p className="font-display text-lg font-bold">Sale saved</p>
            {result.qr ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Factory-reset the phone, tap the welcome screen 6 times and scan this QR. Keep it private.
                </p>
                <div className="mx-auto w-fit rounded-xl bg-white p-4">
                  <QRCodeSVG value={result.qr} size={280} level="L" marginSize={1} />
                </div>
              </>
            ) : (
              <p className="rounded-lg bg-warning/25 p-3 text-sm">
                {result.qrError} — add it in <Link to="/settings" className="font-semibold underline">Settings</Link>, then open the customer and press “Enrollment QR”.
              </p>
            )}
            <Button asChild><Link to="/customers/$customerId" params={{ customerId: result.customerId }}>Open customer</Link></Button>
          </div>
        )}

        {step < 3 && (
          <div className="flex justify-between pt-2">
            <Button variant="ghost" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}><ArrowLeft /> Back</Button>
            {step < 2 ? (
              <Button disabled={!valid} onClick={() => setStep(step + 1)}>Next <ArrowRight /></Button>
            ) : (
              <Button disabled={!valid || busy} onClick={submit}>{busy ? "Saving…" : "Save & generate QR"}</Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const Grid = ({ children }: { children: React.ReactNode }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5"><Label>{label}</Label>{children}</div>
);
