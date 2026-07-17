"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { acreditarPuntos } from "@/lib/data/portal/puntos";
import type { Mascota } from "@/lib/data/portal/mascotas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MascotaFormDialogProps {
  clienteId: string;
  mascota: Mascota | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onEliminada: () => void;
}

const ESPECIES: { valor: Mascota["especie"]; label: string; icono: string }[] = [
  { valor: "perro", label: "Perro", icono: "🐶" },
  { valor: "gato", label: "Gato", icono: "🐱" },
  { valor: "otro", label: "Otro", icono: "🐾" },
];

const GENEROS: { valor: NonNullable<Mascota["genero"]>; label: string; icono: string }[] = [
  { valor: "macho", label: "Macho", icono: "♂" },
  { valor: "hembra", label: "Hembra", icono: "♀" },
];

const REDES: { campo: "instagram_url" | "facebook_url" | "tiktok_url"; label: string; icono: string; placeholder: string }[] = [
  { campo: "instagram_url", label: "Instagram", icono: "/icons/social/instagram.png", placeholder: "instagram.com/tu_mascota" },
  { campo: "facebook_url", label: "Facebook", icono: "/icons/social/facebook.png", placeholder: "facebook.com/tu_mascota" },
  { campo: "tiktok_url", label: "TikTok", icono: "/icons/social/tiktok.png", placeholder: "tiktok.com/@tu_mascota" },
];

const VACIO = {
  nombre: "",
  especie: "perro" as Mascota["especie"],
  especie_otro: "",
  raza: "",
  fecha_nacimiento: "",
  peso_kg: "",
  genero: "" as "" | Mascota["genero"],
  historia: "",
  descripcion: "",
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
};

function CampoLabel({ htmlFor, icono, children }: { htmlFor?: string; icono: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-portal-muted"
    >
      <span className="material-symbols-rounded text-[14px] text-portal-orange">{icono}</span>
      {children}
    </label>
  );
}

