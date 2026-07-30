"use client";

import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import Image from "next/image";
import { Dog, Cat, PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadPortalFileToR2 } from "@/lib/uploadToR2";
import { acreditarPuntos } from "@/lib/data/portal/puntos";
import { COLORES_MASCOTA, type Familiar, type Mascota } from "@/lib/data/portal/mascotas";
import { useRazasSugeridas } from "@/lib/portal/useRazasSugeridas";
import { BreedCombobox } from "@/components/portal/mascotas/BreedCombobox";
import { MaleIcon, FemaleIcon } from "@/components/portal/icons/GenderIcons";
import { CampoLabel } from "@/components/portal/CampoLabel";
import { SOMBRA_CAJA, SOMBRA_TARJETA, SOMBRA_FLOTANTE, campoBase, inputBase } from "@/lib/portal/formTokens";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MascotaFormDialogProps {
  clienteId: string;
  mascota: Mascota | null;
  open: boolean;
  onClose: () => void;
  /** `fotoFallo` es true si el usuario eligió una foto pero la subida a R2 falló (ej. CORS) — la mascota igual se guarda. */
  onSaved: (mascota: Mascota, fotoFallo?: boolean) => void;
  onEliminada: () => void;
}

type IconoComponente = ComponentType<SVGProps<SVGSVGElement>>;

const ESPECIES: { valor: Mascota["especie"]; label: string; Icono: IconoComponente }[] = [
  { valor: "perro", label: "Perro", Icono: Dog },
  { valor: "gato", label: "Gato", Icono: Cat },
  { valor: "otro", label: "Otro", Icono: PawPrint },
];

const GENEROS: { valor: NonNullable<Mascota["genero"]>; label: string; Icono: IconoComponente }[] = [
  { valor: "macho", label: "Macho", Icono: MaleIcon },
  { valor: "hembra", label: "Hembra", Icono: FemaleIcon },
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
  familiares: [] as Familiar[],
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
  color_primario: "",
  color_secundario: "",
  color_etiqueta: "",
};

const PRESETS_NEUTROS = [
  { label: "Blanco", valor: "#ffffff" },
  { label: "Navy oscuro", valor: "#1e3a5f" },
];

// Rasgos sugeridos para armar "descripcion" como chips en vez de texto libre.
// Los que el usuario escribe a mano vía "Agregar más" se suman a esta lista
// de opciones visibles (y desaparecen si los vuelve a deseleccionar).
const RASGOS_PERSONALIDAD_BASE = [
  "Juguetón",
  "Hiperactivo",
  "Dormilón",
  "Cariñoso",
  "Tranquilo",
  "Protector",
  "Curioso",
  "Sociable",
];

const RELACIONES_FAMILIAR = [
  "Papá",
  "Mamá",
  "Hermano",
  "Hermana",
  "Abuelo",
  "Abuela",
  "Tío",
  "Tía",
  "Primo",
  "Prima",
  "Otro",
];

function SelectorColor({
  valor,
  onChange,
  presets,
}: {
  valor: string;
  onChange: (valor: string) => void;
  presets: { label: string; valor: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map(({ label, valor: v }) => (
        <button
          key={v}
          type="button"
          aria-label={label}
          aria-pressed={valor === v}
          onClick={() => onChange(v)}
          className={`h-7 w-7 shrink-0 rounded-full border-2 transition-transform active:scale-90 ${
            valor === v ? "scale-110 border-portal-navy shadow-md" : "border-white shadow-sm hover:scale-105"
          }`}
          style={{ backgroundColor: v }}
        />
      ))}
      <BotonColorPersonalizado valor={valor} onChange={onChange} label="Color personalizado" />
    </div>
  );
}

