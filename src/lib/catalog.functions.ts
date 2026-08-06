import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Public, read-only Supabase client (publishable key, no session). */
function createPublicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  );
}

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  image_url: string | null;
  tags: string[];
  is_featured: boolean;
  sku: string | null;
};

/** Fetch active products + categories for public pages (SSR-safe). */
export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();

  const [categoriesRes, productsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,slug,description,sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("id,name,slug,description,category_id,image_url,tags,is_featured,sku")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  if (categoriesRes.error) {
    console.error("[getCatalog] categories", categoriesRes.error);
  }
  if (productsRes.error) {
    console.error("[getCatalog] products", productsRes.error);
  }

  return {
    categories: (categoriesRes.data ?? []) as CatalogCategory[],
    products: (productsRes.data ?? []) as CatalogProduct[],
  };
});

/** Fetch public site settings (owner image, etc.) as a key/value map. */
export const getSiteSettings = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value");
    if (error) {
      console.error("[getSiteSettings]", error);
      return {} as Record<string, string>;
    }
    const map: Record<string, string> = {};
    for (const row of data ?? []) {
      if (row.value != null) map[row.key] = row.value;
    }
    return map;
  },
);