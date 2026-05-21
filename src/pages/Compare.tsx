import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const tools = ["maroa.ai", "Marketing Agency", "Hootsuite", "Buffer", "Jasper"];

const features: { name: string; values: (boolean | string)[] }[] = [
  { name: "AI content writing", values: [true, true, false, false, true] },
  { name: "Auto-posting to all platforms", values: [true, true, true, true, false] },
  { name: "Meta ads management", values: [true, true, false, false, false] },
  { name: "Daily ad optimization", values: [true, false, false, false, false] },
  { name: "A/B testing", values: [true, true, false, false, false] },
  { name: "Competitor tracking", values: [true, true, false, false, false] },
  { name: "Weekly AI strategy", values: [true, false, false, false, false] },
  { name: "AI image generation", values: [true, false, false, false, true] },
  { name: "Pricing per month", values: ["From $29", "$800+", "$99", "$36", "$49"] },
];

function CellValue({ val }: { val: boolean | string }) {
  if (typeof val === "string") return <span className="text-sm font-medium text-foreground">{val}</span>;
  return val ? (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 mx-auto">
      <Check className="h-3.5 w-3.5 text-success" />
    </div>
  ) : (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10 mx-auto">
      <X className="h-3.5 w-3.5 text-destructive" />
    </div>
  );
}

export default function Compare() {
  // SEO managed end-to-end by useSEO (title + meta description +
  // canonical + OG + Twitter). The page-specific JSON-LD lives below
  // — kept as a separate script tag so React doesn't fight it.
  useSEO({
    title: "Maroa vs agency, Hootsuite, Buffer & Jasper",
    description:
      "Compare maroa.ai with marketing agencies, Hootsuite, Buffer, and Jasper across AI content, auto-posting, ad management, and price. Starts at $29/mo. Cancel anytime.",
    path: "/compare",
  });
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Maroa vs marketing agencies, Hootsuite, Buffer & Jasper",
      description:
        "Side-by-side comparison: AI content, auto-posting, ad management, A/B testing, competitor tracking, weekly strategy. Maroa from $29/mo vs $800+ agency retainers.",
      url: "https://maroa.ai/compare",
    });
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  return (
    <>
      <Navbar />
      <main className="py-20 sm:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center px-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Why businesses choose maroa.ai
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              Everything an agency does, for a fraction of the price. Fully automated.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl overflow-x-auto px-2">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="text-left py-4 px-3 text-muted-foreground font-medium">Feature</th>
                  {tools.map((t, i) => (
                    <th key={t} className={`py-4 px-3 text-center font-semibold ${i === 0 ? "text-primary bg-primary/5 rounded-t-xl" : "text-foreground"}`}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((f, ri) => (
                  <tr key={f.name} className={ri % 2 === 0 ? "" : "bg-muted/30"}>
                    <td className="py-3.5 px-3 text-foreground font-medium">{f.name}</td>
                    {f.values.map((v, ci) => (
                      <td key={ci} className={`py-3.5 px-3 text-center ${ci === 0 ? "bg-primary/5" : ""}`}>
                        <CellValue val={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 text-center">
            <Link to="/signup">
              <Button variant="hero" size="xl">Start with Growth — $59/mo</Button>
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">Cancel anytime · No contracts</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
