import { ShieldCheck, Truck, RotateCcw, BadgePercent } from "lucide-react";

const BENEFITS = [
  { icon: ShieldCheck, title: "Verified Sellers", desc: "Every seller is reviewed and approved before they can list." },
  { icon: Truck, title: "Reliable Delivery", desc: "Real-time order tracking from pickup to your door." },
  { icon: RotateCcw, title: "Easy Returns", desc: "Simple, transparent returns and replacement requests." },
  { icon: BadgePercent, title: "Fair Pricing", desc: "Transparent pricing with genuine seasonal deals." },
];

export function TrustSection() {
  return (
    <section className="border-y border-line bg-mist/60 py-16 md:py-24">
      <div className="container-content grid grid-cols-2 gap-8 md:grid-cols-4">
        {BENEFITS.map((b) => (
          <div key={b.title} className="flex flex-col items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-card">
              <b.icon className="h-5 w-5 text-nova-600" />
            </span>
            <h3 className="text-sm font-semibold text-ink">{b.title}</h3>
            <p className="text-xs text-graphite">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
