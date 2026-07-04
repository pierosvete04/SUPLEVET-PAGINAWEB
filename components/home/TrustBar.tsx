import { Truck, Stethoscope, CreditCard } from "lucide-react";

const items = [
  { icon: Truck, label: "Envíos a todo el Perú" },
  { icon: Stethoscope, label: "Recomendado por especialistas" },
  { icon: CreditCard, label: "Múltiples métodos de pago" },
];

export function TrustBar() {
  return (
    <div className="border-b border-border bg-white py-6">
      <div className="mx-auto flex max-w-container flex-col items-center gap-4 px-mobile-margin text-center sm:flex-row sm:justify-around sm:text-left md:px-gutter">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-secondary">
            <Icon className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.75} />
            <span className="font-body text-sm font-bold">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
