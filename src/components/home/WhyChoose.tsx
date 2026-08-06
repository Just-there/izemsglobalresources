import {
  ShieldCheck,
  Truck,
  Tags,
  Headphones,
  Boxes,
  Award,
} from "lucide-react";
import { Reveal } from "@/components/site/Reveal";

const features = [
  {
    icon: ShieldCheck,
    title: "Certified Quality",
    text: "Every product is sourced from trusted mills and meets industry-grade standards.",
  },
  {
    icon: Tags,
    title: "Competitive Pricing",
    text: "Wholesale and retail pricing that keeps your project budget on track.",
  },
  {
    icon: Truck,
    title: "Nationwide Delivery",
    text: "A reliable logistics network delivers your order anywhere in Nigeria.",
  },
  {
    icon: Boxes,
    title: "Wide Product Range",
    text: "Pipes, beams, sheets, rods and consumables — all in one place.",
  },
  {
    icon: Headphones,
    title: "Expert Support",
    text: "Our team helps you choose the right material for every application.",
  },
  {
    icon: Award,
    title: "Proven Track Record",
    text: "Years of dependable supply to contractors and businesses nationwide.",
  },
];

export function WhyChoose() {
  return (
    <section id="why" className="bg-secondary py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-accent">
              Why Choose Us
            </span>
            <h2 className="heading-underline-center mt-2 text-3xl font-extrabold text-primary sm:text-4xl">
              Built on Quality &amp; Trust
            </h2>
            <p className="mt-4 text-muted-foreground">
              We combine premium materials, fair pricing and dependable service to keep
              your projects moving forward.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 100}>
              <div className="group h-full rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg">
                <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                  <feature.icon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-primary">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}