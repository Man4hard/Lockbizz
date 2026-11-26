<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Lockbizz architecture
- Multi-tenant: every business table has tenant_id defaulting to current_tenant_id(); RLS scopes all reads/writes to it. Why: one database serves many shops.
- Money logic (contract schedule, payment apply, unlock/release queuing) lives in SQL functions (create_contract, record_payment, approve_payment). Why: transactional and not bypassable from the browser.
- Device secrets live in device_secrets (no RLS policies) and are read only in server functions via the admin client. Why: secrets must never reach the browser except inside the enrollment QR.
- src/lib/offline-code.ts must stay byte-identical to OfflineCode.kt in the Android app; src/test/offline-code.test.ts pins reference vectors. Why: codes are verified offline on the phone.
- Installment "overdue" is derived from due_date at read time, never stored. Why: no scheduled job needed.

- Phone check-ins (`/api/public/device/v1/*`) verify the HMAC signature + enroll token in `src/lib/device-auth.server.ts` before any write. Why: these routes bypass site auth, so the handler is the only guard.
