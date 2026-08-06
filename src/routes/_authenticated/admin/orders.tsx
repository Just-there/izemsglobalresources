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
  Pencil,
  ClipboardList,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Button } from "@/components/admin/AdminShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  formatCurrency,
  formatDate,
  humanize,
  logActivity,
  printHtml,
  toneClass,
  type Tone,
} from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersAdmin,
});

type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type FulfillmentStatus = Database["public"]["Enums"]["fulfillment_status"];
type Order = Database["public"]["Tables"]["orders"]["Row"];

const PAYMENT: PaymentStatus[] = ["pending", "paid", "refunded"];
const FULFILLMENT: FulfillmentStatus[] = [
  "processing",
  "packed",
  "ready_for_dispatch",
  "shipped",
  "delivered",
  "cancelled",
];

const payTone: Record<PaymentStatus, Tone> = {
  pending: "warning",
  paid: "success",
  refunded: "danger",
};
const fulTone: Record<FulfillmentStatus, Tone> = {
  processing: "info",
  packed: "info",
  ready_for_dispatch: "purple",
  shipped: "purple",
  delivered: "success",
  cancelled: "danger",
};

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", toneClass[tone])}>
      {children}
    </span>
  );
}

const emptyOrder = {
  customer_name: "",
  company: "",
  customer_email: "",
  customer_phone: "",
  total: "",
  payment_status: "pending" as PaymentStatus,
  fulfillment_status: "processing" as FulfillmentStatus,
  notes: "",
};

function OrdersAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState("all");
  const [fulFilter, setFulFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Order | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyOrder);
  const [confirm, setConfirm] = useState<null | { order?: Order; bulk?: boolean }>(null);

  const { data: staff } = useQuery({
    queryKey: ["admin-staff-list"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "staff"]);
      const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
      if (!ids.length) return [];
      const { data } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
      return data ?? [];
    },
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const filtered = useMemo(() => {
    let rows = orders ?? [];
    if (payFilter !== "all") rows = rows.filter((o) => o.payment_status === payFilter);
    if (fulFilter !== "all") rows = rows.filter((o) => o.fulfillment_status === fulFilter);
    const s = search.trim().toLowerCase();
    if (s)
      rows = rows.filter((o) =>
        [o.order_number, o.customer_name, o.company, o.customer_email]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(s)),
      );
    return rows;
  }, [orders, payFilter, fulFilter, search]);

  const staffName = (id: string | null) => {
    if (!id) return "Unassigned";
    const p = staff?.find((s) => s.id === id);
    return p?.full_name || p?.email || "Staff";
  };

  async function patchOrder(id: string, patch: Partial<Order>, msg: string) {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    if (editing?.id === id) setEditing({ ...editing, ...patch } as Order);
    if (patch.fulfillment_status === "delivered")
      logActivity({ action: "order_completed", entityType: "order", entityId: id, description: "Order delivered" });
  }

  async function createOrder() {
    if (!draft.customer_name.trim() || !draft.customer_email.trim())
      return toast.error("Customer name and email are required.");
    const total = draft.total ? Number(draft.total) : 0;
    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: draft.customer_name.trim(),
        company: draft.company.trim() || null,
        customer_email: draft.customer_email.trim(),
        customer_phone: draft.customer_phone.trim() || null,
        total,
        subtotal: total,
        payment_status: draft.payment_status,
        fulfillment_status: draft.fulfillment_status,
        notes: draft.notes.trim() || null,
      })
      .select("order_number")
      .single();
    if (error) return toast.error(error.message);
    toast.success(`Order ${data.order_number} created`);
    logActivity({ action: "order_created", entityType: "order", entityId: data.order_number ?? undefined, description: `Order ${data.order_number} created` });
    setCreating(false);
    setDraft(emptyOrder);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  async function doDelete() {
    if (!confirm) return;
    if (confirm.bulk) {
      const ids = [...selected];
      const { error } = await supabase.from("orders").delete().in("id", ids);
      if (error) return toast.error(error.message);
      toast.success(`${ids.length} order(s) deleted`);
      setSelected(new Set());
    } else if (confirm.order) {
      const { error } = await supabase.from("orders").delete().eq("id", confirm.order.id);
      if (error) return toast.error(error.message);
      toast.success("Order deleted");
    }
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    setConfirm(null);
  }

  function exportRows(rows: Order[]) {
    if (!rows.length) return toast.error("Nothing to export");
    exportCsv(
      "orders",
      rows.map((o) => ({
        "Order ID": o.order_number,
        Customer: o.customer_name,
        Company: o.company ?? "",
        Email: o.customer_email,
        Amount: o.total,
        Payment: o.payment_status,
        Fulfillment: o.fulfillment_status,
        Date: formatDate(o.created_at),
      })),
    );
    toast.success("Exported CSV");
  }

  function printOrder(o: Order) {
    printHtml(
      `Order ${o.order_number}`,
      `<div class="row"><div><h1>IZEMS Global Resources</h1><p class="muted">Rose of Sharon Plaza, Ikotun, Lagos, Nigeria</p></div>
       <div style="text-align:right"><h2 style="margin:0;color:#0b3d91">ORDER</h2><p class="muted">${o.order_number}<br/>${formatDate(o.created_at)}</p></div></div>
       <div class="row" style="margin-top:24px"><div><strong>Customer</strong><br/>${o.customer_name}<br/>${o.company ?? ""}<br/>${o.customer_email}<br/>${o.customer_phone ?? ""}</div>
       <div><strong>Payment:</strong> <span class="badge">${humanize(o.payment_status)}</span><br/><br/><strong>Fulfillment:</strong> <span class="badge">${humanize(o.fulfillment_status)}</span></div></div>
       <table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody><tr><td>Order total</td><td>${formatCurrency(o.total)}</td></tr></tbody></table>`,
    );
  }

  const allSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  return (
    <div>
      <PageHeader
        title="Orders Management"
        description="Track payments, fulfillment and delivery across every order."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportRows(filtered)}>
              <Download className="mr-1.5 size-4" /> Export
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-1.5 size-4" /> New Order
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search orders…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={payFilter} onValueChange={setPayFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            {PAYMENT.map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fulFilter} onValueChange={setFulFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Fulfillment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All fulfillment</SelectItem>
            {FULFILLMENT.map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => exportRows(filtered.filter((o) => selected.has(o.id)))}>
            <Download className="mr-1 size-3.5" /> Export
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setConfirm({ bulk: true })}>
            <Trash2 className="mr-1 size-3.5" /> Delete
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3"><Checkbox checked={allSelected} onCheckedChange={(c) => setSelected(c ? new Set(filtered.map((o) => o.id)) : new Set())} /></th>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3 hidden lg:table-cell">Amount</th>
              <th className="p-3">Payment</th>
              <th className="p-3 hidden md:table-cell">Fulfillment</th>
              <th className="p-3 hidden xl:table-cell">Staff</th>
              <th className="p-3 hidden lg:table-cell">Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-border"><td colSpan={9} className="p-3"><Skeleton className="h-6 w-full" /></td></tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={9} className="p-10 text-center text-muted-foreground"><ClipboardList className="mx-auto mb-2 size-8 opacity-40" />No orders found.</td></tr>
            )}
            {filtered.map((o) => (
              <tr key={o.id} className="border-t border-border transition-colors hover:bg-secondary/50">
                <td className="p-3"><Checkbox checked={selected.has(o.id)} onCheckedChange={(c) => setSelected((prev) => { const n = new Set(prev); if (c) n.add(o.id); else n.delete(o.id); return n; })} /></td>
                <td className="p-3 font-mono text-xs font-semibold text-primary">{o.order_number}</td>
                <td className="p-3"><div className="font-medium">{o.customer_name}</div><div className="text-xs text-muted-foreground">{o.company || o.customer_email}</div></td>
                <td className="p-3 hidden lg:table-cell font-medium">{formatCurrency(o.total)}</td>
                <td className="p-3"><Badge tone={payTone[o.payment_status]}>{humanize(o.payment_status)}</Badge></td>
                <td className="p-3 hidden md:table-cell"><Badge tone={fulTone[o.fulfillment_status]}>{humanize(o.fulfillment_status)}</Badge></td>
                <td className="p-3 hidden xl:table-cell text-muted-foreground">{staffName(o.assigned_staff)}</td>
                <td className="p-3 hidden lg:table-cell text-muted-foreground">{formatDate(o.created_at)}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(o)} aria-label="Edit"><Pencil className="size-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => printOrder(o)} aria-label="Print"><Printer className="size-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setConfirm({ order: o })} aria-label="Delete"><Trash2 className="size-4 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          {editing && (
            <>
              <DialogHeader><DialogTitle className="font-mono">{editing.order_number}</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Customer" value={editing.customer_name} />
                <Field label="Company" value={editing.company} />
                <Field label="Email" value={editing.customer_email} />
                <Field label="Amount" value={formatCurrency(editing.total)} />
                <div>
                  <Label className="text-xs">Payment status</Label>
                  <Select value={editing.payment_status} onValueChange={(v) => patchOrder(editing.id, { payment_status: v as PaymentStatus }, "Payment updated")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT.map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Fulfillment status</Label>
                  <Select value={editing.fulfillment_status} onValueChange={(v) => patchOrder(editing.id, { fulfillment_status: v as FulfillmentStatus }, "Fulfillment updated")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FULFILLMENT.map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Assigned staff</Label>
                  <Select value={editing.assigned_staff ?? "none"} onValueChange={(v) => patchOrder(editing.id, { assigned_staff: v === "none" ? null : v }, "Assignment updated")}>
                    <SelectTrigger><SelectValue>{staffName(editing.assigned_staff)}</SelectValue></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {staff?.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name || s.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => printOrder(editing)}><Printer className="mr-1.5 size-4" /> Print</Button>
                <Button onClick={() => setEditing(null)}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Order</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <OField label="Customer name *" k="customer_name" draft={draft} setDraft={setDraft} />
            <OField label="Company" k="company" draft={draft} setDraft={setDraft} />
            <OField label="Email *" k="customer_email" draft={draft} setDraft={setDraft} />
            <OField label="Phone" k="customer_phone" draft={draft} setDraft={setDraft} />
            <OField label="Total (NGN)" k="total" draft={draft} setDraft={setDraft} />
            <div>
              <Label className="text-xs">Payment</Label>
              <Select value={draft.payment_status} onValueChange={(v) => setDraft((d) => ({ ...d, payment_status: v as PaymentStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT.map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={createOrder}>Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order(s)?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Delete</AlertDialogAction>
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

function OField({ label, k, draft, setDraft }: { label: string; k: keyof typeof emptyOrder; draft: typeof emptyOrder; setDraft: React.Dispatch<React.SetStateAction<typeof emptyOrder>> }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={draft[k] as string} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} />
    </div>
  );
}
