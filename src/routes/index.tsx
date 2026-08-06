import { createFileRoute } from "@tanstack/react-router";
import { getCatalog, getSiteSettings } from "@/lib/catalog.functions";
import { siteConfig } from "@/lib/site-config";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { HeroSlider } from "@/components/home/HeroSlider";
import { AboutSection } from "@/components/home/AboutSection";
import { WhyChoose } from "@/components/home/WhyChoose";
import { StatsSection } from "@/components/home/StatsSection";
import { ProductsSection } from "@/components/home/ProductsSection";
import { Testimonials } from "@/components/home/Testimonials";
import { ContactSection } from "@/components/home/ContactSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: `${siteConfig.name} | ${siteConfig.tagline}`,
      },
      { name: "description", content: siteConfig.description },
      { property: "og:title", content: `${siteConfig.name} | ${siteConfig.tagline}` },
      { property: "og:description", content: siteConfig.description },
      { property: "og:type", content: "website" },
    ],
  }),
  loader: async () => {
    const [{ categories, products }, settings] = await Promise.all([
      getCatalog(),
      getSiteSettings(),
    ]);
    return { categories, products, settings };
  },
  component: Index,
});

function Index() {
  const { categories, products, settings } = Route.useLoaderData();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSlider />
        <StatsSection />
        <AboutSection ownerImage={settings.owner_image_url} />
        <WhyChoose />
        <ProductsSection categories={categories} products={products} />
        <Testimonials />
        <ContactSection />
      </main>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
