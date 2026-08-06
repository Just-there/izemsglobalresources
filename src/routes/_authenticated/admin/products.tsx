import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ImagePlus, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/media";
import { PageHeader } from "@/components/admin/AdminShell";
import { ProductImage } from "@/components/site/ProductImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: ProductsAdmin,
});

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  sku: string | null;
  price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  status: "active" | "draft" | "out_of_stock" | "archived";
  image_url: string | null;
  is_featured: boolean;
};

const empty: ProductRow = {
  id: "",
  name: "",
  slug: "",
  description: "",
  category_id: null,
  sku: "",
  price: null,
  stock_quantity: 0,
  low_stock_threshold: 10,
  status: "active",
  image_url: null,
  is_featured: false,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ProductsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id,name")
        .order("sort_order");
      return data ?? [];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,name,slug,description,category_id,sku,price,stock_quantity,low_stock_threshold,status,image_url,is_featured",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProductRow[];
    },
  });

  async function remove(p: ProductRow) {
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Product deleted");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    setDeleting(null);
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description="Add, edit and manage your product catalogue and images."
        action={
          <Button
            onClick={() => setEditing({ ...empty })}
            className="bg-brand-cta hover:bg-brand-cta-hover"
          >
            <Plus className="size-4" /> Add Product
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-semibold">Product</th>
              <th className="p-3 font-semibold">Category</th>
              <th className="p-3 font-semibold">Stock</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {products?.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {p.image_url ? (
                        <ProductImage src={p.image_url} alt={p.name} />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <ImagePlus className="size-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="flex items-center gap-1 font-medium text-primary">
                        {p.name}
                        {p.is_featured && (
                          <Star className="size-3 fill-gold text-gold" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.sku || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">
                  {categories?.find((c) => c.id === p.category_id)?.name || "—"}
                </td>
                <td className="p-3">
                  <span
                    className={
                      p.stock_quantity <= p.low_stock_threshold
                        ? "font-semibold text-destructive"
                        : "text-foreground"
                    }
                  >
                    {p.stock_quantity}
                  </span>
                </td>
                <td className="p-3">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-foreground">
                    {p.status.replace("_", " ")}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditing(p)}
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleting(p)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && products?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductDialog
          product={editing}
          categories={categories ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["admin-products"] });
            setEditing(null);
          }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove “{deleting?.name}”. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && remove(deleting)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProductDialog({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: ProductRow;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductRow>(product);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isNew = !product.id;

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, "products");
      setForm((f) => ({ ...f, image_url: url }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description || null,
      category_id: form.category_id,
      sku: form.sku || null,
      price: form.price,
      stock_quantity: form.stock_quantity,
      low_stock_threshold: form.low_stock_threshold,
      status: form.status,
      image_url: form.image_url,
      is_featured: form.is_featured,
    };
    const res = isNew
      ? await supabase.from("products").insert(payload)
      : await supabase.from("products").update(payload).eq("id", form.id);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(isNew ? "Product created" : "Product updated");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add Product" : "Edit Product"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex items-center gap-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
              {form.image_url ? (
                <ProductImage src={form.image_url} alt="Product image preview" />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ImagePlus className="size-5" />
                </div>
              )}
            </div>
            <div>
              <Label
                htmlFor="p-image"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <ImagePlus className="size-4" />
                {uploading ? "Uploading…" : "Upload image"}
              </Label>
              <input
                id="p-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImage}
              />
              <p className="mt-1 text-xs text-muted-foreground">JPG or PNG.</p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={form.category_id ?? "none"}
                onValueChange={(v) =>
                  setForm({ ...form, category_id: v === "none" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorised</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>SKU</Label>
              <Input
                value={form.sku ?? ""}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Price (₦)</Label>
              <Input
                type="number"
                value={form.price ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Stock</Label>
              <Input
                type="number"
                value={form.stock_quantity}
                onChange={(e) =>
                  setForm({ ...form, stock_quantity: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Low at</Label>
              <Input
                type="number"
                value={form.low_stock_threshold}
                onChange={(e) =>
                  setForm({ ...form, low_stock_threshold: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as ProductRow["status"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="out_of_stock">Out of stock</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              Featured product
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving || uploading}
            className="bg-brand-cta hover:bg-brand-cta-hover"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}