import { CheckCircle2, ArrowRight } from "lucide-react";
import ownerFallback from "@/assets/owner.jpg";
import aboutBg from "@/assets/about-bg.jpg";
import { siteConfig } from "@/lib/site-config";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";

const highlights = [
  "Genuine, certified steel products",
  "Competitive wholesale & retail pricing",
  "Fast, reliable nationwide delivery",
  "Expert advice for every project",
];

export function AboutSection({ ownerImage }: { ownerImage?: string }) {
  const owner = ownerImage || ownerFallback;
  return (
    <section id="about" className="bg-background py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <Reveal>
          <div className="relative">
            <img
              src={aboutBg}
              alt="IZEMS steel warehouse"
              loading="lazy"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
            />
            <div className="absolute -bottom-8 -right-2 w-44 overflow-hidden rounded-xl border-4 border-card bg-card shadow-lg sm:right-6">
              <img
                src={owner}
                alt={siteConfig.founder.name}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <div className="px-3 py-2 text-center">
                <p className="text-xs font-bold text-primary">
                  {siteConfig.founder.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {siteConfig.founder.role}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-accent">
              About Us
            </span>
            <h2 className="heading-underline mt-2 text-3xl font-extrabold text-primary sm:text-4xl">
              Your Trusted Steel Partner in Nigeria
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              {siteConfig.name} is a leading supplier of premium steel and building
              materials. For over a decade we have helped contractors, fabricators
              and developers source the right materials at the right price — backed
              by genuine quality and dependable delivery.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              From structural beams to specialised pipes and welding consumables, our
              extensive catalogue and industry expertise make us the partner of choice
              for projects of every scale.
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm font-medium text-foreground">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>

            <Button asChild size="lg" className="mt-8 bg-brand-cta hover:bg-brand-cta-hover">
              <a href="/#contact">
                Work With Us <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}