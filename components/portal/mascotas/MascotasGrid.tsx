"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Cat, Dog, PawPrint, Star } from "lucide-react";
import { calcularEdad } from "@/lib/portal/formato";
import type { Mascota } from "@/lib/data/portal/mascotas";
import { MascotaFormDialog } from "@/components/portal/mascotas/MascotaFormDialog";

interface MascotasGridProps {
  clienteId: string;
  mascotasIniciales: Mascota[];
  vacunaPendienteInicial: Record<string, boolean>;
}

const BENEFICIOS_REGISTRO = [
  {
    icono: "vaccines",
    texto: "Lleva sus vacunas y desparasitaciones al día, con aviso cuando se acerque la próxima.",
  },
  {
    icono: "qr_code_2",
    texto: "Genera su ficha con código QR para compartirla con veterinarios y paseadores.",
  },
  {
    icono: "star",
    texto: "Gana 40 SuplePoints al instante apenas termines de registrarla.",
  },
] as const;

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
  const [avisoFoto, setAvisoFoto] = useState<string | null>(null);

  return (
    <div>
      {avisoFoto && (
        <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-portal-orange/30 bg-portal-orange/10 p-4 text-sm text-portal-navy">
          <p>{avisoFoto}</p>
          <button
            type="button"
            onClick={() => setAvisoFoto(null)}
            aria-label="Cerrar aviso"
            className="shrink-0 text-portal-muted hover:text-portal-navy"
          >
            <span className="material-symbols-rounded text-[18px]">close</span>
          </button>
        </div>
      )}

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
        <div className="relative overflow-hidden rounded-[10px] border border-portal-surface-variant bg-white px-6 py-12 text-center sm:px-10 sm:py-16">
          <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-portal-orange/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full bg-portal-teal-light/20 blur-3xl" />

          <div className="relative mx-auto max-w-md">
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-portal-orange/15 via-portal-teal-light/20 to-portal-teal-mid/15">
              <PawPrint className="h-9 w-9 text-portal-orange" strokeWidth={1.5} />
              <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-portal-teal-mid text-white shadow-sm">
                <Star className="h-3.5 w-3.5 fill-white" strokeWidth={0} />
              </span>
            </div>

            <h3 className="font-display text-2xl font-semibold text-portal-navy">
              Dale la bienvenida a tu primera mascota
            </h3>
            <p className="mt-2 text-sm text-portal-muted">
              Regístrala en menos de un minuto y empieza a aprovechar todo lo que el portal tiene para ella.
            </p>

            <ul className="mt-6 space-y-3 text-left">
              {BENEFICIOS_REGISTRO.map((beneficio) => (
                <li
                  key={beneficio.icono}
                  className="flex items-start gap-3 rounded-[10px] bg-portal-surface-low/60 p-3"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-portal-orange shadow-sm">
                    <span className="material-symbols-rounded text-[18px]">{beneficio.icono}</span>
                  </span>
                  <span className="text-sm text-portal-navy">{beneficio.texto}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                setMascotaEditar(null);
                setFormAbierto(true);
              }}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-[17px] bg-portal-navy-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-portal-navy sm:w-auto"
            >
              <span className="material-symbols-rounded text-[20px]">add</span>
              Registrar primera mascota
            </button>
          </div>
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
        onSaved={(mascotaGuardada, fotoFallo) => {
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
          setAvisoFoto(
            fotoFallo
              ? `Guardamos a ${mascotaGuardada.nombre}, pero no pudimos subir la foto. Vuelve a intentarlo editándola.`
              : null
          );
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