// El <input type="color"> nativo siempre pinta su swatch como un cuadrado
// (::-webkit-color-swatch no respeta border-radius del input contenedor), así
// que en vez de mostrar ese cuadrado dentro de un botón circular, lo dejamos
// invisible (opacity-0) sobre un botón "+" — el input sigue siendo el que
// abre el selector de color nativo al hacer clic.
function BotonColorPersonalizado({
  valor,
  onChange,
  label,
}: {
  valor: string;
  onChange: (valor: string) => void;
  label: string;
}) {
  return (
    <label
      title={label}
      className="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-portal-surface-variant text-portal-muted transition-colors hover:border-portal-teal-mid hover:text-portal-teal-mid"
    >
      <span className="material-symbols-rounded text-[16px]" aria-hidden="true">
        add
      </span>
      <input
        type="color"
        aria-label={label}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer rounded-full opacity-0"
      />
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
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [personalidadTags, setPersonalidadTags] = useState<string[]>([]);
  const [agregandoRasgo, setAgregandoRasgo] = useState(false);
  const [nuevoRasgo, setNuevoRasgo] = useState("");
  const razasSugeridas = useRazasSugeridas(open ? form.especie : "otro");

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
            familiares: mascota.familiares ?? [],
            instagram_url: mascota.instagram_url ?? "",
            facebook_url: mascota.facebook_url ?? "",
            tiktok_url: mascota.tiktok_url ?? "",
            color_primario: mascota.color_primario ?? "",
            color_secundario: mascota.color_secundario ?? "",
            color_etiqueta: mascota.color_etiqueta ?? "",
          }
        : VACIO
    );
    setPersonalidadTags(
      mascota?.descripcion
        ? mascota.descripcion
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : []
    );
    setAgregandoRasgo(false);
    setNuevoRasgo("");
    setFotoFile(null);
    setFotoPreview(mascota?.foto_url ?? null);
    setError(null);
  }, [open, mascota]);

  function alternarRasgo(rasgo: string) {
    setPersonalidadTags((tags) => (tags.includes(rasgo) ? tags.filter((t) => t !== rasgo) : [...tags, rasgo]));
  }

  function confirmarRasgoPersonalizado() {
    const valor = nuevoRasgo.trim();
    if (valor && !personalidadTags.includes(valor)) {
      setPersonalidadTags((tags) => [...tags, valor]);
    }
    setNuevoRasgo("");
    setAgregandoRasgo(false);
  }

  function handleFotoSeleccionada(file: File | null) {
    setFotoFile(file);
    setFotoPreview(file ? URL.createObjectURL(file) : mascota?.foto_url ?? null);
  }

  const IconoEspecie = form.especie === "gato" ? Cat : form.especie === "otro" ? PawPrint : Dog;

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
      descripcion: personalidadTags.length > 0 ? personalidadTags.join(", ") : null,
      familiares: form.familiares
        .map((f) => ({ relacion: f.relacion.trim(), nombre: f.nombre.trim() }))
        .filter((f) => f.relacion && f.nombre),
      instagram_url: normalizarUrl(form.instagram_url),
      facebook_url: normalizarUrl(form.facebook_url),
      tiktok_url: normalizarUrl(form.tiktok_url),
      color_primario: form.color_primario || null,
      color_secundario: form.color_secundario || null,
      // La tipografía/color de letra ya no es editable desde este formulario;
      // se conserva el valor que la mascota ya tuviera en vez de sobrescribirlo.
      color_texto: mascota?.color_texto ?? null,
      color_etiqueta: form.color_etiqueta || null,
    };

    if (mascota) {
      const { data: actualizada, error: updateError } = await supabase
        .from("mascotas")
        .update(payload)
        .eq("id", mascota.id)
        .select()
        .single();
      if (updateError || !actualizada) {
        setError("No pudimos guardar los cambios. Puede ser tu conexión — inténtalo de nuevo en unos segundos.");
        setGuardando(false);
        return;
      }
      const fotoUrl = fotoFile ? await subirFoto(supabase, mascota.id, fotoFile) : actualizada.foto_url;
      setGuardando(false);
      onSaved({ ...actualizada, foto_url: fotoUrl } as Mascota, !!fotoFile && !fotoUrl);
    } else {
      const { data: existentes } = await supabase
        .from("mascotas")
        .select("id")
        .eq("cliente_id", clienteId);
      const orden = (existentes?.length ?? 0) + 1;

      const { data: nueva, error: insertError } = await supabase
        .from("mascotas")
        .insert({ ...payload, cliente_id: clienteId })
        .select()
        .single();
      if (insertError || !nueva) {
        setError("No pudimos registrar a tu mascota. Puede ser tu conexión — inténtalo de nuevo en unos segundos.");
        setGuardando(false);
        return;
      }
      const fotoUrl = fotoFile ? await subirFoto(supabase, nueva.id, fotoFile) : nueva.foto_url;

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

      setGuardando(false);
      onSaved({ ...nueva, foto_url: fotoUrl } as Mascota, !!fotoFile && !fotoUrl);
    }
  }

  // Devuelve la URL ya subida en vez de que el caller vuelva a leer la fila de
  // la base de datos: MascotasGrid actualiza su estado local con este valor
  // directamente, así la foto aparece de inmediato en vez de depender de un
  // refetch que a veces corría antes de que esta subida terminara.
  async function subirFoto(
    supabase: ReturnType<typeof createClient>,
    mascotaId: string,
    file: File
  ): Promise<string | null> {
    const url = await uploadPortalFileToR2("mascotas-fotos", file, `${clienteId}/${mascotaId}`);
    if (url) {
      await supabase.from("mascotas").update({ foto_url: url }).eq("id", mascotaId);
    }
    return url;
  }

  async function handleEliminar() {
    if (!mascota) return;
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

  // Color de portada — customizable (sección "1. Color de portada" más abajo).
  // Se reutiliza tanto en la banda superior del formulario como en la vista
  // previa, para que ambas reflejen el mismo color/degradado en vivo.
  const colorPortadaFondo = form.color_primario
    ? form.color_secundario
      ? `linear-gradient(135deg, ${form.color_primario}, ${form.color_secundario})`
      : form.color_primario
    : "linear-gradient(135deg, var(--portal-navy), var(--portal-navy-dark))";

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-[18px] sm:rounded-[18px] border-0 bg-white p-0 shadow-2xl">
        {/* El título sigue existiendo para accesibilidad (lectores de pantalla),
            pero visualmente la portada rosa reemplaza al header de diálogo clásico. */}
        <DialogHeader className="sr-only">
          <DialogTitle>{mascota ? `Editar a ${mascota.nombre}` : "Agregar mascota"}</DialogTitle>
        </DialogHeader>

        {/* Portada + foto + nombre flotante — replica el layout del Figma:
            banda con esquinas redondeadas arriba (color de portada
            personalizable, en vivo), foto circular superpuesta al borde
            inferior, y una cápsula blanca con el nombre flotando sobre esa
            unión. */}
        <div className="relative h-28 shrink-0 rounded-t-[18px]" style={{ background: colorPortadaFondo }}>
          {mascota && (
            <button
              type="button"
              onClick={() => setConfirmandoEliminar(true)}
              className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-portal-error/80 backdrop-blur-sm hover:bg-white hover:text-portal-error"
            >
              <span className="material-symbols-rounded text-[15px]">delete</span>
              Eliminar
            </button>
          )}
        </div>

        <form onSubmit={handleGuardar} className="flex flex-col gap-5 px-6 pb-6">
          <div className="flex flex-col items-center gap-3 -mt-12">
            {/* El botón de cámara vive fuera del círculo con overflow-hidden:
                si estuviera dentro, el recorte circular le cortaba la esquina
                (bottom-right cae fuera del círculo inscrito en el cuadrado). */}
            <div className="relative h-24 w-24 shrink-0">
              <div
                className={`relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-portal-surface-low ${SOMBRA_FLOTANTE}`}
              >
                {fotoPreview ? (
                  <Image src={fotoPreview} alt="" fill unoptimized className="object-cover" sizes="96px" />
                ) : (
                  <IconoEspecie className="h-10 w-10 text-portal-muted" strokeWidth={1.5} />
                )}
              </div>
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
            <div className={`rounded-full bg-white px-2 ${SOMBRA_FLOTANTE}`}>
              <Input
                id="mascota-nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Nombre de tu mascota"
                className="w-48 border-0 bg-transparent text-center font-display text-lg font-semibold text-portal-navy shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <CampoLabel icono="category">Especie</CampoLabel>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Especie">
              {ESPECIES.map(({ valor, label, Icono }) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={form.especie === valor}
                  // Al elegir "otro" ya no aplica una raza definida, así que
                  // se limpia para no arrastrar (y guardar) un valor oculto.
                  onClick={() => setForm((f) => ({ ...f, especie: valor, raza: valor === "otro" ? "" : f.raza }))}
                  className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                    form.especie === valor
                      ? `bg-portal-navy text-white ${SOMBRA_TARJETA}`
                      : `bg-portal-surface-low/60 text-portal-navy ${SOMBRA_CAJA} hover:bg-portal-surface-low`
                  }`}
                >
                  <Icono className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
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

          {/* Con especie "otro" la raza no aplica (no hay catálogo de razas
              para una especie sin definir), así que ese campo se oculta por
              completo y el peso pasa a ocupar todo el ancho. */}
          <div className={form.especie === "otro" ? "grid gap-3" : "grid grid-cols-2 gap-3"}>
            {form.especie !== "otro" && (
              <div className="grid gap-1.5">
                <CampoLabel htmlFor="mascota-raza" icono="pets">
                  Raza
                </CampoLabel>
                <BreedCombobox
                  id="mascota-raza"
                  value={form.raza}
                  onChange={(valor) => setForm((f) => ({ ...f, raza: valor }))}
                  opciones={razasSugeridas}
                  placeholder="Golden Retriever"
                  className={inputBase}
                />
              </div>
            )}
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
            <CampoLabel icono="wc">Género</CampoLabel>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Género">
              {GENEROS.map(({ valor, label, Icono }) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={form.genero === valor}
                  onClick={() => setForm((f) => ({ ...f, genero: valor }))}
                  className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                    form.genero === valor
                      ? `bg-portal-navy text-white ${SOMBRA_TARJETA}`
                      : `bg-portal-surface-low/60 text-portal-navy ${SOMBRA_CAJA} hover:bg-portal-surface-low`
                  }`}
                >
                  <Icono className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <CampoLabel icono="diversity_3">Familiares (opcional)</CampoLabel>
            <p className="text-xs text-portal-muted">Papá, mamá, hermanos… tú eliges la relación.</p>
            <div className="flex flex-col gap-2">
              {form.familiares.map((familiar, i) => {
                const esRelacionLibre = familiar.relacion !== "" && !RELACIONES_FAMILIAR.includes(familiar.relacion);
                const valorSelect = familiar.relacion === "" ? "" : esRelacionLibre ? "Otro" : familiar.relacion;
                return (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={valorSelect}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            familiares: f.familiares.map((fam, j) => (j === i ? { ...fam, relacion: e.target.value } : fam)),
                          }))
                        }
                        className={`${campoBase} w-auto max-w-[130px] shrink-0`}
                      >
                        <option value="" disabled>
                          Relación
                        </option>
                        {RELACIONES_FAMILIAR.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={familiar.nombre}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            familiares: f.familiares.map((fam, j) => (j === i ? { ...fam, nombre: e.target.value } : fam)),
                          }))
                        }
                        placeholder="Nombre"
                        className={`${inputBase} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, familiares: f.familiares.filter((_, j) => j !== i) }))}
                        aria-label="Quitar familiar"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-portal-muted hover:bg-red-50 hover:text-portal-error"
                      >
                        <span className="material-symbols-rounded text-[18px]">close</span>
                      </button>
                    </div>
                    {valorSelect === "Otro" && (
                      <Input
                        value={esRelacionLibre ? familiar.relacion : ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            familiares: f.familiares.map((fam, j) => (j === i ? { ...fam, relacion: e.target.value } : fam)),
                          }))
                        }
                        placeholder="Especifica la relación (ej: padrino, cuidador…)"
                        className={inputBase}
                      />
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, familiares: [...f.familiares, { relacion: "", nombre: "" }] }))}
                className={`flex items-center justify-center gap-1 rounded-2xl bg-portal-surface-low/60 py-2 text-xs font-semibold text-portal-muted transition-colors ${SOMBRA_CAJA} hover:text-portal-teal-mid`}
              >
                <span className="material-symbols-rounded text-[16px]">add</span> Agregar familiar
              </button>
            </div>
          </div>

          <div className="grid gap-1.5">
            <CampoLabel icono="auto_stories">Personalidad (opcional)</CampoLabel>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([...RASGOS_PERSONALIDAD_BASE, ...personalidadTags])).map((rasgo) => {
                const activo = personalidadTags.includes(rasgo);
                return (
                  <button
                    key={rasgo}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => alternarRasgo(rasgo)}
                    className={`rounded-full px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                      activo
                        ? `bg-portal-navy text-white ${SOMBRA_TARJETA}`
                        : `bg-portal-surface-low/60 text-portal-navy ${SOMBRA_CAJA} hover:bg-portal-surface-low`
                    }`}
                  >
                    {rasgo}
                  </button>
                );
              })}
              {agregandoRasgo ? (
                <input
                  autoFocus
                  value={nuevoRasgo}
                  onChange={(e) => setNuevoRasgo(e.target.value)}
                  onBlur={confirmarRasgoPersonalizado}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      confirmarRasgoPersonalizado();
                    }
                    if (e.key === "Escape") {
                      setNuevoRasgo("");
                      setAgregandoRasgo(false);
                    }
                  }}
                  placeholder="Escribe y presiona Enter"
                  className={`rounded-full bg-portal-surface-low/60 px-3.5 py-2 text-xs font-semibold text-portal-navy placeholder:font-normal placeholder:text-portal-muted ${SOMBRA_CAJA} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-portal-teal-light`}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setAgregandoRasgo(true)}
                  className={`flex items-center gap-1 rounded-full bg-portal-surface-low/60 px-3.5 py-2 text-xs font-semibold text-portal-muted transition-colors ${SOMBRA_CAJA} hover:text-portal-teal-mid`}
                >
                  <span className="material-symbols-rounded text-[16px]">add</span> Agregar más
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <CampoLabel icono="palette">Personaliza su perfil</CampoLabel>
              {(form.color_primario || form.color_etiqueta) && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color_primario: "", color_secundario: "", color_etiqueta: "" }))}
                  className="text-xs font-semibold text-portal-muted underline-offset-2 hover:text-portal-error hover:underline"
                >
                  Restablecer todo
                </button>
              )}
            </div>

            {/* Vista previa en vivo — mismo color/degradado de portada que la
                banda superior, más el color de etiquetas sobre texto blanco
                (la tipografía ya no es personalizable desde este formulario). */}
            <div
              className={`flex h-16 w-full items-center gap-2 rounded-2xl px-4 text-white transition-colors ${SOMBRA_TARJETA}`}
              style={{ background: colorPortadaFondo }}
            >
              <span className="font-display text-base font-semibold">{form.nombre || "Vista previa"}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{
                  color: form.color_etiqueta || "#ffffff",
                  backgroundColor: `color-mix(in srgb, ${form.color_etiqueta || "#ffffff"} 20%, transparent)`,
                }}
              >
                Activo
              </span>
            </div>

            <span className="text-xs font-bold text-portal-navy">Colores</span>
            {/* Grid 2 columnas: portada y etiquetas — ambas personalizables.
                El color de letra ya no se edita aquí. */}
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Portada */}
              <div className={`grid gap-1.5 rounded-2xl bg-white p-3 ${SOMBRA_TARJETA}`}>
                <span className="text-xs font-bold text-portal-navy">1. Color de portada</span>
                <p className="text-xs text-portal-muted">El fondo de la tarjeta.</p>
                <div className="flex flex-wrap items-center gap-2">
                  {COLORES_MASCOTA.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Elegir color ${color}`}
                      aria-pressed={form.color_primario === color}
                      onClick={() => setForm((f) => ({ ...f, color_primario: color }))}
                      className={`h-7 w-7 shrink-0 rounded-full border-2 transition-transform active:scale-90 ${
                        form.color_primario === color ? "scale-110 border-portal-navy shadow-md" : "border-white shadow-sm hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <BotonColorPersonalizado
                    valor={form.color_primario || "#1e3a5f"}
                    onChange={(valor) => setForm((f) => ({ ...f, color_primario: valor }))}
                    label="Color de portada personalizado"
                  />
                </div>
                {form.color_primario && (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-portal-muted">Degradado con:</span>
                      {COLORES_MASCOTA.filter((c) => c !== form.color_primario).map((color) => (
                        <button
                          key={color}
                          type="button"
                          aria-label={`Degradado hacia ${color}`}
                          aria-pressed={form.color_secundario === color}
                          onClick={() =>
                            setForm((f) => ({ ...f, color_secundario: f.color_secundario === color ? "" : color }))
                          }
                          className={`h-6 w-6 shrink-0 rounded-full border-2 transition-transform active:scale-90 ${
                            form.color_secundario === color ? "scale-110 border-portal-navy shadow-md" : "border-white shadow-sm hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color_primario: "", color_secundario: "" }))}
                      className="justify-self-start text-xs font-semibold text-portal-muted underline-offset-2 hover:text-portal-error hover:underline"
                    >
                      Quitar
                    </button>
                  </>
                )}
              </div>

              {/* 2. Etiquetas */}
              <div className={`grid gap-1.5 rounded-2xl bg-white p-3 ${SOMBRA_TARJETA}`}>
                <span className="text-xs font-bold text-portal-navy">2. Color de etiquetas</span>
                <p className="text-xs text-portal-muted">La insignia “Activo”, el peso y el cumpleaños.</p>
                <SelectorColor
                  valor={form.color_etiqueta || "#ffffff"}
                  onChange={(valor) => setForm((f) => ({ ...f, color_etiqueta: valor }))}
                  presets={[...PRESETS_NEUTROS, ...COLORES_MASCOTA.map((c) => ({ label: c, valor: c }))]}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-1.5">
            <CampoLabel icono="share">Añade las redes sociales de tu mascota (opcional)</CampoLabel>
            <div className="flex flex-col gap-2">
              {REDES.map(({ campo, label, icono, placeholder }) => (
                <div
                  key={campo}
                  className={`flex items-center gap-3 rounded-full bg-portal-navy py-2.5 pl-4 pr-4 ${SOMBRA_TARJETA}`}
                >
                  {/* Ícono en blanco sólido vía CSS mask sobre el PNG: sin
                      círculo de fondo, solo la silueta recortando el color
                      blanco directamente contra la píldora navy. */}
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 bg-white"
                    style={{
                      WebkitMaskImage: `url(${icono})`,
                      maskImage: `url(${icono})`,
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                    }}
                  />
                  <Input
                    id={`mascota-${campo}`}
                    value={form[campo]}
                    onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))}
                    placeholder={placeholder}
                    aria-label={label}
                    className="h-auto w-full border-0 bg-transparent p-0 text-sm font-medium text-white shadow-none placeholder:text-white/60 focus-visible:ring-0"
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

    <AlertDialog open={confirmandoEliminar} onOpenChange={setConfirmandoEliminar}>
      <AlertDialogContent className="rounded-[18px] sm:rounded-[18px]">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar a {mascota?.nombre}?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borrará su información, historial de salud y actividad asociada. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleEliminar} className="bg-portal-error text-white hover:bg-portal-error/90">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
