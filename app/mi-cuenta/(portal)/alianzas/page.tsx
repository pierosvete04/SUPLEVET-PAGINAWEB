import { Handshake } from "lucide-react";

export default function PortalAlianzasPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] bg-white p-12 text-center shadow-sm">
      <Handshake className="h-10 w-10 text-secondary" strokeWidth={1.5} />
      <h2 className="font-display text-lg font-bold text-secondary">Próximamente</h2>
      <p className="max-w-sm font-body text-sm text-muted-foreground">
        Estamos preparando alianzas con veterinarias aliadas para que accedas a descuentos exclusivos
        (baños, servicios y más) para tu mascota.
      </p>
    </div>
  );
}
