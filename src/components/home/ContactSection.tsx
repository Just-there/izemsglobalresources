import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, MapPin, Phone, Send, Clock, MessageCircle } from "lucide-react";
import { siteConfig, whatsappLink } from "@/lib/site-config";
import { submitContact } from "@/lib/contact.functions";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const initial = { name: "", email: "", phone: "", message: "" };

export function ContactSection() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onInquiry(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      setForm((f) => ({
        ...f,
        message: `Hello, I'd like to request a quote for: ${detail}.`,
      }));
    }
    window.addEventListener("izems:inquiry", onInquiry);
    return () => window.removeEventListener("izems:inquiry", onInquiry);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await submitContact({ data: form });
      toast.success("Thank you! Your message has been sent. We'll be in touch soon.");
      setForm(initial);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contact" className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-accent">
              Contact Us
            </span>
            <h2 className="heading-underline-center mt-2 text-3xl font-extrabold text-primary sm:text-4xl">
              Request a Quote
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tell us what you need and our team will get back to you with pricing and
              availability.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Info */}
          <Reveal className="lg:col-span-2">
            <div className="flex h-full flex-col gap-4">
              <InfoCard icon={MapPin} title="Visit Us" lines={[siteConfig.address]} />
              <InfoCard
                icon={Phone}
                title="Call Us"
                lines={[siteConfig.phone]}
                href={siteConfig.phoneHref}
              />
              <InfoCard
                icon={Mail}
                title="Email Us"
                lines={[siteConfig.email]}
                href={`mailto:${siteConfig.email}`}
              />
              <InfoCard
                icon={MessageCircle}
                title="WhatsApp"
                lines={[siteConfig.phone]}
                href={whatsappLink()}
                external
              />
              <InfoCard
                icon={Clock}
                title="Working Hours"
                lines={["Mon – Sat: 8:00am – 6:00pm"]}
              />
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={100} className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    maxLength={30}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+234 800 000 0000"
                  />
                </div>
              </div>
              <div className="mt-5 grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div className="mt-5 grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  required
                  maxLength={2000}
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us which products and quantities you need…"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="mt-6 w-full bg-brand-cta hover:bg-brand-cta-hover"
              >
                {loading ? "Sending…" : "Send Message"}
                {!loading && <Send className="size-4" />}
              </Button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  icon: Icon,
  title,
  lines,
  href,
  external,
}: {
  icon: typeof MapPin;
  title: string;
  lines: string[];
  href?: string;
  external?: boolean;
}) {
  const content = (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-accent/40">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-primary">{title}</p>
        {lines.map((line) => (
          <p key={line} className="break-words text-sm text-muted-foreground">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
  return href ? (
    <a
      href={href}
      className="block"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {content}
    </a>
  ) : (
    content
  );
}