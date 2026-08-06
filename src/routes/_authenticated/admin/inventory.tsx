import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Search,
  Download,
  Plus,
  Minus,
  Pencil,
  Boxes,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Button } from "@/components/admin/AdminShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  logActivity,
  toneClass,
  type Tone,
} from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  component: InventoryAdmin,
});

type Row = {
  id: string;
  name: string;
  sku: string | null;
  category_id: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  min_stock: number;
  max_stock: number | null;
  warehouse: string | null;
  supplier: string | null;
  cost_price: number | null;
  selling_price: number | null;
  updated_at: string;
};

function availability(r: Row): { label: string; tone: Tone } {
  if (r.stock_quantity <= 0) return { label: "Out of Stock", tone: "danger" };
  if (r.stock_quantity <= r.low_stock_threshold) return { label: "Low Stock", tone: "warning" };
  return { label: "In Stock", tone: "success" };
}

function InventoryAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [avFilter, setAvFilter] = useState("all");
  const [editing, setEditing] = useState<Row | null>(null);
  const [adjust, setAdjust] = useState<null | { row: Row; mode: "add" | "reduce" }>(null);
  const [adjustQty, setAdjustQty] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name").order("sort_order");
      return data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,sku,category_id,stock_quantity,low_stock_threshold,min_stock,max_stock,warehouse,supplier,cost_price,selling_price,updated_at")
        .order("name");
      if (error) throw error;
      return data as Row[];
    },
  });

  const filtered = useMemo(() => {
    let rows = data ?? [];
    if (avFilter !== "all") rows = rows.filter((r) => availability(r).label === avFilter);
    const s = search.trim().toLowerCase();
    if (s) rows = rows.filter((r) => [r.name, r.sku, r.warehouse, r.supplier].filter(Boolean).some((v) => v!.toLowerCase().includes(s)));
    return rows;
  }, [data, avFilter, search]);

  const lowCount = (data ?? []).filter((r) => r.stock_quantity <= r.low_stock_threshold).length;
  const catName = (id: string | null) => categories?.find((c) => c.id === id)?.name ?? "—";

  async function saveEdit() {
    if (!editing) return;
    const { error } = await supabase
      .from("products")
      .update({
        sku: editing.sku,
        warehouse: editing.warehouse,
        supplier: editing.supplier,
        cost_price: editing.cost_price,
        selling_price: editing.selling_price,
        stock_quantity: editing.stock_quantity,
        min_stock: editing.min_stock,
        max_stock: editing.max_stock,
        low_stock_threshold: editing.low_stock_threshold,
      })
      .eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success(`${editing.name} updated`);
    logActivity({ action: "inventory_updated", entityType: "product", entityId: editing.id, description: `Inventory updated for ${editing.name}` });
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-inventory"] });
  }

  async function applyAdjust() {
    if (!adjust) return;
    const qty = Number(adjustQty);
    if (!qty || qty <= 0) return toast.error("Enter a valid quantity");
    const next = adjust.mode === "add" ? adjust.row.stock_quantity + qty : Math.max(0, adjust.row.stock_quantity - qty);
    const { error } = await supabase.from("products").update({ stock_quantity: next }).eq("id", adjust.row.id);
    if (error) return toast.error(error.message);
    toast.success(`${adjust.mode === "add" ? "Restocked" : "Reduced"} ${adjust.row.name}`);
    logActivity({ action: "inventory_updated", entityType: "product", entityId: adjust.row.id, description: `${adjust.mode === "add" ? "Restocked +" : "Reduced -"}${qty} for ${adjust.row.name}` });
    setAdjust(null);
    setAdjustQty("");
    qc.invalidateQueries({ queryKey: ["admin-inventory"] });
  }

  function exportRows() {
    if (!filtered.length) return toast.error("Nothing to export");
    exportCsv("inventory", filtered.map((r) => ({
      SKU: r.sku ?? "",
      Product: r.name,
      Category: catName(r.category_id),
      Quantity: r.stock_quantity,
      Warehouse: r.warehouse ?? "",
      Supplier: r.supplier ?? "",
      "Cost Price": r.cost_price ?? "",
      "Selling Price": r.selling_price ?? "",
      "Min Stock": r.min_stock,
      "Max Stock": r.max_stock ?? "",
      Availability: availability(r).label,
      "Last Updated": formatDate(r.updated_at),
    })));
    toast.success("Exported CSV");
  }

  return (
    <div>
      <PageHeader
        title="Inventory Management"
        description="Track stock levels, warehouses, suppliers and pricing."
        action={<Button variant="outline" onClick={exportRows}><Download className="mr-1.5 size-4" /> Export</Button>}
      />

      {lowCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle className="size-4" />
          {lowCount} item(s) at or below their low-stock threshold.
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search inventory…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={avFilter} onValueChange={setAvFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Availability" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All availability</SelectItem>
            <SelectItem value="In Stock">In Stock</SelectItem>
            <SelectItem value="Low Stock">Low Stock</SelectItem>
            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">SKU</th>
              <th className="p-3">Product</th>
              <th className="p-3 hidden lg:table-cell">Warehouse</th>
              <th className="p-3">Qty</th>
              <th className="p-3 hidden md:table-cell">Selling</th>
              <th className="p-3">Availability</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-border"><td colSpan={7} className="p-3"><Skeleton className="h-6 w-full" /></td></tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="p-10 text-center text-muted-foreground"><Boxes className="mx-auto mb-2 size-8 opacity-40" />No inventory found.</td></tr>
            )}
            {filtered.map((r) => {
              const av = availability(r);
              return (
                <tr key={r.id} className={cn("border-t border-border transition-colors hover:bg-secondary/50", av.tone === "danger" && "bg-red-50/50 dark:bg-red-500/5", av.tone === "warning" && "bg-amber-50/50 dark:bg-amber-500/5")}>
                  <td className="p-3 font-mono text-xs">{r.sku || "—"}</td>
                  <td className="p-3"><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{catName(r.category_id)}</div></td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">{r.warehouse || "—"}</td>
                  <td className="p-3 font-semibold">{r.stock_quantity}</td>
                  <td className="p-3 hidden md:table-cell">{formatCurrency(r.selling_price)}</td>
                  <td className="p-3"><span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", toneClass[av.tone])}>{av.label}</span></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setAdjust({ row: r, mode: "add" }); setAdjustQty(""); }} aria-label="Restock"><Plus className="size-4 text-emerald-600" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { setAdjust({ row: r, mode: "reduce" }); setAdjustQty(""); }} aria-label="Reduce"><Minus className="size-4 text-amber-600" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditing({ ...r })} aria-label="Edit"><Pencil className="size-4" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {editing && (
            <>
              <DialogHeader><DialogTitle>{editing.name}</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumOrText label="SKU" value={editing.sku ?? ""} onChange={(v) => setEditing({ ...editing, sku: v })} />
                <NumOrText label="Warehouse" value={editing.warehouse ?? ""} onChange={(v) => setEditing({ ...editing, warehouse: v })} />
                <NumOrText label="Supplier" value={editing.supplier ?? ""} onChange={(v) => setEditing({ ...editing, supplier: v })} />
                <NumField label="Quantity" value={editing.stock_quantity} onChange={(v) => setEditing({ ...editing, stock_quantity: v })} />
                <NumField label="Cost Price" value={editing.cost_price ?? 0} onChange={(v) => setEditing({ ...editing, cost_price: v })} />
                <NumField label="Selling Price" value={editing.selling_price ?? 0} onChange={(v) => setEditing({ ...editing, selling_price: v })} />
                <NumField label="Min Stock" value={editing.min_stock} onChange={(v) => setEditing({ ...editing, min_stock: v })} />
                <NumField label="Max Stock" value={editing.max_stock ?? 0} onChange={(v) => setEditing({ ...editing, max_stock: v })} />
                <NumField label="Low-stock threshold" value={editing.low_stock_threshold} onChange={(v) => setEditing({ ...editing, low_stock_threshold: v })} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={saveEdit}>Save</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Adjust dialog */}
      <Dialog open={!!adjust} onOpenChange={(o) => !o && setAdjust(null)}>
        <DialogContent className="sm:max-w-sm">
          {adjust && (
            <>
              <DialogHeader><DialogTitle>{adjust.mode === "add" ? "Restock" : "Reduce"} — {adjust.row.name}</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Current stock: <strong>{adjust.row.stock_quantity}</strong></p>
              <div>
                <Label className="text-xs">Quantity to {adjust.mode === "add" ? "add" : "remove"}</Label>
                <Input type="number" min={1} value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAdjust(null)}>Cancel</Button>
                <Button onClick={applyAdjust}>Apply</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NumOrText({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
