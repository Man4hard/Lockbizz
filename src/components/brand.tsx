import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Copy, Lock, MapPin, MessageSquare, Unlock, KeyRound, ShieldOff, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateUnlockCode, getEnrollPayload } from "@/lib/devices.functions";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  paid: "bg-success/15 text-success",
  approved: "bg-success/15 text-success",
  unlocked: "bg-success/15 text-success",
  active: "bg-success/15 text-success",
  completed: "bg-success/15 text-success",
  acked: "bg-success/15 text-success",
  overdue: "bg-destructive/15 text-destructive",
  locked: "bg-destructive/15 text-destructive",
  rejected: "bg-destructive/15 text-destructive",
  failed: "bg-destructive/15 text-destructive",
  partial: "bg-warning/25 text-warning-foreground",
  pending: "bg-muted text-muted-foreground",
  sent: "bg-warning/25 text-warning-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("border-0 font-semibold capitalize", TONES[status] ?? "bg-muted")}>
      {status}
    </Badge>
  );
}

export function Stat({ label, value, tone, hint }: { label: string; value: ReactNode; tone?: "danger" | "ok" | "warn" | undefined; hint?: string | undefined }) {
  return (
    <div className="lb-card p-4 md:p-5">
      <p className="lb-stat-label">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-bold md:text-3xl",
          tone === "danger" && "text-destructive",
          tone === "ok" && "text-success",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="lb-card p-8 text-center text-sm text-muted-foreground">{children}</div>;
}

export function EnrollQrDialog({ deviceId, open, onOpenChange }: { deviceId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const q = useMutation({ mutationFn: (id: string) => getEnrollPayload({ data: { deviceId: id } }) });
  const { mutate } = q;
  useEffect(() => {
    if (open && deviceId) mutate(deviceId);
  }, [open, deviceId, mutate]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enrollment QR</DialogTitle>
          <DialogDescription>
            Factory-reset the phone, tap the welcome screen 6 times, then scan this code. Keep it private — it contains this phone's secret.
          </DialogDescription>
        </DialogHeader>
        {q.isPending && <p className="py-10 text-center text-sm text-muted-foreground">Generating…</p>}
        {q.error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{(q.error as Error).message}</p>}
        {q.data && (
          <div className="flex justify-center rounded-xl bg-white p-4">
            <QRCodeSVG value={q.data.json} size={300} level="L" marginSize={1} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type Dev = { id: string; lock_state: string; enrollment_status: string };

/** Lock / unlock / locate / message / release + offline code generator for one device. */
export function DeviceControls({ device, customerName }: { device: Dev; customerName?: string | undefined }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<null | "lock" | "release">(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const send = useMutation({
    mutationFn: async (type: string) => {
      const { error } = await supabase.from("device_commands").insert({ device_id: device.id, type });
      if (error) throw error;
    },
    onSuccess: (_d, type) => {
      toast.success(`Command “${type}” queued — delivered at next heartbeat/push`);
      qc.invalidateQueries({ queryKey: ["commands", device.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="destructive" onClick={() => setConfirm("lock")}><Lock /> Lock</Button>
        <Button size="sm" variant="outline" onClick={() => send.mutate("unlock")}><Unlock /> Unlock</Button>
        <Button size="sm" variant="outline" onClick={() => send.mutate("locate")}><MapPin /> Locate</Button>
        <Button size="sm" variant="outline" onClick={() => send.mutate("show_message")}><MessageSquare /> Remind</Button>
        <Button size="sm" variant="secondary" onClick={() => setCodeOpen(true)}><KeyRound /> Offline code</Button>
        <Button size="sm" variant="secondary" onClick={() => setQrOpen(true)}><QrCode /> Enrollment QR</Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirm("release")}><ShieldOff /> Release</Button>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "lock" ? "Lock this phone now?" : "Release this phone permanently?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "lock"
                ? `${customerName ?? "The customer"} will see the lock screen. Calls and emergency dialer keep working.`
                : "All restrictions are removed and the phone becomes fully free. Do this only after the final installment is paid."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm && send.mutate(confirm)}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CodeDialog deviceId={device.id} open={codeOpen} onOpenChange={setCodeOpen} />
      <EnrollQrDialog deviceId={device.id} open={qrOpen} onOpenChange={setQrOpen} />
    </>
  );
}

function CodeDialog({ deviceId, open, onOpenChange }: { deviceId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [action, setAction] = useState<"unlock" | "extend" | "release">("unlock");
  const [hours, setHours] = useState("24");
  const gen = useMutation({
    mutationFn: () => generateUnlockCode({ data: { deviceId, action, hours: Number(hours) } }),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) gen.reset(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Offline unlock code</DialogTitle>
          <DialogDescription>
            Give this 8-digit code to the customer. Works without internet, one time only.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Code type</Label>
            <Select value={action} onValueChange={(v) => setAction(v as typeof action)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unlock">Unlock (until next due check)</SelectItem>
                <SelectItem value="extend">Extend 3 days</SelectItem>
                <SelectItem value="release">Release (fully paid)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Valid for</Label>
            <Select value={hours} onValueChange={setHours}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["1", "6", "24", "48"].map((h) => <SelectItem key={h} value={h}>{h} hour{h === "1" ? "" : "s"}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {gen.data ? (
            <div className="rounded-xl bg-sidebar p-4 text-center text-sidebar-foreground">
              <p className="font-mono text-4xl font-bold tracking-[0.25em] text-sidebar-primary">{gen.data.code}</p>
              <p className="mt-2 text-xs opacity-70">Expires {fmtDateTime(gen.data.expiresAt)}</p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => { navigator.clipboard.writeText(gen.data!.code); toast.success("Copied"); }}>
                <Copy /> Copy
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={() => gen.mutate()} disabled={gen.isPending}>
              {gen.isPending ? "Generating…" : "Generate code"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
