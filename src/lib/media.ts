import { supabase } from "@/integrations/supabase/client";

/** Public URL served through our proxy route for a stored media path. */
export function mediaUrl(path: string): string {
  return `/api/public/media/${path}`;
}

/**
 * Upload an image to the private "media" bucket (staff only via RLS) and
 * return a stable public proxy URL. `folder` groups files, e.g. "products".
 */
export async function uploadMedia(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safe = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(safe, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return mediaUrl(safe);
}