import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Lockbizz" },
      { name: "description", content: "Shop details, support number and Android app download for enrollment QR codes." },
      { property: "og:title", content: "Settings — Lockbizz" },
      { property: "og:description", content: "Shop details, support number and Android app download for enrollment QR codes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: tenant } = useQuery({
    queryKey: ["tenant-full"],
    queryFn: async () => (await supabase.from("tenants").select("*").single()).data,
  });
  const [f, setF] = useState({ name: "", phone: "", support_phone: "", apk_url: "", apk_checksum: "" });
  useEffect(() => {
    if (tenant) setF({
      name: tenant.name ?? "", phone: tenant.phone ?? "", support_phone: tenant.support_phone ?? "",
      apk_url: tenant.apk_url ?? "", apk_checksum: tenant.apk_checksum ?? "",
    });
  }, [tenant]);
  const s = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tenants").update({
        name: f.name, phone: f.phone || null, support_phone: f.support_phone || null,
        apk_url: f.apk_url || null, apk_checksum: f.apk_checksum || null,
      }).eq("id", tenant!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["tenant"] }); qc.invalidateQueries({ queryKey: ["tenant-full"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title={t("settings")} />
      <div className="grid max-w-2xl gap-6">
        <div className="lb-card space-y-4 p-5">
          <h2 className="font-display text-lg font-bold">Shop</h2>
          <div className="space-y-1.5"><Label>Shop name (shown on the lock screen)</Label><Input value={f.name} onChange={s("name")} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Shop phone</Label><Input value={f.phone} onChange={s("phone")} /></div>
            <div className="space-y-1.5"><Label>Support number (lock screen)</Label><Input value={f.support_phone} onChange={s("support_phone")} /></div>
          </div>
        </div>

        <div className="lb-card space-y-4 p-5">
          <h2 className="font-display text-lg font-bold">Android app for enrollment</h2>
          <p className="text-sm text-muted-foreground">
            Build the Lockbizz app in Android Studio, host the signed APK on any HTTPS link, and paste the link and the
            signing-certificate checksum here. They go into every enrollment QR.
          </p>
          <div className="space-y-1.5"><Label>APK download link (https)</Label><Input value={f.apk_url} onChange={s("apk_url")} placeholder="https://…/lockbizz.apk" /></div>
          <div className="space-y-1.5"><Label>Signature checksum (base64url SHA-256)</Label><Input value={f.apk_checksum} onChange={s("apk_checksum")} /></div>
        </div>

        <Button className="w-fit" onClick={() => save.mutate()} disabled={save.isPending || !tenant}>Save settings</Button>

        {tenant && (
          <div className="lb-card p-5 text-sm">
            <h2 className="mb-2 font-display text-lg font-bold">License</h2>
            <p>Plan <b className="capitalize">{tenant.plan}</b> · up to <b>{tenant.device_quota}</b> phones · valid until <b>{fmtDate(tenant.license_expiry)}</b></p>
          </div>
        )}
      </div>
    </>
  );
}
