import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/media";
import { PageHeader } from "@/components/admin/AdminShell";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsAdmin,
});

function SettingsAdmin() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: ownerImage } = useQuery({
    queryKey: ["setting-owner-image"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "owner_image_url")
        .maybeSingle();
      return data?.value ?? null;
    },
  });

  async function handleOwner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, "site");
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          { key: "owner_image_url", value: url, is_public: true },
          { onConflict: "key" },
        );
      if (error) throw error;
      toast.success("Owner photo updated");
      qc.invalidateQueries({ queryKey: ["setting-owner-image"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage site content such as the founder photo."
      />
      <div className="max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-bold text-primary">Founder / Owner Photo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown in the About section on the homepage.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
            {ownerImage ? (
              <img src={ownerImage} alt="Owner" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <ImagePlus className="size-5" />
              </div>
            )}
          </div>
          <div>
            <Label
              htmlFor="owner-image"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <ImagePlus className="size-4" />
              {uploading ? "Uploading…" : "Upload new photo"}
            </Label>
            <input
              id="owner-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleOwner}
            />
          </div>
        </div>
      </div>
    </div>
  );
}