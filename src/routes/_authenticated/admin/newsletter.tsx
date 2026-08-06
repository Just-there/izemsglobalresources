import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/newsletter")({
  component: NewsletterAdmin,
});

type Sub = { id: string; email: string; is_active: boolean; created_at: string };

function NewsletterAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("id,email,is_active,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Sub[];
    },
  });

  async function toggle(s: Sub) {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ is_active: !s.is_active })
      .eq("id", s.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-newsletter"] });
  }

  async function remove(id: string) {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .delete()
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    qc.invalidateQueries({ queryKey: ["admin-newsletter"] });
  }

  function exportCsv() {
    const rows = data ?? [];
    const csv = ["email,active,subscribed_at"]
      .concat(rows.map((r) => `${r.email},${r.is_active},${r.created_at}`))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "izems-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Newsletter"
        description="Manage subscribers to your newsletter."
        action={
          <Button variant="outline" onClick={exportCsv} disabled={!data?.length}>
            Export CSV
          </Button>
        }
      />
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Subscribed</th>
              <th className="p-3 font-semibold">Active</th>
              <th className="p-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {data?.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium text-primary">{s.email}</td>
                <td className="p-3 text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <Switch checked={s.is_active} onCheckedChange={() => toggle(s)} />
                </td>
                <td className="p-3">
                  <div className="flex justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(s.id)}
                      aria-label="Remove"
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
    </div>
  );
}