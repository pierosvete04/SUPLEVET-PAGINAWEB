"use client";

import { useState } from "react";
import { Check, CheckCircle2, Loader2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { whatsappLink } from "@/lib/site-config";
import { useConfiguracionSitio } from "@/hooks/use-configuracion-sitio";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { trackEvent } from "@/lib/analytics";
import { provinciasPorDepartamento, distritosPorProvincia } from "@/lib/data/ubigeo";
import { departamentosCheckout } from "@/lib/shipping";
import { consultarDocumento } from "@/lib/documento";

// Formulario de postulación para "Distribuidores estratégicos" (pestaña
// Oportunidad de negocio). Hace dos cosas al enviar:
//   1. Guarda el lead en la tabla `distribuidores_leads` (Supabase) para que el
//      equipo lo tenga acumulado, con RLS de INSERT abierto (igual que
//      libro_reclamaciones) — nadie más que un admin puede leerlos.
//   2. Abre WhatsApp al número exclusivo de distribuidores con el mensaje ya
//      redactado, para que la conversación arranque de inmediato.
// El guardado en base NO bloquea el contacto: si la inserción falla, igual
// abrimos WhatsApp (no perdemos el lead por un error de red).
//
// Región/Ciudad/Distrito y la consulta de DNI usan el mismo dataset y el
// mismo patrón que el checkout (components/checkout/ShippingStep.tsx): acá no
// hace falta el autocompletado de Google ni el pin del mapa (no se calcula
// costo de envío), así que la dirección queda como texto libre.

const CAMPOS_VACIOS = {
  nombre: "",
  dni: "",
  telefono: "",
  email: "",
  direccion: "",
  departamento: "",
  provincia: "",
  distrito: "",
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

  const [consultandoDni, setConsultandoDni] = useState(false);
  const [dniEncontrado, setDniEncontrado] = useState(false);
  const [errorDni, setErrorDni] = useState<string | null>(null);

  const formValido = form.nombre.trim().length > 1 && form.telefono.trim().length >= 6;
  const puedeConsultarDni = form.dni.length === 8;

  const provincias = provinciasPorDepartamento[form.departamento] ?? [];
  const distritos = form.provincia
    ? distritosPorProvincia[`${form.departamento}::${form.provincia}`] ?? []
    : [];

  function actualizar<K extends keyof typeof CAMPOS_VACIOS>(campo: K, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function setDni(numero: string) {
    setErrorDni(null);
    setDniEncontrado(false);
    actualizar("dni", numero.replace(/\D/g, "").slice(0, 8));
  }

  // Autocompleta el nombre desde RENIEC — igual que en el checkout, si falla
  // (sin token, DNI inexistente, sin red) no bloquea nada: se escribe a mano.
  async function consultarDni() {
    if (!puedeConsultarDni || consultandoDni) return;
    setConsultandoDni(true);
    setErrorDni(null);
    const { datos, error: errorConsulta } = await consultarDocumento("dni", form.dni);
    if (datos) {
      actualizar("nombre", datos.nombreCompleto);
      setDniEncontrado(true);
    } else {
      setErrorDni(errorConsulta);
      setDniEncontrado(false);
    }
    setConsultandoDni(false);
  }

  function setDepartamento(nuevoDepartamento: string) {
    const nuevasProvincias = provinciasPorDepartamento[nuevoDepartamento] ?? [];
    // Si solo hay una provincia real (caso Lima Metropolitana / Callao), se
    // autoselecciona para no pedir un clic de más.
    const provinciaAuto = nuevasProvincias.length === 1 ? nuevasProvincias[0] : "";
    setForm((f) => ({ ...f, departamento: nuevoDepartamento, provincia: provinciaAuto, distrito: "" }));
  }

  function setProvincia(nuevaProvincia: string) {
    setForm((f) => ({ ...f, provincia: nuevaProvincia, distrito: "" }));
  }

  function construirMensaje() {
    const ubicacion = [form.distrito, form.provincia, form.departamento].filter(Boolean).join(", ");
    return (
      `¡Hola! Quiero ser Distribuidor Estratégico de Suplevet.\n\n` +
      `Nombre: ${form.nombre.trim()}\n` +
      (form.dni ? `DNI: ${form.dni}\n` : "") +
      `Teléfono: ${form.telefono.trim()}\n` +
      (form.email.trim() ? `Correo: ${form.email.trim()}\n` : "") +
      (form.direccion.trim() ? `Dirección: ${form.direccion.trim()}\n` : "") +
      (ubicacion ? `Ubicación: ${ubicacion}\n` : "") +
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
        dni: form.dni || null,
        telefono: form.telefono.trim(),
        email: form.email.trim() || null,
        direccion: form.direccion.trim() || null,
        departamento: form.departamento || null,
        provincia: form.provincia || null,
        distrito: form.distrito || null,
        // Se mantiene "ciudad" (columna previa) para no perder el dato en la
        // tabla del admin que ya lo muestra — combina distrito + provincia.
        ciudad: [form.distrito, form.provincia].filter(Boolean).join(", ") || null,
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
          className="flex items-center justify-center gap-2 rounded-[17px] px-6 py-3 font-body font-bold text-white transition-opacity hover:opacity-90"
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
      </div>

      {/* DNI opcional con consulta a RENIEC — mismo flujo que el checkout: si
          se encuentra, autocompleta el nombre completo de arriba. */}
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="DNI (opcional)"
            value={form.dni}
            onChange={(e) => setDni(e.target.value)}
            className={`${INPUT_CLASS} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={consultarDni}
            disabled={!puedeConsultarDni || consultandoDni}
            className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-card,1rem)] border border-border px-4 font-body text-xs font-bold text-secondary transition-opacity hover:bg-soft-gray disabled:opacity-40"
          >
            {consultandoDni ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            Buscar
          </button>
        </div>
        {errorDni ? (
          <p className="font-body text-xs text-destructive">{errorDni}</p>
        ) : dniEncontrado ? (
          <p className="flex items-center gap-1 font-body text-xs text-green-700">
            <Check className="h-3.5 w-3.5" /> Nombre encontrado y completado arriba.
          </p>
        ) : null}
      </div>

      <input
        type="email"
        placeholder="Correo electrónico"
        value={form.email}
        onChange={(e) => actualizar("email", e.target.value)}
        className={INPUT_CLASS}
      />

      <input
        type="text"
        placeholder="Dirección completa"
        value={form.direccion}
        onChange={(e) => actualizar("direccion", e.target.value)}
        className={INPUT_CLASS}
      />

      {/* Región → Ciudad → Distrito en cascada, mismo dataset que el checkout
          (lib/data/ubigeo.ts): cubre las 3 zonas de Lima (Metropolitana,
          Provincias, Callao) más el resto de departamentos del Perú. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={form.departamento}
          onChange={(e) => setDepartamento(e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Región</option>
          {departamentosCheckout.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={form.provincia}
          disabled={provincias.length === 0}
          onChange={(e) => setProvincia(e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Ciudad</option>
          {provincias.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={form.distrito}
          disabled={distritos.length === 0}
          onChange={(e) => actualizar("distrito", e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Distrito</option>
          {distritos.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
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
        className="mt-1 flex items-center justify-center gap-2 rounded-[17px] px-6 py-3.5 font-body text-base font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
