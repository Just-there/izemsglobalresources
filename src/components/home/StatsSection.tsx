import { useEffect, useRef, useState } from "react";
import { Boxes, Smile, Truck, CalendarClock } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";

const stats = [
  { icon: CalendarClock, value: 15, suffix: "+", label: "Years of Experience" },
  { icon: Smile, value: 2000, suffix: "+", label: "Happy Customers" },
  { icon: Boxes, value: 50, suffix: "+", label: "Product Lines" },
  { icon: Truck, value: 36, suffix: "", label: "States Delivered To" },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="bg-primary py-14 text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100}>
              <div className="flex flex-col items-center text-center">
                <stat.icon className="size-9 text-brand-sky" />
                <p className="mt-3 text-3xl font-extrabold sm:text-4xl">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-sm text-white/75">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}