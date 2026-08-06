import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Trash2,
  Printer,
  Download,
  Check,
  X,
  Eye,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Button } from "@/components/admin/AdminShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  exportCsv,
  formatDate,
  formatDateTime,
  humanize,
  logActivity,
  printHtml,
  toneClass,
  type Tone,
} from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/quotes")({
  component: QuotesAdmin,
});

type QuoteStatus = Database["public"]["Enums"]["quote_status"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];

const STATUSES: QuoteStatus[] = [
  "pending",
  "reviewing",
  "awaiting_customer",
  "approved",
  "rejected",
  "completed",
  "cancelled",
];

const statusTone: Record<QuoteStatus, Tone> = {
  pending: "warning",
  reviewing: "info",
  awaiting_customer: "purple",
  approved: "success",
  rejected: "danger",
  completed: "success",
  cancelled: "neutral",
};

const emptyDraft = {
  customer_name: "",
  company: "",
  email: "",
  phone: "",
  product_name: "",
  category: "",
  quantity: "",
  dimensions: "",
  delivery_location: "",
  urgency: "normal" as Database["public"]["Enums"]["quote_urgency"],
  notes: "",
};

function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
        toneClass[statusTone[status]],
      )}
    >
      {humanize(status)}
    </span>
  );
}

function QuotesAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<Quote | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [confirm, setConfirm] = useState<null | {
    kind: "delete" | "reject" | "approve" | "bulk-delete";
    quote?: Quote;
  }>(null);

  const { data: staff } = useQuery({
    queryKey: ["admin-staff-list"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "staff"]);
      const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
      if (!ids.length) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,email")
        .in("id", ids);
      return data ?? [];
    },
  });

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["admin-quotes", sort],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: sort === "oldest" });
      if (error) throw error;
      return data as Quote[];
    },
  });

  const filtered = useMemo(() => {
    let rows = quotes ?? [];
    if (statusFilter !== "all")
      rows = rows.filter((q) => q.status === statusFilter);
    const s = search.trim().toLowerCase();
    if (s)
      rows = rows.filter((q) =>
        [q.quote_number, q.customer_name, q.company, q.email, q.product_name]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(s)),
      );
    return rows;
  }, [quotes, statusFilter, search]);

  const staffName = (id: string | null) => {
    if (!id) return "Unassigned";
    const p = staff?.find((s) => s.id === id);
    return p?.full_name || p?.email || "Staff";
  };

  async function updateQuote(id: string, patch: Partial<Quote>, msg: string) {
    const { error } = await supabase.from("quotes").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ["admin-quotes"] });
    if (viewing?.id === id) setViewing({ ...viewing, ...patch } as Quote);
  }

  async function setStatus(q: Quote, status: QuoteStatus) {
    await updateQuote(q.id, { status }, `Quote ${q.quote_number} → ${humanize(status)}`);
    await logActivity({
      action: `quote_${status}`,
      entityType: "quote",
      entityId: q.quote_number ?? q.id,
      description: `Quote ${q.quote_number} marked ${humanize(status)}`,
    });
  }

  async function createQuote() {
    if (!draft.customer_name.trim() || !draft.email.trim()) {
      return toast.error("Customer name and email are required.");
    }
    const { data, error } = await supabase
      .from("quotes")
      .insert({
        customer_name: draft.customer_name.trim(),
        company: draft.company.trim() || null,
        email: draft.email.trim(),
        phone: draft.phone.trim() || null,
        product_name: draft.product_name.trim() || null,
        category: draft.category.trim() || null,
        quantity: draft.quantity ? Number(draft.quantity) : null,
        dimensions: draft.dimensions.trim() || null,
        delivery_location: draft.delivery_location.trim() || null,
        urgency: draft.urgency,
        notes: draft.notes.trim() || null,
      })
      .select("quote_number")
      .single();
    if (error) return toast.error(error.message);
    toast.success(`Quote ${data.quote_number} created`);
    await logActivity({
      action: "quote_created",
      entityType: "quote",
      entityId: data.quote_number ?? undefined,
      description: `Quote ${data.quote_number} created manually`,
    });
    setCreating(false);
    setDraft(emptyDraft);
    qc.invalidateQueries({ queryKey: ["admin-quotes"] });
  }

  async function doConfirm() {
    if (!confirm) return;
    if (confirm.kind === "delete" && confirm.quote) {
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", confirm.quote.id);
      if (error) return toast.error(error.message);
      toast.success("Quote deleted");
      if (viewing?.id === confirm.quote.id) setViewing(null);
      qc.invalidateQueries({ queryKey: ["admin-quotes"] });
    } else if (confirm.kind === "bulk-delete") {
      const ids = [...selected];
      const { error } = await supabase.from("quotes").delete().in("id", ids);
      if (error) return toast.error(error.message);
      toast.success(`${ids.length} quote(s) deleted`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["admin-quotes"] });
    } else if (confirm.quote) {
      await setStatus(
        confirm.quote,
        confirm.kind === "approve" ? "approved" : "rejected",
      );
    }
    setConfirm(null);
  }

  async function bulkStatus(status: QuoteStatus) {
    const ids = [...selected];
    if (!ids.length) return;
    const { error } = await supabase
      .from("quotes")
      .update({ status })
      .in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} quote(s) → ${humanize(status)}`);
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin-quotes"] });
  }

  function exportRows(rows: Quote[]) {
    if (!rows.length) return toast.error("Nothing to export");
    exportCsv(
      "quotes",
      rows.map((q) => ({
        "Quote ID": q.quote_number,
        Customer: q.customer_name,
        Company: q.company ?? "",
        Email: q.email,
        Phone: q.phone ?? "",
        Product: q.product_name ?? "",
        Category: q.category ?? "",
        Quantity: q.quantity ?? "",
        Dimensions: q.dimensions ?? "",
        Delivery: q.delivery_location ?? "",
        Urgency: q.urgency,
        Status: q.status,
        Submitted: formatDate(q.created_at),
      })),
    );
    toast.success("Exported CSV");
  }

  function printQuote(q: Quote) {
    printHtml(
      `Quote ${q.quote_number}`,
      `
      <div class="row">
        <div><h1>IZEMS Global Resources</h1><p class="muted">Rose of Sharon Plaza, Ikotun, Lagos, Nigeria</p></div>
        <div style="text-align:right"><h2 style="margin:0;color:#0b3d91">QUOTATION</h2><p class="muted">${q.quote_number}<br/>${formatDate(q.created_at)}</p></div>
      </div>
      <div class="row" style="margin-top:24px">
        <div><strong>Bill To</strong><br/>${q.customer_name}<br/>${q.company ?? ""}<br/>${q.email}<br/>${q.phone ?? ""}</div>
        <div><strong>Status</strong><br/><span class="badge">${humanize(q.status)}</span><br/><br/><strong>Urgency:</strong> ${humanize(q.urgency)}</div>
      </div>
      <table>
        <thead><tr><th>Product</th><th>Category</th><th>Quantity</th><th>Dimensions</th><th>Delivery</th></tr></thead>
        <tbody><tr>
          <td>${q.product_name ?? "—"}</td><td>${q.category ?? "—"}</td>
          <td>${q.quantity ?? "—"}</td><td>${q.dimensions ?? "—"}</td>
          <td>${q.delivery_location ?? "—"}</td>
        </tr></tbody>
      </table>
      ${q.notes ? `<p style="margin-top:24px"><strong>Notes:</strong><br/>${q.notes}</p>` : ""}
      <p class="muted" style="margin-top:48px">Thank you for your business. This quotation is valid for 30 days from the date issued.</p>
      `,
    );
  }

  const allSelected = filtered.length > 0 && filtered.every((q) => selected.has(q.id));

  return (
    <div>
      <PageHeader
        title="Quote Management"
        description="Review, respond to and track every quotation request."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportRows(filtered)}>
              <Download className="mr-1.5 size-4" /> Export
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-1.5 size-4" /> New Quote
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID, name, company, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {humanize(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as "newest" | "oldest")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulkStatus("approved")}>
            <Check className="mr-1 size-3.5" /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkStatus("rejected")}>
            <X className="mr-1 size-3.5" /> Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              exportRows(filtered.filter((q) => selected.has(q.id)))
            }
          >
            <Download className="mr-1 size-3.5" /> Export
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setConfirm({ kind: "bulk-delete" })}
          >
            <Trash2 className="mr-1 size-3.5" /> Delete
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(c) =>
                    setSelected(
                      c ? new Set(filtered.map((q) => q.id)) : new Set(),
                    )
                  }
                />
              </th>
              <th className="p-3">Quote ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3 hidden md:table-cell">Product</th>
              <th className="p-3 hidden lg:table-cell">Submitted</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  <td colSpan={7} className="p-3">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 size-8 opacity-40" />
                  No quotes found.
                </td>
              </tr>
            )}
            {filtered.map((q) => (
              <tr
                key={q.id}
                className="border-t border-border transition-colors hover:bg-secondary/50"
              >
                <td className="p-3">
                  <Checkbox
                    checked={selected.has(q.id)}
                    onCheckedChange={(c) =>
                      setSelected((prev) => {
                        const n = new Set(prev);
                        if (c) n.add(q.id);
                        else n.delete(q.id);
                        return n;
                      })
                    }
                  />
                </td>
                <td className="p-3 font-mono text-xs font-semibold text-primary">
                  {q.quote_number}
                </td>
                <td className="p-3">
                  <div className="font-medium">{q.customer_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {q.company || q.email}
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell">
                  {q.product_name || "—"}
                </td>
                <td className="p-3 hidden lg:table-cell text-muted-foreground">
                  {formatDate(q.created_at)}
                </td>
                <td className="p-3">
                  <StatusBadge status={q.status} />
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setViewing(q)}
                      aria-label="View"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => printQuote(q)}
                      aria-label="Print"
                    >
                      <Printer className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setConfirm({ kind: "delete", quote: q })}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono text-base">{viewing.quote_number}</span>
                  <StatusBadge status={viewing.status} />
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Customer" value={viewing.customer_name} />
                <Field label="Company" value={viewing.company} />
                <Field label="Email" value={viewing.email} />
                <Field label="Phone" value={viewing.phone} />
                <Field label="Product" value={viewing.product_name} />
                <Field label="Category" value={viewing.category} />
                <Field label="Quantity" value={viewing.quantity?.toString()} />
                <Field label="Dimensions" value={viewing.dimensions} />
                <Field label="Delivery" value={viewing.delivery_location} />
                <Field label="Urgency" value={humanize(viewing.urgency)} />
                <Field label="Submitted" value={formatDateTime(viewing.created_at)} />
              </div>
              {viewing.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Customer notes
                  </p>
                  <p className="mt-1 rounded-lg bg-secondary p-3 text-sm">
                    {viewing.notes}
                  </p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={viewing.status}
                    onValueChange={(v) => setStatus(viewing, v as QuoteStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {humanize(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Assigned staff</Label>
                  <Select
                    value={viewing.assigned_staff ?? "none"}
                    onValueChange={(v) =>
                      updateQuote(
                        viewing.id,
                        { assigned_staff: v === "none" ? null : v },
                        "Assignment updated",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>{staffName(viewing.assigned_staff)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {staff?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name || s.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Internal notes</Label>
                <Textarea
                  defaultValue={viewing.internal_notes ?? ""}
                  placeholder="Private notes for your team…"
                  onBlur={(e) =>
                    e.target.value !== (viewing.internal_notes ?? "") &&
                    updateQuote(
                      viewing.id,
                      { internal_notes: e.target.value },
                      "Internal notes saved",
                    )
                  }
                />
              </div>

              <DialogFooter className="flex-wrap gap-2 sm:justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `mailto:${viewing.email}?subject=${encodeURIComponent(
                          `Your quotation ${viewing.quote_number}`,
                        )}`,
                        "_blank",
                      )
                    }
                  >
                    Respond
                  </Button>
                  <Button variant="outline" onClick={() => printQuote(viewing)}>
                    <Printer className="mr-1.5 size-4" /> Print
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={() => setStatus(viewing, "rejected")}
                  >
                    Reject
                  </Button>
                  <Button onClick={() => setStatus(viewing, "approved")}>
                    Approve
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Quote</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Customer name *" k="customer_name" draft={draft} setDraft={setDraft} />
            <TextField label="Company" k="company" draft={draft} setDraft={setDraft} />
            <TextField label="Email *" k="email" draft={draft} setDraft={setDraft} />
            <TextField label="Phone" k="phone" draft={draft} setDraft={setDraft} />
            <TextField label="Product" k="product_name" draft={draft} setDraft={setDraft} />
            <TextField label="Category" k="category" draft={draft} setDraft={setDraft} />
            <TextField label="Quantity" k="quantity" draft={draft} setDraft={setDraft} />
            <TextField label="Dimensions" k="dimensions" draft={draft} setDraft={setDraft} />
            <TextField label="Delivery location" k="delivery_location" draft={draft} setDraft={setDraft} />
            <div>
              <Label className="text-xs">Urgency</Label>
              <Select
                value={draft.urgency}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, urgency: v as typeof d.urgency }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["low", "normal", "high", "urgent"] as const).map((u) => (
                    <SelectItem key={u} value={u}>
                      {humanize(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={createQuote}>Create Quote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "bulk-delete"
                ? `This will permanently delete ${selected.size} quote(s).`
                : confirm?.kind === "delete"
                  ? `This will permanently delete quote ${confirm.quote?.quote_number}.`
                  : "Please confirm this action."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value || "—"}</p>
    </div>
  );
}

function TextField({
  label,
  k,
  draft,
  setDraft,
}: {
  label: string;
  k: keyof typeof emptyDraft;
  draft: typeof emptyDraft;
  setDraft: React.Dispatch<React.SetStateAction<typeof emptyDraft>>;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        value={draft[k] as string}
        onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
      />
    </div>
  );
}
