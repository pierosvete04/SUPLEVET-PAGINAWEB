import { Handshake } from "lucide-react";

export default function PortalAlianzasPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold leading-tight text-portal-navy md:text-5xl">Alianzas</h1>
        <p className="mt-2 text-sm text-portal-muted">Beneficios exclusivos con negocios aliados a Suplevet.</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-[18px] border border-portal-surface-variant bg-white p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-portal-orange/15">
          <Handshake className="h-8 w-8 text-portal-orange-dark" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-lg font-semibold text-portal-navy">Próximamente</h2>
        <p className="max-w-sm text-sm text-portal-muted">
          Estamos preparando alianzas con veterinarias aliadas para que accedas a descuentos exclusivos
          (baños, servicios y más) para tu mascota.
        </p>
      </div>
    </div>
  );
}
