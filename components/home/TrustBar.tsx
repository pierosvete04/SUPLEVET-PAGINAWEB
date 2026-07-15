import { Truck, Stethoscope, CreditCard, type LucideIcon } from "lucide-react";

// Los íconos quedan fijos en código (uno por posición); el texto de cada uno
// se edita desde /admin/configuracion → "Barra de confianza".
const ICONOS: LucideIcon[] = [Truck, Stethoscope, CreditCard];

// Velocidad del desplazamiento en segundos: más alto = más lento.
// Ajusta solo este número para cambiar la velocidad.
const DURACION_SEGUNDOS = 60;

// Con solo 2 copias del set y translateX(-50%), el bucle se "corta" y deja un
// hueco en blanco en pantallas anchas si el set original es más angosto que
// el viewport (el truco de -50% solo es perfecto cuando 1 set >= ancho de
// pantalla). Repetimos el set varias veces y ajustamos la distancia a
// -100/REPETICIONES% — la velocidad real (px/seg) no cambia, solo se vuelve
// robusto para monitores anchos.
const REPETICIONES = 8;
const MARQUEE_DISTANCE = `-${100 / REPETICIONES}%`;

interface TrustBarProps {
  textos: string[];
}

export function TrustBar({ textos }: TrustBarProps) {
  const items = textos.map((label, i) => ({ icon: ICONOS[i] ?? Truck, label }));

  return (
    <div className="overflow-hidden border-b border-border bg-white py-5">
      <div
        className="flex w-max animate-marquee gap-16 hover:[animation-play-state:paused]"
        style={
          {
            "--marquee-duration": `${DURACION_SEGUNDOS}s`,
            "--marquee-distance": MARQUEE_DISTANCE,
          } as React.CSSProperties
        }
      >
        {Array.from({ length: REPETICIONES }, () => items)
          .flat()
          .map(({ icon: Icon, label }, i) => (
          <div key={i} className="flex shrink-0 items-center gap-2.5 text-secondary">
            <Icon className="h-6 w-6 shrink-0 text-accent md:h-7 md:w-7" strokeWidth={1.75} />
            <span className="whitespace-nowrap font-body text-base font-bold md:text-lg">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
