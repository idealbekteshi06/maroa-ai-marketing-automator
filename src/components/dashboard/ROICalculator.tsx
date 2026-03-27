import { useEffect, useState, useRef } from "react";
import { Clock, DollarSign, Building2, TrendingUp } from "lucide-react";

interface ROICalculatorProps {
  postsPublished: number;
}

function useCountUp(target: number, duration = 2000, startCounting: boolean) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!startCounting) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, startCounting]);

  return value;
}

export default function ROICalculator({ postsPublished }: ROICalculatorProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const hoursSaved = postsPublished * 2;
  const freelancerSaved = hoursSaved * 65;
  const agencySaved = 751;
  const totalValue = freelancerSaved + agencySaved;

  const animHours = useCountUp(hoursSaved, 2000, visible);
  const animFreelancer = useCountUp(freelancerSaved, 2000, visible);
  const animAgency = useCountUp(agencySaved, 2000, visible);
  const animTotal = useCountUp(totalValue, 2000, visible);

  const metrics = [
    { label: "Hours saved this month", value: `${animHours}h`, icon: Clock, sub: `${postsPublished} posts × 2 hrs each` },
    { label: "Freelancer cost saved", value: `$${animFreelancer.toLocaleString()}`, icon: DollarSign, sub: `${hoursSaved} hrs × $65/hr` },
    { label: "Agency cost saved", value: `$${animAgency}`, icon: Building2, sub: "$800 agency − $49 maroa.ai" },
    { label: "Total value created", value: `$${animTotal.toLocaleString()}`, icon: TrendingUp, sub: "This month's savings" },
  ];

  return (
    <div ref={ref} className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-card-foreground">Your ROI with maroa.ai</h3>
      <div className="mt-4 grid gap-4 grid-cols-2">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <m.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <span className="text-[11px] text-muted-foreground">{m.label}</span>
            </div>
            <p className="mt-2 text-xl font-bold text-card-foreground">{m.value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{m.sub}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">Based on industry averages for marketing work</p>
    </div>
  );
}
