import { useCallback, useEffect, useRef, useState } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type Testimonial = {
  name: string;
  email: string;
  role: string;
  company: string;
  city: string;
  rating: number;
  text: string;
};

const avatarGradients = [
  "from-brand-navy to-brand-steel",
  "from-brand-steel to-brand-sky",
  "from-brand-cta to-brand-navy-deep",
  "from-brand-navy-deep to-brand-steel",
  "from-brand-navy to-brand-cta",
];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

const testimonials: Testimonial[] = [
  {
    name: "Chidi Okafor",
    email: "chidiokafor4@gmail.com",
    role: "Managing Director",
    company: "Okafor Construction Ltd",
    city: "Lagos",
    rating: 5,
    text: "IZEMS has been our go-to steel supplier for three years. The quality is consistent, the pricing is transparent, and deliveries always arrive on schedule. They understand large projects.",
  },
  {
    name: "Aisha Bello",
    email: "aisha.bello22@gmail.com",
    role: "Project Manager",
    company: "Sahel Developments",
    city: "Abuja",
    rating: 4,
    text: "Their team helped us spec the right beams for a major build. Professional, responsive and fairly priced. A delivery ran a day late once, but they kept me updated the whole way.",
  },
  {
    name: "Emeka Nwosu",
    email: "emekanwosu.fab@gmail.com",
    role: "Workshop Owner",
    company: "Nwosu Fabrication",
    city: "Onitsha",
    rating: 5,
    text: "Great range of pipes and rods, and the WhatsApp ordering makes restocking effortless. Genuine material every single time — highly recommended.",
  },
  {
    name: "Grace Adeyemi",
    email: "grace.adeyemi.re@gmail.com",
    role: "Real Estate Developer",
    company: "Adeyemi Estates",
    city: "Ibadan",
    rating: 5,
    text: "Reliable supply at scale. IZEMS understands deadlines and rarely lets our sites run short on materials. That reliability is worth a great deal to us.",
  },
  {
    name: "Ibrahim Musa",
    email: "ibrahimmusa.ng@gmail.com",
    role: "Civil Engineer",
    company: "Northgate Consultants",
    city: "Kano",
    rating: 5,
    text: "Ordered H-beams and rebar for a two-storey project. Genuine quality and the invoice matched the quote exactly. No surprises — exactly how business should be done.",
  },
  {
    name: "Ngozi Eze",
    email: "ngozi.eze87@gmail.com",
    role: "Hardware Store Owner",
    company: "Eze Hardware",
    city: "Enugu",
    rating: 4,
    text: "Good wholesale prices and the stock is always available. I'd love slightly faster replies on email, but overall a solid, dependable partner for my shop.",
  },
  {
    name: "Tunde Balogun",
    email: "tundebalogun.build@gmail.com",
    role: "Site Foreman",
    company: "Balogun Builders",
    city: "Lagos",
    rating: 5,
    text: "The galvanized pipes we got have held up perfectly through two rainy seasons. Strong material and honest people — we keep coming back.",
  },
  {
    name: "Fatima Sani",
    email: "fatima.sani.projects@gmail.com",
    role: "Procurement Officer",
    company: "Sani Projects",
    city: "Abuja",
    rating: 4,
    text: "Products are good and prices fair. Our first order had a small mix-up on quantities, but their team sorted it out quickly and professionally. Trustworthy.",
  },
];

