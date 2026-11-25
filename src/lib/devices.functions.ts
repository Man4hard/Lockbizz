import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { bytesToHex, generateOfflineCode, sha256Hex, MAX_CODE_HOURS } from "./offline-code";

const rand = (n: number) => bytesToHex(crypto.getRandomValues(new Uint8Array(n)));

export const enrollDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      customerId: z.string().uuid(),
      brand: z.string().trim().max(60).optional(),
      model: z.string().trim().min(1).max(80),
      imei1: z.string().trim().regex(/^\d{14,16}$/, "IMEI must be 14-16 digits"),
      imei2: z.string().trim().regex(/^\d{14,16}$/).optional().or(z.literal("")),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: tenant } = await supabase.from("tenants").select("device_quota, license_expiry, status").single();
    if (!tenant || tenant.status !== "active") throw new Error("Shop account is not active");
    if (tenant.license_expiry && tenant.license_expiry < new Date().toISOString().slice(0, 10))
      throw new Error("License expired. Renew to enroll more devices.");
    const { count } = await supabase
      .from("devices")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null);
    if ((count ?? 0) >= tenant.device_quota) throw new Error(`Device quota reached (${tenant.device_quota})`);

    const { data: dev, error } = await supabase
      .from("devices")
      .insert({
        customer_id: data.customerId,
        brand: data.brand || null,
        model: data.model,
        imei1: data.imei1,
        imei2: data.imei2 || null,
      })
      .select("id")
      .single();
    if (error || !dev) throw new Error(error?.message ?? "Could not create device");

    // Secrets are reachable only by the server (no RLS policies on device_secrets).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: e2 } = await supabaseAdmin
      .from("device_secrets")
      .insert({ device_id: dev.id, secret_hex: rand(32), enroll_token: rand(24) });
    if (e2) throw new Error(e2.message);
    return { deviceId: dev.id };
  });

/** Builds the Android Device Owner provisioning QR payload for one device. */
export const getEnrollPayload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ deviceId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: dev } = await supabase.from("devices").select("id, customer_id").eq("id", data.deviceId).single();
    if (!dev) throw new Error("Device not found");
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, phone, support_phone, apk_url, apk_checksum")
      .single();
    if (!tenant?.apk_url || !tenant.apk_checksum)
      throw new Error("Set the app download link and signature checksum in Settings first.");
    const { data: ct } = await supabase
      .from("contracts")
      .select("grace_days, installments(due_date, amount, paid_amount, status, seq_no)")
      .eq("device_id", dev.id)
      .maybeSingle();
    const next = ct?.installments
      ?.filter((i) => i.status !== "paid")
      .sort((a, b) => a.seq_no - b.seq_no)[0];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sec } = await supabaseAdmin
      .from("device_secrets")
      .select("secret_hex, enroll_token")
      .eq("device_id", dev.id)
      .single();
    if (!sec) throw new Error("Device secret missing");

    const payload = {
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "pk.lockbizz.app/.LockbizzAdminReceiver",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": tenant.apk_url,
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": tenant.apk_checksum,
      "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": false,
      "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
      "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
        device_id: dev.id,
        enroll_token: sec.enroll_token,
        device_secret: sec.secret_hex,
        shop_name: tenant.name,
        support_phone: tenant.support_phone ?? tenant.phone ?? "",
        due_date_millis: next ? new Date(next.due_date + "T00:00:00+05:00").getTime() : 0,
        due_amount: next ? String(Math.round(Number(next.amount) - Number(next.paid_amount))) : "0",
        grace_days: ct?.grace_days ?? 2,
      },
    };
    return { json: JSON.stringify(payload) };
  });

export const generateUnlockCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      deviceId: z.string().uuid(),
      action: z.enum(["unlock", "release", "extend"]),
      hours: z.number().int().min(1).max(MAX_CODE_HOURS),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: dev } = await supabase.from("devices").select("id, tenant_id").eq("id", data.deviceId).single();
    if (!dev) throw new Error("Device not found");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sec } = await supabaseAdmin.from("device_secrets").select("secret_hex").eq("device_id", dev.id).single();
    if (!sec) throw new Error("Device secret missing");

    const { data: last } = await supabase
      .from("unlock_codes")
      .select("counter")
      .eq("device_id", dev.id)
      .order("counter", { ascending: false })
      .limit(1);
    const counter = last?.length ? Number(last[0]?.counter ?? -1) + 1 : 0;
    const expiryHour = Math.floor(Date.now() / 3_600_000) + data.hours;
    const code = await generateOfflineCode(sec.secret_hex, dev.id, counter, expiryHour, data.action);

    const { error } = await supabase.from("unlock_codes").insert({
      device_id: dev.id,
      counter,
      action: data.action,
      code_hash: await sha256Hex(code),
      expires_at: new Date(expiryHour * 3_600_000).toISOString(),
      generated_by: userId,
    });
    if (error) throw new Error(error.message);
    return { code, expiresAt: new Date(expiryHour * 3_600_000).toISOString() };
  });
