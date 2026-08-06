import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat;
        if (!path) return new Response("Not found", { status: 404 });

        // Uses the public (publishable) key only — a "public read" storage
        // policy on the media bucket allows it. No service-role key needed,
        // so this works on any host with just the two public env vars.
        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) return new Response("Storage not configured", { status: 500 });

        const { createClient } = await import("@supabase/supabase-js");
        const client = createClient(url, key, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await client.storage.from("media").download(path);

        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }

        const buffer = await data.arrayBuffer();
        return new Response(buffer, {
          status: 200,
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});