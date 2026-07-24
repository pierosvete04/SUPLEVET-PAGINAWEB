import { TIPOS_CONDICION_MEDICA, type CondicionMedica } from "@/lib/data/portal/mascotas";
import { formatFecha } from "@/lib/portal/formato";

const ICONO_TIPO: Record<CondicionMedica["tipo"], string> = {
  alergia: "warning",
  enfermedad_cronica: "monitor_heart",
  cirugia: "medical_information",
  otro: "healing",
};

interface CondicionesMedicasCardProps {
  condiciones: CondicionMedica[];
  // Cuando se pasan, la tarjeta se vuelve interactiva: aparece el botón
  // "Agregar" y cada fila se puede tocar para editarla. Sin estos props
  // (ficha pública, PDF) se muestra en modo solo lectura.
  onAgregar?: () => void;
  onEditar?: (index: number) => void;
}

// Tabla de condiciones médicas de la mascota (alergias, enfermedades crónicas,
// cirugías, otro) — usada tanto en el panel del cliente (interactiva) como en
// la ficha pública compartible (solo lectura), por eso es un componente sin
// estado propio ni "use client".
export function CondicionesMedicasCard({ condiciones, onAgregar, onEditar }: CondicionesMedicasCardProps) {
  if (condiciones.length === 0 && !onAgregar) return null;

  return (
    <div className="mt-4 rounded-[17px] border border-portal-error/20 bg-red-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-portal-navy">
          <span className="material-symbols-rounded text-[16px] text-portal-error">healing</span>
          Condiciones médicas
        </div>
        {onAgregar && (
          <button
            type="button"
            onClick={onAgregar}
            className="flex items-center gap-1 text-xs font-bold text-portal-error hover:text-portal-error/80"
          >
            <span className="material-symbols-rounded text-[16px]">add_circle</span> Agregar
          </button>
        )}
      </div>

      {condiciones.length === 0 ? (
        <p className="text-xs text-portal-muted">Sin condiciones registradas.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {condiciones.map((c, i) => {
            const Contenedor = onEditar ? "button" : "div";
            return (
              <Contenedor
                key={i}
                type={onEditar ? "button" : undefined}
                onClick={onEditar ? () => onEditar(i) : undefined}
                className={`flex items-start gap-2 rounded-[12px] bg-white/70 p-2.5 text-left ${
                  onEditar ? "transition-colors hover:bg-white" : ""
                }`}
              >
                <span className="material-symbols-rounded mt-0.5 text-[16px] text-portal-error/80">
                  {ICONO_TIPO[c.tipo] ?? "healing"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-portal-error/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-portal-error">
                      {TIPOS_CONDICION_MEDICA[c.tipo] ?? "Otro"}
                    </span>
                    {c.fecha && <span className="text-[11px] text-portal-muted">{formatFecha(c.fecha)}</span>}
                  </div>
                  <p className="mt-1 text-sm text-portal-muted">{c.descripcion}</p>
                </div>
              </Contenedor>
            );
          })}
        </div>
      )}
    </div>
  );
}