export function MascotaFormDialog({
  clienteId,
  mascota,
  open,
  onClose,
  onSaved,
  onEliminada,
}: MascotaFormDialogProps) {
  const [form, setForm] = useState(VACIO);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      mascota
        ? {
            nombre: mascota.nombre,
            especie: mascota.especie,
            especie_otro: mascota.especie_otro ?? "",
            raza: mascota.raza ?? "",
            fecha_nacimiento: mascota.fecha_nacimiento ?? "",
            peso_kg: String(mascota.peso_kg ?? ""),
            genero: mascota.genero ?? "",
            historia: mascota.historia ?? "",
            descripcion: mascota.descripcion ?? "",
            instagram_url: mascota.instagram_url ?? "",
            facebook_url: mascota.facebook_url ?? "",
            tiktok_url: mascota.tiktok_url ?? "",
          }
        : VACIO
    );
    setFotoFile(null);
    setFotoPreview(mascota?.foto_url ?? null);
    setError(null);
  }, [open, mascota]);

  function handleFotoSeleccionada(file: File | null) {
    setFotoFile(file);
    setFotoPreview(file ? URL.createObjectURL(file) : mascota?.foto_url ?? null);
  }

  const emojiEspecie = form.especie === "gato" ? "🐱" : form.especie === "otro" ? "🐾" : "🐶";

  function normalizarUrl(valor: string): string | null {
    const limpio = valor.trim();
    if (!limpio) return null;
    return /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }
    const peso = parseFloat(form.peso_kg);
    if (!peso || peso <= 0) {
      setError("El peso es requerido");
      return;
    }
    setGuardando(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      nombre: form.nombre.trim(),
      especie: form.especie,
      especie_otro: form.especie === "otro" ? form.especie_otro.trim() || null : null,
      raza: form.raza.trim() || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      peso_kg: peso,
      genero: form.genero || null,
      historia: form.historia.trim() || null,
      descripcion: form.descripcion.trim() || null,
      instagram_url: normalizarUrl(form.instagram_url),
      facebook_url: normalizarUrl(form.facebook_url),
      tiktok_url: normalizarUrl(form.tiktok_url),
    };

    if (mascota) {
      const { error: updateError } = await supabase.from("mascotas").update(payload).eq("id", mascota.id);
      if (updateError) {
        setError(updateError.message);
        setGuardando(false);
        return;
      }
      if (fotoFile) await subirFoto(supabase, mascota.id, fotoFile);
    } else {
      const { data: existentes } = await supabase
        .from("mascotas")
        .select("id")
        .eq("cliente_id", clienteId);
      const orden = (existentes?.length ?? 0) + 1;

      const { data: nueva, error: insertError } = await supabase
        .from("mascotas")
        .insert({ ...payload, cliente_id: clienteId })
        .select("id")
        .single();
      if (insertError || !nueva) {
        setError(insertError?.message ?? "No se pudo guardar");
        setGuardando(false);
        return;
      }
      if (fotoFile) await subirFoto(supabase, nueva.id, fotoFile);

      const bono = orden === 1 ? 40 : orden <= 3 ? 20 : 0;
      if (bono > 0) {
        await acreditarPuntos(
          supabase,
          clienteId,
          orden === 1 ? "mascota_1" : "mascota_2_3",
          bono,
          `Registrar mascota: ${payload.nombre}`,
          null,
          nueva.id
        );
      }
    }

    setGuardando(false);
    onSaved();
  }

  async function subirFoto(supabase: ReturnType<typeof createClient>, mascotaId: string, file: File) {
    const path = `${clienteId}/${mascotaId}/profile.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("mascotas-fotos")
      .upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from("mascotas-fotos").getPublicUrl(path);
      await supabase.from("mascotas").update({ foto_url: data.publicUrl }).eq("id", mascotaId);
    }
  }

  async function handleEliminar() {
    if (!mascota) return;
    if (!confirm(`¿Eliminar a ${mascota.nombre}? Esta acción no se puede deshacer.`)) return;
    const supabase = createClient();
    const desvincular = { mascota_id: null };
    await Promise.all([
      supabase.from("suplepuntos_transacciones").update(desvincular).eq("mascota_id", mascota.id),
      supabase.from("mascota_eventos").delete().eq("mascota_id", mascota.id),
      supabase.from("posts").update(desvincular).eq("mascota_id", mascota.id),
      supabase.from("stories").update(desvincular).eq("mascota_id", mascota.id),
    ]);
    await supabase.from("mascotas").delete().eq("id", mascota.id);
    onEliminada();
  }

  const inputBase =
    "w-full rounded-2xl border border-portal-surface-variant bg-portal-surface-low/40 px-4 py-3 text-sm font-semibold text-portal-navy placeholder:font-normal placeholder:text-portal-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-portal-teal-light focus-visible:border-portal-teal-mid";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-3xl border-0 bg-white p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="font-display text-xl font-semibold text-portal-navy">
              {mascota ? `Editar a ${mascota.nombre}` : "Agregar mascota"}
            </DialogTitle>
            {mascota && (
              <button
                type="button"
                onClick={handleEliminar}
                className="flex items-center gap-1 rounded-[17px] px-2 py-1 text-xs font-semibold text-portal-error/70 hover:bg-red-50 hover:text-portal-error"
              >
                <span className="material-symbols-rounded text-[16px]">delete</span>
                Eliminar
              </button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleGuardar} className="flex flex-col gap-5">
          {/* Avatar + nombre — primero lo visual, para que el formulario se
              sienta como un perfil y no como una planilla de datos. */}
          <div className="flex flex-col items-center gap-3 pt-1">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-portal-surface-low bg-portal-surface-low shadow-sm">
              {fotoPreview ? (
                <Image src={fotoPreview} alt="" fill unoptimized className="object-cover" sizes="96px" />
              ) : (
                <span className="text-4xl">{emojiEspecie}</span>
              )}
              <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-portal-orange text-white shadow-md hover:bg-portal-orange-dark">
                <span className="material-symbols-rounded text-[16px]">photo_camera</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFotoSeleccionada(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div className="w-full max-w-[240px]">
              <Input
                id="mascota-nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Nombre de tu mascota"
                className="rounded-2xl border-transparent bg-transparent text-center font-display text-lg font-semibold text-portal-navy focus-visible:border-portal-teal-mid focus-visible:ring-2 focus-visible:ring-portal-teal-light"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <CampoLabel htmlFor="mascota-raza" icono="pets">
                Raza
              </CampoLabel>
              <Input
                id="mascota-raza"
                value={form.raza}
                onChange={(e) => setForm((f) => ({ ...f, raza: e.target.value }))}
                placeholder="Golden Retriever"
                className={inputBase}
              />
            </div>
            <div className="grid gap-1.5">
              <CampoLabel htmlFor="mascota-peso" icono="monitor_weight">
                Peso
              </CampoLabel>
              <div className="relative">
                <Input
                  id="mascota-peso"
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={form.peso_kg}
                  onChange={(e) => setForm((f) => ({ ...f, peso_kg: e.target.value }))}
                  className={`${inputBase} pr-9`}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-portal-muted">
                  kg
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-1.5">
            <CampoLabel htmlFor="mascota-fecha-nacimiento" icono="cake">
              Fecha de nacimiento
            </CampoLabel>
            <Input
              id="mascota-fecha-nacimiento"
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) => setForm((f) => ({ ...f, fecha_nacimiento: e.target.value }))}
              className={inputBase}
            />
          </div>

          <div className="grid gap-1.5">
            <CampoLabel icono="category">Especie</CampoLabel>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Especie">
              {ESPECIES.map(({ valor, label, icono }) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={form.especie === valor}
                  onClick={() => setForm((f) => ({ ...f, especie: valor }))}
                  className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border text-xs font-bold transition-all active:scale-95 ${
                    form.especie === valor
                      ? "border-portal-navy bg-portal-navy text-white shadow-md"
                      : "border-portal-surface-variant bg-portal-surface-low/40 text-portal-navy hover:bg-portal-surface-low"
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {icono}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {form.especie === "otro" && (
            <div className="grid gap-1.5">
              <CampoLabel htmlFor="mascota-especie-otro" icono="edit">
                ¿Qué especie?
              </CampoLabel>
              <Input
                id="mascota-especie-otro"
                value={form.especie_otro}
                onChange={(e) => setForm((f) => ({ ...f, especie_otro: e.target.value }))}
                className={inputBase}
              />
            </div>
          )}

          <div className="grid gap-1.5">
            <CampoLabel icono="wc">Género</CampoLabel>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Género">
              {GENEROS.map(({ valor, label, icono }) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={form.genero === valor}
                  onClick={() => setForm((f) => ({ ...f, genero: valor }))}
                  className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border text-xs font-bold transition-all active:scale-95 ${
                    form.genero === valor
                      ? "border-portal-navy bg-portal-navy text-white shadow-md"
                      : "border-portal-surface-variant bg-portal-surface-low/40 text-portal-navy hover:bg-portal-surface-low"
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {icono}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <CampoLabel htmlFor="mascota-descripcion" icono="auto_stories">
              Personalidad (opcional)
            </CampoLabel>
            <Textarea
              id="mascota-descripcion"
              rows={3}
              placeholder="Ej: juguetón, protector con la familia, le encanta el parque…"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              className="rounded-2xl border-portal-surface-variant bg-portal-surface-low/40 px-4 py-3 text-sm text-portal-navy placeholder:text-portal-muted focus-visible:ring-2 focus-visible:ring-portal-teal-light"
            />
          </div>

          <div className="grid gap-1.5">
            <CampoLabel htmlFor="mascota-historia" icono="healing">
              Condiciones médicas (opcional)
            </CampoLabel>
            <Textarea
              id="mascota-historia"
              rows={3}
              placeholder="Ej: alergia al pollo, displasia de cadera, cirugía en 2024…"
              value={form.historia}
              onChange={(e) => setForm((f) => ({ ...f, historia: e.target.value }))}
              className="rounded-2xl border-portal-surface-variant bg-portal-surface-low/40 px-4 py-3 text-sm text-portal-navy placeholder:text-portal-muted focus-visible:ring-2 focus-visible:ring-portal-teal-light"
            />
          </div>

          <div className="grid gap-1.5">
            <CampoLabel icono="share">Redes sociales de tu mascota (opcional)</CampoLabel>
            <div className="flex flex-col gap-2">
              {REDES.map(({ campo, label, icono, placeholder }) => (
                <div key={campo} className="relative">
                  <Image
                    src={icono}
                    alt=""
                    width={18}
                    height={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 rounded-[4px]"
                  />
                  <Input
                    id={`mascota-${campo}`}
                    value={form[campo]}
                    onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))}
                    placeholder={placeholder}
                    aria-label={label}
                    className={`${inputBase} pl-11`}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="font-body text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={guardando}
            className="h-12 w-full rounded-[17px] bg-portal-orange text-base font-semibold text-white shadow-md hover:bg-portal-orange-dark"
          >
            {guardando ? "Guardando…" : mascota ? "Guardar cambios" : "Agregar mascota"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
