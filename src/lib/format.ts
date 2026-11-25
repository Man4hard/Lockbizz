export const money = (n: number | string | null | undefined) =>
  "Rs " + Math.round(Number(n ?? 0)).toLocaleString("en-PK");

export const fmtDate = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (d: string | Date | null | undefined) =>
  d
    ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

export const todayStr = () => new Date().toISOString().slice(0, 10);

export type InstallmentLike = { due_date: string; status: string };

/** Overdue is derived from the due date, never stored. */
export function installmentState(i: InstallmentLike, today = todayStr()): "paid" | "partial" | "overdue" | "pending" {
  if (i.status === "paid") return "paid";
  if (i.due_date < today) return "overdue";
  return i.status === "partial" ? "partial" : "pending";
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0] ?? {});
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
