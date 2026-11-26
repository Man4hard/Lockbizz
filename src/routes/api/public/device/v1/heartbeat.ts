import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z
  .object({
    battery: z.number().int().min(0).max(100).optional(),
    app_version: z.string().max(40).optional(),
    sim_serial: z.string().max(60).optional(),
    lock_state: z.enum(["locked", "unlocked"]).optional(),
    device_owner: z.boolean().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    tamper: z.unknown().optional(),
  })
  .passthrough();

export const Route = createFileRoute("/api/public/device/v1/heartbeat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyDeviceRequest } = await import("@/lib/device-auth.server");
        const v = await verifyDeviceRequest(request, "/device/v1/heartbeat");
        if (!v.ok) return v.response;
        let parsed;
        try {
          parsed = Body.safeParse(JSON.parse(v.device.raw));
        } catch {
          return Response.json({ error: "invalid json" }, { status: 400 });
        }
        if (!parsed.success) return Response.json({ error: "invalid body" }, { status: 400 });
        const b = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { deviceId, tenantId } = v.device;
        const now = new Date().toISOString();

        const { data: cur } = await supabaseAdmin
          .from("devices")
          .select("enrollment_status")
          .eq("id", deviceId)
          .single();
        const update: Record<string, unknown> = { last_seen_at: now };
        if (b.battery !== undefined) update["battery"] = b.battery;
        if (b.app_version) update["app_version"] = b.app_version;
        if (b.sim_serial) update["sim_serial"] = b.sim_serial;
        if (b.lock_state) update["lock_state"] = b.lock_state;
        if (b.lat !== undefined && b.lng !== undefined) {
          update["last_lat"] = b.lat;
          update["last_lng"] = b.lng;
        }
        if (b.device_owner && cur?.enrollment_status === "pending") update["enrollment_status"] = "enrolled";
        await supabaseAdmin.from("devices").update(update as never).eq("id", deviceId);

        // Contract state: next unpaid installment.
        const [{ data: tenant }, { data: ct }] = await Promise.all([
          supabaseAdmin.from("tenants").select("name, phone, support_phone").eq("id", tenantId).single(),
          supabaseAdmin
            .from("contracts")
            .select("grace_days, installments(due_date, amount, paid_amount, status, seq_no)")
            .eq("device_id", deviceId)
            .eq("status", "active")
            .maybeSingle(),
        ]);
        const next = ct?.installments
          ?.filter((i) => i.status !== "paid")
          .sort((a, c) => a.seq_no - c.seq_no)[0];

        // Pending commands (not expired).
        const { data: cmds } = await supabaseAdmin
          .from("device_commands")
          .select("id, type, payload_json, expires_at")
          .eq("device_id", deviceId)
          .in("status", ["pending", "sent"])
          .gt("expires_at", now)
          .order("created_at", { ascending: true })
          .limit(20);
        if (cmds?.length) {
          await supabaseAdmin
            .from("device_commands")
            .update({ status: "sent", sent_at: now })
            .in("id", cmds.map((c) => c.id))
            .eq("status", "pending");
        }

        return Response.json({
          server_time: Date.now(),
          contract: {
            ...(next
              ? {
                  due_date: new Date(next.due_date + "T00:00:00+05:00").getTime(),
                  due_amount: String(Math.round(Number(next.amount) - Number(next.paid_amount))),
                }
              : {}),
            grace_days: ct?.grace_days ?? 2,
            shop_name: tenant?.name ?? "",
            support_phone: tenant?.support_phone ?? tenant?.phone ?? "",
          },
          commands: (cmds ?? []).map((c) => ({
            id: c.id,
            type: c.type,
            payload: c.payload_json ?? {},
            expires_at: new Date(c.expires_at).getTime(),
          })),
        });
      },
    },
  },
});
