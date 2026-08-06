import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: MessagesAdmin,
});

type Msg = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  created_at: string;
};

function MessagesAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id,name,email,phone,message,status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Msg[];
    },
  });

  async function setStatus(id: string, status: Msg["status"]) {
    const { error } = await supabase
      .from("messages")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-messages"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Message deleted");
    qc.invalidateQueries({ queryKey: ["admin-messages"] });
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Inquiries and quote requests submitted through your website."
      />
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && data?.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          No messages yet.
        </div>
      )}
      <div className="grid gap-4">
        {data?.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-bold text-primary">{m.name}</p>
                <div className="mt-0.5 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                  <a href={`mailto:${m.email}`} className="hover:text-accent">
                    {m.email}
                  </a>
                  {m.phone && <span>{m.phone}</span>}
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={m.status}
                  onValueChange={(v) => setStatus(m.id, v as Msg["status"])}
                >
                  <SelectTrigger className="h-9 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" asChild aria-label="Reply">
                  <a href={`mailto:${m.email}`}>
                    <Mail className="size-4" />
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remove(m.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
              {m.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}