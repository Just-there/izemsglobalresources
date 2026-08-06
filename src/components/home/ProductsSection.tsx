import { useMemo, useState } from "react";
import { Search, MessageSquareText } from "lucide-react";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog.functions";
import { whatsappLink } from "@/lib/site-config";
import { Reveal } from "@/components/site/Reveal";
import { ProductImage } from "@/components/site/ProductImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  categories: CatalogCategory[];
  products: CatalogProduct[];
}

export function ProductsSection({ categories, products }: Props) {
  const [activeCat, setActiveCat] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = activeCat === "all" || p.category_id === activeCat;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [products, activeCat, query]);

  function inquire(name: string) {
    const el = document.getElementById("contact");
    window.dispatchEvent(
      new CustomEvent("izems:inquiry", { detail: name }),
    );
    el?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section id="products" className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-accent">
              Our Catalogue
            </span>
            <h2 className="heading-underline-center mt-2 text-3xl font-extrabold text-primary sm:text-4xl">
              Premium Steel Products
            </h2>
            <p className="mt-4 text-muted-foreground">
              Browse our range of quality steel and building materials. Send an inquiry
              for a fast, no-obligation quote.
            </p>
          </div>
        </Reveal>

        {/* Controls */}
        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <CategoryPill
              active={activeCat === "all"}
              onClick={() => setActiveCat("all")}
            >
              All
            </CategoryPill>
            {categories.map((cat) => (
              <CategoryPill
                key={cat.id}
                active={activeCat === cat.id}
                onClick={() => setActiveCat(cat.id)}
              >
                {cat.name}
              </CategoryPill>
            ))}
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="pl-9"
              aria-label="Search products"
            />
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="mt-16 text-center text-muted-foreground">
            No products match your search.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((product, i) => (
              <Reveal key={product.id} delay={(i % 4) * 80}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative aspect-square overflow-hidden bg-secondary">
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                    {product.is_featured && (
                      <span className="absolute left-3 top-3 rounded-full bg-brand-cta px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-bold text-primary">{product.name}</h3>
                    <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-brand-cta hover:bg-brand-cta-hover"
                        onClick={() => inquire(product.name)}
                      >
                        <MessageSquareText className="size-4" /> Inquire
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-accent/40 text-accent hover:bg-accent/10 hover:text-accent"
                      >
                        <a
                          href={whatsappLink(
                            `Hello, I'd like a quote for ${product.name}.`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Ask about ${product.name} on WhatsApp`}
                        >
                          Chat
                        </a>
                      </Button>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-foreground/70 hover:bg-accent/10 hover:text-accent",
      )}
    >
      {children}
    </button>
  );
}