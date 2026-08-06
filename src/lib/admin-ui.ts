import { supabase } from "@/integrations/supabase/client";

/** Format a number as Nigerian Naira. */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Short readable date. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Title-case an enum / snake value for display. */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Tailwind class map for badge tones. */
export const toneClass: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
};

export type Tone = keyof typeof toneClass;

/** Download an array of records as a CSV file (opens fine in Excel). */
export function exportCsv(
  filename: string,
  rows: Record<string, unknown>[],
): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Open a print-ready window with the supplied HTML body. */
export function printHtml(title: string, bodyHtml: string): void {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    *{box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif;}
    body{margin:0;padding:40px;color:#0b2545;}
    h1{color:#0b3d91;margin:0 0 4px;}
    .muted{color:#64748b;font-size:13px;}
    table{width:100%;border-collapse:collapse;margin-top:24px;}
    th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;}
    th{background:#f1f5f9;text-transform:uppercase;font-size:11px;letter-spacing:.5px;}
    .brandbar{border-top:4px solid #0b3d91;padding-top:20px;}
    .row{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;}
    .badge{display:inline-block;padding:3px 10px;border-radius:999px;background:#e0edff;color:#0b3d91;font-size:12px;font-weight:600;}
    @media print{body{padding:0;}}
  </style></head><body class="brandbar">${bodyHtml}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

/** Record an admin action to the activity log (best-effort, non-blocking). */
export async function logActivity(params: {
  action: string;
  entityType?: string;
  entityId?: string;
  description?: string;
}): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const name =
      (data.user?.user_metadata?.full_name as string | undefined) ||
      data.user?.email ||
      "Admin";
    await supabase.from("activity_log").insert({
      actor_id: data.user?.id ?? null,
      actor_name: name,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      description: params.description ?? null,
    });
  } catch {
    /* logging is best-effort */
  }
}

/** Create an admin notification (best-effort). */
export async function notify(params: {
  title: string;
  body?: string;
  type?: string;
  link?: string;
}): Promise<void> {
  try {
    await supabase.from("notifications").insert({
      title: params.title,
      body: params.body ?? null,
      type: params.type ?? "info",
      link: params.link ?? null,
    });
  } catch {
    /* best-effort */
  }
}