const AUTOPLAY_MS = 6000;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, s) => (
        <Star
          key={s}
          className={cn(
            "size-4 sm:size-[18px]",
            s < rating ? "fill-gold text-gold" : "text-muted-foreground/25",
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

function Avatar({ t, index }: { t: Testimonial; index: number }) {
  return (
    <div
      className={cn(
        "grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br text-base font-bold text-primary-foreground shadow-md ring-2 ring-white/70",
        avatarGradients[index % avatarGradients.length],
      )}
      aria-hidden
    >
      {initials(t.name)}
    </div>
  );
}

function TestimonialCard({
  t,
  index,
  featured,
}: {
  t: Testimonial;
  index: number;
  featured?: boolean;
}) {
  return (
    <figure
      className={cn(
        "flex h-full flex-col rounded-[20px] border border-white/60 bg-white/85 p-7 text-left shadow-[0_24px_70px_-28px_rgba(11,61,145,0.45)] backdrop-blur-xl sm:p-9",
        featured && "ring-1 ring-brand-steel/10",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand-navy/5 text-accent">
          <Quote className="size-6" />
        </span>
        <Stars rating={t.rating} />
      </div>

      <blockquote className="mt-6 flex-1 text-[15px] leading-[1.8] text-foreground/80 sm:text-lg sm:leading-[1.85]">
        “{t.text}”
      </blockquote>

      <figcaption className="mt-7 flex items-center gap-4 border-t border-border/60 pt-6">
        <Avatar t={t} index={index} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-base font-bold text-primary">{t.name}</p>
            <BadgeCheck className="size-4 shrink-0 text-brand-cta" aria-label="Verified customer" />
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {t.role}, {t.company}
          </p>
          <p className="truncate text-xs text-muted-foreground/80">
            {t.email} · {t.city}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

/* ---------------- Shared carousel controller ---------------- */

function useCarousel(count: number) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const go = useCallback(
    (next: number) => setActive(((next % count) + count) % count),
    [count],
  );
  const next = useCallback(() => go(active + 1), [active, go]);
  const prev = useCallback(() => go(active - 1), [active, go]);

  useEffect(() => {
    if (paused || reduced.current) return;
    const id = setInterval(() => setActive((a) => (a + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  return { active, setActive, paused, setPaused, go, next, prev };
}

function Dots({
  count,
  active,
  onSelect,
}: {
  count: number;
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2.5" role="tablist" aria-label="Testimonials">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === active}
          aria-label={`Go to testimonial ${i + 1}`}
          onClick={() => onSelect(i)}
          className={cn(
            "h-2.5 rounded-full transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta focus-visible:ring-offset-2",
            i === active ? "w-7 bg-brand-cta" : "w-2.5 bg-primary/20 hover:bg-primary/40",
          )}
        />
      ))}
    </div>
  );
}

function ArrowButton({
  dir,
  onClick,
}: {
  dir: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Previous testimonial" : "Next testimonial"}
      className="group grid size-12 place-items-center rounded-full border border-border/70 bg-white/90 text-primary shadow-lg shadow-brand-navy/10 backdrop-blur transition-all duration-300 hover:scale-105 hover:border-brand-cta/40 hover:text-brand-cta active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta focus-visible:ring-offset-2"
    >
      {dir === "left" ? (
        <ChevronLeft className="size-6 transition-transform group-hover:-translate-x-0.5" />
      ) : (
        <ChevronRight className="size-6 transition-transform group-hover:translate-x-0.5" />
      )}
    </button>
  );
}

/* ---------------- Desktop / tablet coverflow ---------------- */

function DesktopCoverflow() {
  const n = testimonials.length;
  const { active, setPaused, go, next, prev } = useCarousel(n);
  const dragX = useRef<number | null>(null);

  const relPos = (i: number) => {
    let d = i - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragX.current = e.clientX;
    setPaused(true);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragX.current !== null) {
      const delta = e.clientX - dragX.current;
      if (Math.abs(delta) > 60) (delta < 0 ? next : prev)();
    }
    dragX.current = null;
    setPaused(false);
  };

  return (
    <div
      className="mt-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-center gap-4 px-2 sm:gap-8">
        <div className="hidden shrink-0 md:block">
          <ArrowButton dir="left" onClick={prev} />
        </div>

        <div
          className="relative mx-auto h-[400px] w-full max-w-[1100px] touch-pan-y select-none lg:h-[380px]"
          style={{ perspective: "1600px" }}
          role="region"
          aria-roledescription="carousel"
          aria-label="Customer testimonials"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {testimonials.map((t, i) => {
            const d = relPos(i);
            const abs = Math.abs(d);
            const visible = abs <= 1;
            const style: React.CSSProperties = {
              transform: `translate3d(${d * 56}%, 0, ${abs === 0 ? 0 : -220}px) scale(${
                abs === 0 ? 1 : 0.86
              })`,
              opacity: abs === 0 ? 1 : abs === 1 ? 0.55 : 0,
              filter: abs === 0 ? "none" : "blur(2px)",
              zIndex: 30 - abs,
              pointerEvents: abs === 0 ? "auto" : "none",
            };
            return (
              <div
                key={t.email}
                className="izems-coverflow-card absolute inset-y-0 left-1/2 w-[62%] max-w-[640px] -translate-x-1/2"
                style={style}
                aria-hidden={d !== 0}
              >
                <TestimonialCard t={t} index={i} featured={d === 0} />
              </div>
            );
          })}
        </div>

        <div className="hidden shrink-0 md:block">
          <ArrowButton dir="right" onClick={next} />
        </div>
      </div>

      <div className="mt-10 flex items-center justify-center gap-6 md:hidden">
        <ArrowButton dir="left" onClick={prev} />
        <ArrowButton dir="right" onClick={next} />
      </div>

      <div className="mt-10">
        <Dots count={n} active={active} onSelect={go} />
      </div>
    </div>
  );
}

/* ---------------- Mobile single-card ---------------- */

function MobileCarousel() {
  const n = testimonials.length;
  const { active, go, next, prev, setPaused } = useCarousel(n);
  const [dir, setDir] = useState(1);
  const startX = useRef<number | null>(null);

  const select = (i: number) => {
    setDir(i >= active ? 1 : -1);
    go(i);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current !== null) {
      const delta = e.changedTouches[0].clientX - startX.current;
      if (Math.abs(delta) > 45) {
        setDir(delta < 0 ? 1 : -1);
        (delta < 0 ? next : prev)();
      }
    }
    startX.current = null;
    setPaused(false);
  };

  const t = testimonials[active];

  return (
    <div className="mt-10 flex flex-col items-center">
      <div
        className="w-full max-w-md px-2"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          key={active}
          className={dir >= 0 ? "izems-slide-in-right" : "izems-slide-in-left"}
        >
          <TestimonialCard t={t} index={active} featured />
        </div>
      </div>

      <div className="mt-8 flex items-center gap-6">
        <ArrowButton dir="left" onClick={() => { setDir(-1); prev(); }} />
        <Dots count={n} active={active} onSelect={select} />
        <ArrowButton dir="right" onClick={() => { setDir(1); next(); }} />
      </div>
    </div>
  );
}

export function Testimonials() {
  const isMobile = useIsMobile();
  return (
    <section className="izems-testimonials relative overflow-hidden py-20 sm:py-28">
      {/* Premium layered background */}
      <div className="izems-testimonials-bg" aria-hidden />
      <div className="izems-testimonials-shape izems-testimonials-shape--1" aria-hidden />
      <div className="izems-testimonials-shape izems-testimonials-shape--2" aria-hidden />
      <div className="izems-testimonials-noise" aria-hidden />

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-steel/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent backdrop-blur">
              Testimonials
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl lg:text-5xl">
              Trusted by builders across Nigeria
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Contractors, engineers and traders rely on IZEMS for genuine steel,
              fair pricing and dependable delivery.
            </p>
          </div>
        </Reveal>
      </div>

      <div className="relative z-10">
        {isMobile ? <MobileCarousel /> : <DesktopCoverflow />}
      </div>
    </section>
  );
}