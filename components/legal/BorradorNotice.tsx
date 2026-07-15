import { AlertTriangle } from "lucide-react";

// Aviso visible en paginas legales cuyo contenido es un borrador estandar
// (no un documento redactado/aprobado por el cliente o un abogado) — ver
// PLAN.md pendientes operativos. Se retira cuando el texto final este listo.
export function BorradorNotice() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-md border-2 border-dashed border-primary bg-primary/5 p-4">
      <AlertTriangle className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
      <p className="font-body text-xs text-secondary">
        <strong>Borrador pendiente de revisión legal.</strong> Este texto es una plantilla estándar
        basada en la Ley N.° 29733 de Protección de Datos Personales, generada mientras se redacta
        el contenido definitivo. No debe considerarse el documento final hasta su revisión por un
        abogado.
      </p>
    </div>
  );
}
