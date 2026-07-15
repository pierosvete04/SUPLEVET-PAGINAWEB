"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { whatsappLink } from "@/lib/site-config";
import { useConfiguracionSitio } from "@/hooks/use-configuracion-sitio";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { trackEvent } from "@/lib/analytics";

// Formulario de postulación para "Distribuidores estratégicos" (pestaña
// Oportunidad de negocio). Hace dos cosas al enviar:
//   1. Guarda el lead en la tabla `distribuidores_leads` (Supabase) para que el
//      equipo lo tenga acumulado, con RLS de INSERT abierto (igual que
//      libro_reclamaciones) — nadie más que un admin puede leerlos.
//   2. Abre WhatsApp al número exclusivo de distribuidores con el mensaje ya
//      redactado, para que la conversación arranque de inmediato.
// El guardado en base NO bloquea el contacto: si la inserción falla, igual
// abrimos WhatsApp (no perdemos el lead por un error de red).

const CAMPOS_VACIOS = {
  nombre: "",
  telefono: "",
  email: "",
  ciudad: "",
  experiencia: "",
  mensaje: "",
};

const INPUT_CLASS =
  "w-full rounded-[var(--radius-card,1rem)] border border-border bg-white px-4 py-3 font-body text-sm text-secondary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/40";

export function FormularioDistribuidor() {
  const config = useConfiguracionSitio();
  const [form, setForm] = useState(CAMPOS_VACIOS);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const formValido = form.nombre.trim().length > 1 && form.telefono.trim().length >= 6;

  function actualizar<K extends keyof typeof CAMPOS_VACIOS>(campo: K, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function construirMensaje() {
    return (
      `¡Hola! Quiero ser Distribuidor Estratégico de Suplevet.\n\n` +
      `Nombre: ${form.nombre.trim()}\n` +
      `Teléfono: ${form.telefono.trim()}\n` +
      (form.email.trim() ? `Correo: ${form.email.trim()}\n` : "") +
      (form.ciudad.trim() ? `Ciudad: ${form.ciudad.trim()}\n` : "") +
      (form.experiencia.trim() ? `Ocupación / experiencia: ${form.experiencia.trim()}\n` : "") +
      (form.mensaje.trim() ? `\nMensaje: ${form.mensaje.trim()}` : "")
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!form.nombre.trim()) return setError("Ingresa tu nombre completo.");
    if (form.telefono.trim().length < 6) return setError("Ingresa un número de teléfono válido.");

    setEnviando(true);

    // 1) Guardar el lead (best-effort — no debe impedir el contacto por WhatsApp).
    try {
      const supabase = createClient();
      const { error: dbError } = await supabase.from("distribuidores_leads").insert({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim() || null,
        ciudad: form.ciudad.trim() || null,
        experiencia: form.experiencia.trim() || null,
        mensaje: form.mensaje.trim() || null,
      });
      if (dbError) {
        // Se registra pero no se bloquea: seguimos abriendo WhatsApp.
        trackEvent("distribuidor_lead_error", { motivo: "insert" });
      }
    } catch {
      trackEvent("distribuidor_lead_error", { motivo: "excepcion" });
    }

    // 2) Abrir WhatsApp al número de distribuidores con el mensaje redactado.
    trackEvent("whatsapp_click", { origen: "form_distribuidores" });
    const link = whatsappLink(config.whatsappDistribuidores, construirMensaje());
    window.open(link, "_blank", "noopener,noreferrer");

    setEnviando(false);
    setEnviado(true);
  }

  if (enviado) {
    const link = whatsappLink(config.whatsappDistribuidores, construirMensaje());
    return (
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius-card,1rem)] bg-white p-8 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-accent">
          <CheckCircle2 className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>
        <h3 className="font-display text-xl font-bold text-secondary">¡Recibimos tus datos!</h3>
        <p className="max-w-sm font-body text-sm text-muted-foreground">
          Abrimos WhatsApp para que inicies la conversación con nuestro equipo de Distribuidores
          Estratégicos. Si no se abrió automáticamente, toca el botón de abajo.
        </p>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: "#25D366" }}
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3 font-body font-bold text-white transition-opacity hover:opacity-90"
        >
          <WhatsAppIcon className="h-5 w-5" />
          Abrir WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-[var(--radius-card,1rem)] bg-white p-6 shadow-sm md:p-8"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="text"
          required
          placeholder="Nombre completo *"
          value={form.nombre}
          onChange={(e) => actualizar("nombre", e.target.value)}
          className={INPUT_CLASS}
        />
        <input
          type="tel"
          required
          placeholder="Teléfono / WhatsApp *"
          value={form.telefono}
          onChange={(e) => actualizar("telefono", e.target.value)}
          className={INPUT_CLASS}
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={(e) => actualizar("email", e.target.value)}
          className={INPUT_CLASS}
        />
        <input
          type="text"
          placeholder="Ciudad"
          value={form.ciudad}
          onChange={(e) => actualizar("ciudad", e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <input
        type="text"
        placeholder="¿A qué te dedicas hoy? (opcional)"
        value={form.experiencia}
        onChange={(e) => actualizar("experiencia", e.target.value)}
        className={INPUT_CLASS}
      />

      <textarea
        rows={3}
        placeholder="Cuéntanos por qué quieres unirte (opcional)"
        value={form.mensaje}
        onChange={(e) => actualizar("mensaje", e.target.value)}
        className={INPUT_CLASS}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 font-body text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={!formValido || enviando}
        style={{ backgroundColor: "#25D366" }}
        className="mt-1 flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-body text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <WhatsAppIcon className="h-5 w-5" />
        )}
        {enviando ? "Enviando…" : "Quiero postular por WhatsApp"}
      </button>

      <p className="text-center font-body text-xs text-muted-foreground">
        Al enviar, guardamos tus datos y abrimos una conversación de WhatsApp con nuestro equipo.
      </p>
    </form>
  );
}
