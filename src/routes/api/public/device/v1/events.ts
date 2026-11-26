import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  events: z
    .array(z.object({ type: z.string().max(60) }).passthrough())
    .max(200),
});

export const Route = createFileRoute("/api/public/device/v1/events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyDeviceRequest } = await import("@/lib/device-auth.server");
        const v = await verifyDeviceRequest(request, "/device/v1/events");
        if (!v.ok) return v.response;
        let parsed;
        try {
          parsed = Body.safeParse(JSON.parse(v.device.raw));
        } catch {
          return Response.json({ error: "invalid json" }, { status: 400 });
        }
        if (!parsed.success) return Response.json({ error: "invalid body" }, { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { deviceId, tenantId } = v.device;
        const rows: { device_id: string; tenant_id: string; type: string; payload_json: Record<string, unknown> }[] = [];
        for (const ev of parsed.data.events) {
          const { type, ...rest } = ev as { type: string } & Record<string, unknown>;
          if (type === "command_ack") {
            const id = String(rest["command_id"] ?? "");
            const st = String(rest["status"] ?? "");
            if (/^[0-9a-f-]{36}$/i.test(id) && ["acked", "failed", "expired"].includes(st)) {
              await supabaseAdmin
                .from("device_commands")
                .update({ status: st, acked_at: new Date().toISOString() })
                .eq("id", id)
                .eq("device_id", deviceId);
            }
          }
          rows.push({ device_id: deviceId, tenant_id: tenantId, type, payload_json: rest });
        }
        if (rows.length) {
          const { error } = await supabaseAdmin.from("device_events").insert(rows as never);
          if (error) return Response.json({ error: "could not store events" }, { status: 500 });
        }
        return Response.json({ ok: true, stored: rows.length });
      },
    },
  },
});
