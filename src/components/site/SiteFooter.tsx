import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Send, MessageCircle } from "lucide-react";
import logo from "@/assets/izems-logo.png";
import { navLinks, siteConfig, whatsappLink } from "@/lib/site-config";
import { subscribeNewsletter } from "@/lib/contact.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const productLinks = [
  "Steel Pipes",
  "Steel Sheets & Plates",
  "Structural Steel",
  "Rods & Bars",
];

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await subscribeNewsletter({ data: { email: email.trim() } });
      toast.success("Subscribed! Thanks for joining our newsletter.");
      setEmail("");
    } catch {
      toast.error("Subscription failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <footer className="footer-gradient text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand + newsletter */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt={`${siteConfig.name} logo`}
                className="size-12 rounded-md bg-white/95 p-1"
                width={48}
                height={48}
              />
              <div>
                <p className="font-bold leading-tight">IZEMS</p>
                <p className="text-xs text-white/70">Global Resources Ltd</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              {siteConfig.description}
            </p>

            <form onSubmit={handleSubscribe} className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-white/90">
                Subscribe to our newsletter
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="shrink-0 bg-brand-cta hover:bg-brand-cta-hover"
                  aria-label="Subscribe"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </form>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-white/75 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">
              Our Products
            </h3>
            <ul className="space-y-2.5 text-sm">
              {productLinks.map((p) => (
                <li key={p}>
                  <a
                    href="#products"
                    className="text-white/75 transition-colors hover:text-white"
                  >
                    {p}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">
              Get in Touch
            </h3>
            <ul className="space-y-3 text-sm text-white/75">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-sky" />
                <span>{siteConfig.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-sky" />
                <a href={siteConfig.phoneHref} className="hover:text-white">
                  {siteConfig.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-brand-sky" />
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="break-all hover:text-white"
                >
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 size-4 shrink-0 text-brand-sky" />
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 text-center text-xs text-white/60 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-white">
              Terms &amp; Conditions
            </Link>
            <a href="/#contact" className="transition-colors hover:text-white">
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}