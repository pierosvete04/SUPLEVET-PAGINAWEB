"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Cabecera + botón de guardado comunes a las subsecciones de configuración.
// El botón vive acá y no en cada página para que "Guardar cambios" esté siempre
// en el mismo sitio y con el mismo texto, sin importar en cuál estés.
export function ConfiguracionSeccion({
  titulo,
  descripcion,
  guardando,
  onGuardar,
  children,
}: {
  titulo: string;
  descripcion?: string;
  guardando: boolean;
  onGuardar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">{titulo}</h2>
        {descripcion && <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>}
      </div>

      {children}

      <div>
        <Button onClick={onGuardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

/** Campo de texto etiquetado — mismo componente que usaba la configuración
 *  cuando era una sola página, movido acá para compartirlo entre subsecciones. */
export function Campo({
  id,
  label,
  value,
  onChange,
  textarea = false,
  ayuda,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  ayuda?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {textarea ? (
        <Textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
    </div>
  );
}
