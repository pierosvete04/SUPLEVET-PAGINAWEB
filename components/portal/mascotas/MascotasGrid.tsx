"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Cat, Dog, PawPrint } from "lucide-react";
import { calcularEdad } from "@/lib/portal/formato";
import type { Mascota } from "@/lib/data/portal/mascotas";
import { MascotaFormDialog } from "@/components/portal/mascotas/MascotaFormDialog";

interface MascotasGridProps {
  clienteId: string;
  mascotasIniciales: Mascota[];
  vacunaPendienteInicial: Record<string, boolean>;
}

// Recibe la lista y el estado de vacunas ya resueltos por el servidor (ver
// app/mi-cuenta/(portal)/mascotas/page.tsx) — el estado local solo existe
// para las actualizaciones optimistas al guardar/eliminar una mascota, ya no
// para la carga inicial (antes mostraba un loader de pantalla completa en
// cada visita mientras repetía esta misma consulta desde el cliente).
export function MascotasGrid({ clienteId, mascotasIniciales, vacunaPendienteInicial }: MascotasGridProps) {
  const [mascotas, setMascotas] = useState<Mascota[]>(mascotasIniciales);
  const vacunaPendiente = vacunaPendienteInicial;
  const [formAbierto, setFormAbierto] = useState(false);
  const [mascotaEditar, setMascotaEditar] = useState<Mascota | null>(null);

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-portal-navy md:text-5xl">
            Mis Mascotas
          </h1>
          <p className="mt-2 text-sm text-portal-muted">Gestiona el bienestar de tus compañeros favoritos.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMascotaEditar(null);
            setFormAbierto(true);
          }}
          className="flex items-center gap-2 rounded-[17px] bg-portal-navy-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-portal-navy"
        >
          <span className="material-symbols-rounded text-[20px]">add</span> Añadir mascota
        </button>
      </div>

      {mascotas.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-portal-surface-variant bg-white py-16 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-portal-surface-low text-portal-muted">
            <PawPrint className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-2xl font-semibold text-portal-navy">Aún no tienes mascotas</h3>
          <p className="mt-2 text-portal-muted">Registra a tu compañero y gana 40 SuplePoints.</p>
          <button
            type="button"
            onClick={() => {
              setMascotaEditar(null);
              setFormAbierto(true);
            }}
            className="mt-4 rounded-[17px] bg-portal-navy-dark px-6 py-2 text-white"
          >
            Registrar primera mascota
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {mascotas.map((m) => {
            const edad = m.fecha_nacimiento ? calcularEdad(m.fecha_nacimiento) : null;
            const pendiente = vacunaPendiente[m.id];
            return (
              <Link
                key={m.id}
                href={`/mi-cuenta/mascotas/${m.id}`}
                className="portal-pet-card cursor-pointer overflow-hidden !p-0 text-left"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-t-[24px] bg-portal-surface-low">
                  {m.foto_url ? (
                    <Image src={m.foto_url} alt={m.nombre} fill className="object-cover" sizes="300px" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-portal-muted">
                      {m.especie === "gato" ? (
                        <Cat className="h-12 w-12" strokeWidth={1.5} />
                      ) : (
                        <Dog className="h-12 w-12" strokeWidth={1.5} />
                      )}
                    </span>
                  )}
                  {pendiente && (
                    <div className="portal-health-indicator" title="Vacuna pendiente">
                      <span className="material-symbols-rounded text-[12px] text-white">vaccines</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="mb-1 font-display text-lg font-semibold text-portal-navy">{m.nombre}</h4>
                  <p className="mb-3 text-xs text-portal-muted">
                    {[m.raza, edad].filter(Boolean).join(" • ")}
                  </p>
                  {pendiente ? (
                    <div className="flex w-full items-center justify-center gap-1 rounded-lg bg-portal-surface-low py-1.5 text-xs font-semibold text-portal-navy">
                      <span className="material-symbols-rounded text-[14px] text-portal-error">warning</span>
                      Vacuna pendiente
                    </div>
                  ) : (
                    <div className="flex w-full items-center justify-center gap-1 rounded-lg bg-portal-teal-light/20 py-1.5 text-xs font-semibold text-portal-teal-mid">
                      <span className="material-symbols-rounded text-[14px]">check_circle</span>
                      Al día
                    </div>
                  )}
                </div>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setMascotaEditar(null);
              setFormAbierto(true);
            }}
            className="portal-pet-card flex min-h-[200px] cursor-pointer flex-col items-center justify-center border-2 border-dashed border-portal-surface-variant bg-portal-surface-low/40 hover:bg-portal-surface-low"
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-portal-surface-variant">
              <span className="material-symbols-rounded text-2xl text-portal-muted">add</span>
            </div>
            <span className="text-sm font-semibold text-portal-navy">Añadir mascota</span>
          </button>
        </div>
      )}

      <MascotaFormDialog
        clienteId={clienteId}
        mascota={mascotaEditar}
        open={formAbierto}
        onClose={() => setFormAbierto(false)}
        onSaved={(mascotaGuardada) => {
          setFormAbierto(false);
          // Actualiza el estado local con la fila ya guardada en vez de
          // volver a consultar Supabase: evita el "tengo que refrescar para
          // que aparezca guardada" (la mascota nueva/editada aparece de
          // inmediato, sin depender de un segundo round-trip).
          setMascotas((actuales) => {
            const existe = actuales.some((m) => m.id === mascotaGuardada.id);
            return existe
              ? actuales.map((m) => (m.id === mascotaGuardada.id ? mascotaGuardada : m))
              : [...actuales, mascotaGuardada];
          });
        }}
        onEliminada={() => {
          setFormAbierto(false);
          if (mascotaEditar) {
            setMascotas((actuales) => actuales.filter((m) => m.id !== mascotaEditar.id));
          }
        }}
      />
    </div>
  );
}
