import { Truck, Stethoscope, CreditCard, type LucideIcon } from "lucide-react";

// Textos de la barra — agrega, quita o edita libremente. Se repiten en bucle
// sin importar cuántos sean.
const items: { icon: LucideIcon; label: string }[] = [
  { icon: Truck, label: "Envíos a todo el Perú" },
  { icon: Stethoscope, label: "Recomendado por especialistas" },
  { icon: CreditCard, label: "Múltiples métodos de pago" },
];

// Velocidad del desplazamiento en segundos: más alto = más lento.
// Ajusta solo este número para cambiar la velocidad.
const DURACION_SEGUNDOS = 22;

export function TrustBar() {
  return (
    <div className="overflow-hidden border-b border-border bg-white py-5">
      <div
        className="flex w-max animate-marquee gap-16 hover:[animation-play-state:paused]"
        style={{ "--marquee-duration": `${DURACION_SEGUNDOS}s` } as React.CSSProperties}
      >
        {[...items, ...items].map(({ icon: Icon, label }, i) => (
          <div key={i} className="flex shrink-0 items-center gap-2 text-secondary">
            <Icon className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.75} />
            <span className="whitespace-nowrap font-body text-sm font-bold">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
