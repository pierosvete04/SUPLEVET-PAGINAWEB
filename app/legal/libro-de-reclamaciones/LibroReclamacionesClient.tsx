"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useConfiguracionSitio } from "@/hooks/use-configuracion-sitio";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";

// Inserta directo en `libro_reclamaciones` (Supabase) — la tabla ya existe con
// las políticas RLS correctas ("Cualquiera registra reclamo": INSERT para
// anon+authenticated), mismo esquema que usa el portal de clientes existente
// (PORTAL DE CLIENTES/portal/assets/js/libro.js), así que ambos alimentan el
// mismo libro real, no uno paralelo.

type TipoSolicitud = "reclamo" | "queja";
type TipoBien = "producto" | "servicio";

function formatCorrelativo(n: number) {
  const year = new Date().getFullYear();
  return `${year}-${String(n).padStart(6, "0")}`;
}

export function LibroReclamacionesClient() {
  const config = useConfiguracionSitio();
  const [tipoSolicitud, setTipoSolicitud] = useState<TipoSolicitud>("reclamo");
  const [tipoBien, setTipoBien] = useState<TipoBien>("producto");
  const [esMenor, setEsMenor] = useState(false);
  const [acepto, setAcepto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correlativo, setCorrelativo] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const nombre = String(form.get("nombre") || "").trim();
    const numDoc = String(form.get("num_doc") || "").trim();
    const email = String(form.get("email") || "").trim();
    const detalle = String(form.get("detalle") || "").trim();
    const pedido = String(form.get("pedido") || "").trim();

    if (!nombre) return setError("Ingresa tu nombre completo");
    if (!numDoc) return setError("Ingresa tu número de documento");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Ingresa un correo válido");
    if (esMenor) {
      if (!String(form.get("apoderado_nombre") || "").trim())
        return setError("Ingresa el nombre del apoderado");
      if (!String(form.get("apoderado_doc") || "").trim())
        return setError("Ingresa el documento del apoderado");
    }
    if (!detalle) return setError(`Describe el detalle de tu ${tipoSolicitud}`);
    if (!pedido) return setError("Indica qué solicitas");
    if (!acepto) return setError("Debes aceptar la declaración para continuar");

    setEnviando(true);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const montoRaw = String(form.get("monto") || "").trim();

      const payload = {
        cliente_id: userData.user?.id ?? null,
        tipo_solicitud: tipoSolicitud,
        consumidor_nombre: nombre,
        consumidor_tipo_doc: String(form.get("tipo_doc") || "DNI"),
        consumidor_num_doc: numDoc,
        consumidor_telefono: String(form.get("telefono") || "").trim() || null,
        consumidor_email: email,
        consumidor_domicilio: String(form.get("domicilio") || "").trim() || null,
        es_menor: esMenor,
        apoderado_nombre: esMenor ? String(form.get("apoderado_nombre") || "").trim() || null : null,
        apoderado_num_doc: esMenor ? String(form.get("apoderado_doc") || "").trim() || null : null,
        tipo_bien: tipoBien,
        bien_descripcion: String(form.get("bien_desc") || "").trim() || null,
        monto_reclamado: montoRaw ? parseFloat(montoRaw) : null,
        detalle,
        pedido_consumidor: pedido,
      };

      // La política de seguridad de esta tabla solo deja LEER un reclamo a su
      // propio dueño (cliente_id = usuario logueado) o a un admin — correcto,
      // no queremos que cualquiera pueda leer reclamos ajenos. Como el Libro de
      // Reclamaciones es público por ley (no requiere cuenta), pedirle a
      // Supabase que devuelva la fila recién creada falla para un visitante
      // anónimo. Por eso: si hay sesión, pedimos el correlativo de vuelta; si
      // no, solo insertamos y confirmamos sin mostrar el número exacto.
      if (userData.user) {
        const { data, error: dbError } = await supabase
          .from("libro_reclamaciones")
          .insert(payload)
          .select("correlativo")
          .single();
        if (dbError) {
          setError("No se pudo registrar. Intenta de nuevo o escríbenos por WhatsApp.");
          return;
        }
        setCorrelativo(data?.correlativo ?? null);
      } else {
        const { error: dbError } = await supabase.from("libro_reclamaciones").insert(payload);
        if (dbError) {
          setError("No se pudo registrar. Intenta de nuevo o escríbenos por WhatsApp.");
          return;
        }
        setCorrelativo(0); // 0 = registrado, pero sin número visible (ver nota arriba)
      }
    } catch {
      setError("Error de conexión, intenta de nuevo");
    } finally {
      setEnviando(false);
    }
  }

  if (correlativo !== null) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-mobile-margin py-section-y text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-accent">
          <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-2xl font-bold text-secondary">¡Reclamo registrado!</h1>
        {correlativo > 0 && (
          <div className="rounded-lg bg-secondary px-5 py-2 font-body font-bold tracking-wide text-white">
            N.° {formatCorrelativo(correlativo)}
          </div>
        )}
        <p className="font-body text-sm text-muted-foreground">
          Tu solicitud quedó registrada en nuestro Libro de Reclamaciones. Te responderemos al
          correo indicado en un plazo máximo de <strong>15 días hábiles</strong>.
          {correlativo > 0
            ? " Guarda este número como referencia."
            : " Inicia sesión con el mismo correo la próxima vez para poder ver el número de tu reclamo."}
        </p>
        <Link
          href="/"
          className="mt-2 rounded-[17px] bg-primary px-6 py-3 font-body font-bold text-primary-foreground hover:opacity-90"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumbs items={[{ label: "Legal" }, { label: "Libro de Reclamaciones" }]} />
      <div className="mx-auto max-w-3xl px-mobile-margin py-section-y md:px-gutter">
      <div className="flex items-center gap-4 rounded-md bg-gradient-to-br from-secondary to-accent p-6 text-white">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-white/15">
          <BookOpen className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold md:text-2xl">Libro de Reclamaciones</h1>
          <p className="mt-1 font-body text-xs text-white/80 md:text-sm">
            Conforme al Código de Protección y Defensa del Consumidor (Ley N.° 29571) y su
            Reglamento (D.S. N.° 011-2011-PCM).
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-border p-5">
        <p className="font-body text-xs font-bold uppercase tracking-wide text-secondary">
          Datos del proveedor
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 font-body text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Razón social</p>
            <p className="font-bold text-secondary">{config.legalRazonSocial}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">RUC</p>
            <p className="font-bold text-secondary">{config.legalRuc}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Domicilio fiscal</p>
            <p className="font-bold text-secondary">{config.legalDomicilioFiscal}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Correo de atención</p>
            <p className="font-bold text-secondary">{config.legalCorreoAtencion.join(" y ")}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md bg-soft-gray p-4">
          <p className="font-body text-sm font-bold text-secondary">⚠️ Reclamo</p>
          <p className="mt-1 font-body text-xs text-muted-foreground">
            Disconformidad relacionada con el producto o servicio adquirido.
          </p>
        </div>
        <div className="rounded-md bg-soft-gray p-4">
          <p className="font-body text-sm font-bold text-secondary">💬 Queja</p>
          <p className="mt-1 font-body text-xs text-muted-foreground">
            Disconformidad no relacionada con el producto, sino con la atención al cliente.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <div>
          <p className="mb-2 font-body text-sm font-bold text-secondary">Tipo de solicitud *</p>
          <div className="flex gap-3">
            {(["reclamo", "queja"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipoSolicitud(t)}
                className={`flex-1 rounded-md border-2 p-3 text-left font-body text-sm font-bold capitalize transition-colors ${
                  tipoSolicitud === t ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                {t === "reclamo" ? "⚠️ Reclamo" : "💬 Queja"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 font-body text-sm font-bold text-secondary">
            1. Identificación del consumidor reclamante
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              name="nombre"
              required
              placeholder="Nombre completo *"
              className="rounded-lg border border-border px-4 py-3 font-body text-sm sm:col-span-2"
            />
            <select
              name="tipo_doc"
              className="rounded-lg border border-border px-4 py-3 font-body text-sm"
              defaultValue="DNI"
            >
              <option value="DNI">DNI</option>
              <option value="CE">Carné de extranjería</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="RUC">RUC</option>
            </select>
            <input
              name="num_doc"
              required
              placeholder="N.° de documento *"
              className="rounded-lg border border-border px-4 py-3 font-body text-sm"
            />
            <input
              name="telefono"
              type="tel"
              placeholder="Teléfono"
              className="rounded-lg border border-border px-4 py-3 font-body text-sm"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Correo electrónico *"
              className="rounded-lg border border-border px-4 py-3 font-body text-sm"
            />
            <input
              name="domicilio"
              placeholder="Domicilio"
              className="rounded-lg border border-border px-4 py-3 font-body text-sm sm:col-span-2"
            />
          </div>

          <label className="mt-3 flex items-center gap-2 font-body text-sm font-bold text-secondary">
            <input
              type="checkbox"
              checked={esMenor}
              onChange={(e) => setEsMenor(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            El consumidor es menor de edad
          </label>

          {esMenor && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                name="apoderado_nombre"
                placeholder="Nombre del apoderado *"
                className="rounded-lg border border-border px-4 py-3 font-body text-sm"
              />
              <input
                name="apoderado_doc"
                placeholder="Documento del apoderado *"
                className="rounded-lg border border-border px-4 py-3 font-body text-sm"
              />
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 font-body text-sm font-bold text-secondary">
            2. Identificación del bien contratado
          </p>
          <div className="mb-3 flex gap-3">
            {(["producto", "servicio"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setTipoBien(b)}
                className={`flex-1 rounded-md border-2 p-3 text-center font-body text-sm font-bold capitalize transition-colors ${
                  tipoBien === b ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                {b === "producto" ? "📦 Producto" : "🛎️ Servicio"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              name="bien_desc"
              placeholder="Ej: Suplevet 250g, pedido W-1026…"
              className="rounded-lg border border-border px-4 py-3 font-body text-sm"
            />
            <input
              name="monto"
              type="number"
              step="0.01"
              min="0"
              placeholder="Monto reclamado (S/)"
              className="rounded-lg border border-border px-4 py-3 font-body text-sm"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 font-body text-sm font-bold text-secondary">
            3. Detalle de la reclamación
          </p>
          <textarea
            name="detalle"
            required
            rows={4}
            placeholder={`Describe con claridad tu ${tipoSolicitud}…`}
            className="w-full rounded-lg border border-border px-4 py-3 font-body text-sm"
          />
          <textarea
            name="pedido"
            required
            rows={3}
            placeholder="Pedido del consumidor: lo que solicitas (ej. cambio, devolución del monto…)"
            className="mt-3 w-full rounded-lg border border-border px-4 py-3 font-body text-sm"
          />
        </div>

        <div className="rounded-md bg-soft-gray p-5">
          <p className="font-body text-xs text-muted-foreground">
            El proveedor debe dar respuesta en un plazo no mayor a <strong>15 días hábiles</strong>,
            ampliable por otro plazo igual. Formular este reclamo no impide acudir a otras vías de
            solución de controversias ni es requisito previo para una denuncia ante INDECOPI. Los
            datos se tratan conforme a la{" "}
            <Link href="/legal/privacidad" className="font-bold text-secondary">
              Política de Privacidad
            </Link>
            .
          </p>
          <label className="mt-4 flex items-start gap-2 font-body text-xs text-secondary">
            <input
              type="checkbox"
              checked={acepto}
              onChange={(e) => setAcepto(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            Declaro que los datos consignados son verídicos y autorizo su tratamiento para la
            atención de esta solicitud.
          </label>

          {error && <p className="mt-3 font-body text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="mt-4 w-full rounded-[17px] bg-primary px-6 py-3 font-body font-bold text-primary-foreground disabled:opacity-60 sm:w-fit"
          >
            {enviando ? "Registrando…" : "Registrar en el Libro"}
          </button>
        </div>
      </form>
      </div>
    </>
  );
}
