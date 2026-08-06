import { useEffect, useState, useCallback } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Truck } from "lucide-react";
import heroPipes from "@/assets/hero-pipes.jpg";
import heroBeams from "@/assets/hero-beams.jpg";
import heroDelivery from "@/assets/hero-delivery.jpg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const slides = [
  {
    image: heroPipes,
    eyebrow: "Premium Steel Supply",
    title: "Quality Steel Pipes for Every Project",
    text: "From square and round pipes to seamless and galvanized tubes — engineered to the highest standards for construction and industry.",
  },
  {
    image: heroBeams,
    eyebrow: "Structural Strength",
    title: "Beams & Structural Steel You Can Trust",
    text: "H-beams, U-channels and angle iron built to carry the load of Nigeria's most demanding building projects.",
  },
  {
    image: heroDelivery,
    eyebrow: "Nationwide Delivery",
    title: "Reliable Supply, Delivered On Time",
    text: "A dependable supply chain and fast logistics keep your project moving — wherever you are in Nigeria.",
  },
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), []);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + slides.length) % slides.length),
    [],
  );

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section id="home" className="relative h-[88vh] min-h-[560px] w-full overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            i === index ? "opacity-100" : "opacity-0",
          )}
          aria-hidden={i !== index}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="size-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "low"}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy-darkest/90 via-brand-navy/75 to-brand-navy/30" />
        </div>
      ))}

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div key={index} className="max-w-2xl animate-[izems-fade-in_0.7s_ease]">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-sky backdrop-blur">
            <Truck className="size-3.5" />
            {slides[index].eyebrow}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            {slides[index].title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            {slides[index].text}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              className="bg-brand-cta text-base hover:bg-brand-cta-hover"
            >
              <a href="#products">
                Explore Products <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/5 text-base text-white hover:bg-white/15 hover:text-white"
            >
              <a href="#contact">Request a Quote</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/25 sm:block"
      >
        <ChevronLeft className="size-6" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/25 sm:block"
      >
        <ChevronRight className="size-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "h-2.5 rounded-full transition-all",
              i === index ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80",
            )}
          />
        ))}
      </div>
    </section>
  );
}