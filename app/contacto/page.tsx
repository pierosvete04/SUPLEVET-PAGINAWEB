"use client";

import { useState } from "react";
import { Mail, Clock } from "lucide-react";
import { whatsappLink } from "@/lib/site-config";
import { useConfiguracionSitio } from "@/hooks/use-configuracion-sitio";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { LinkQrCode } from "@/components/shared/LinkQrCode";

const CAMPOS_VACIOS = { nombre: "", correo: "", telefono: "", mensaje: "" };

// Pendiente técnico: conectar el formulario a un endpoint real (app/api/contacto)
// que guarde el mensaje además de las dos vías directas (correo/WhatsApp) de abajo.
export default function ContactoPage() {
  const config = useConfiguracionSitio();
  const [form, setForm] = useState(CAMPOS_VACIOS);
  const [enviado, setEnviado] = useState<"correo" | "whatsapp" | null>(null);

  const formCompleto = form.nombre.trim() && form.correo.trim() && form.mensaje.trim();

  const mensajeCompleto = `Hola, soy ${form.nombre || "[nombre]"}.\nCorreo: ${
    form.correo || "[correo]"
  }\nTeléfono: ${form.telefono || "[teléfono]"}\n\nMensaje: ${form.mensaje || "[mensaje]"}`;

  // Link del formulario: solo tiene mensaje predeterminado cuando los campos
  // requeridos ya están completos (si no, el botón se deshabilita más abajo,
  // así nunca se envía un mensaje con placeholders tipo "[nombre]" en blanco).
  const linkWhatsappFormulario = formCompleto
    ? whatsappLink(config.whatsappB2C, mensajeCompleto)
    : null;
  // CTA fijo de la derecha: abre WhatsApp sin mensaje predeterminado, para que
  // la persona escriba lo que quiera desde cero (no depende del formulario).
  const linkWhatsappDirecto = whatsappLink(config.whatsappB2C);
  const linkCorreo = `mailto:${config.correoContacto}?subject=${encodeURIComponent(
    `Consulta de ${form.nombre || "cliente web"}`
  )}&body=${encodeURIComponent(mensajeCompleto)}`;

  function actualizar<K extends keyof typeof CAMPOS_VACIOS>(campo: K, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function handleEnviarCorreo(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = linkCorreo;
    setEnviado("correo");
  }

  function handleEnviarWhatsapp(e: React.MouseEvent) {
    e.preventDefault();
    if (!linkWhatsappFormulario) return;
    window.open(linkWhatsappFormulario, "_blank", "noopener,noreferrer");
    setEnviado("whatsapp");
  }

  return (
    <div className="mx-auto max-w-container px-mobile-margin py-section-y md:px-gutter">
      <div className="text-center">
        <h1 className="font-impact text-3xl tracking-wide text-secondary md:text-4xl">
          CONTÁCTANOS
        </h1>
        <p className="mx-auto mt-3 max-w-lg font-body text-muted-foreground">
          Bríndanos tus datos para agendar una llamada y darte mayor información.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2">
        <form onSubmit={handleEnviarCorreo} className="flex flex-col gap-4">
          {enviado && (
            <p className="rounded-lg bg-green-100 p-3 font-body text-sm text-green-800">
              {enviado === "correo"
                ? "Abrimos tu correo con el mensaje listo para enviar."
                : "Abrimos WhatsApp con tu mensaje listo para enviar."}
            </p>
          )}
          <input
            type="text"
            required
            placeholder="Nombre completo"
            value={form.nombre}
            onChange={(e) => actualizar("nombre", e.target.value)}
            className="rounded-[var(--radius-card,1rem)] border border-border px-4 py-3 font-body text-sm"
          />
          <input
            type="email"
            required
            placeholder="Correo electrónico"
            value={form.correo}
            onChange={(e) => actualizar("correo", e.target.value)}
            className="rounded-[var(--radius-card,1rem)] border border-border px-4 py-3 font-body text-sm"
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) => actualizar("telefono", e.target.value)}
            className="rounded-[var(--radius-card,1rem)] border border-border px-4 py-3 font-body text-sm"
          />
          <textarea
            required
            rows={5}
            placeholder="Mensaje"
            value={form.mensaje}
            onChange={(e) => actualizar("mensaje", e.target.value)}
            className="rounded-[var(--radius-card,1rem)] border border-border px-4 py-3 font-body text-sm"
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              className="flex-1 rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground hover:opacity-90"
            >
              Enviar por correo
            </button>
            <button
              type="button"
              onClick={handleEnviarWhatsapp}
              disabled={!linkWhatsappFormulario}
              title={!linkWhatsappFormulario ? "Completa nombre, correo y mensaje primero" : undefined}
              style={{ backgroundColor: "#25D366" }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 font-body font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Enviar por WhatsApp
            </button>
          </div>

          {!formCompleto && (
            <p className="font-body text-xs text-muted-foreground">
              Completa nombre, correo y mensaje para habilitar el envío por WhatsApp.
            </p>
          )}

          {linkWhatsappFormulario && (
            <div className="mt-1 flex items-center gap-4 rounded-[var(--radius-card,1rem)] border border-dashed border-border p-4">
              <LinkQrCode link={linkWhatsappFormulario} size={140} />
              <p className="font-body text-xs text-muted-foreground">
                Si el botón no te abre WhatsApp automáticamente, escanea este código con tu
                celular para enviarnos el mismo mensaje.
              </p>
            </div>
          )}
        </form>

        <div className="flex flex-col gap-4">
          <a
            href={linkWhatsappDirecto}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-[var(--radius-card,1rem)] bg-green-500 p-5 text-white transition-opacity hover:opacity-90"
          >
            <WhatsAppIcon className="h-8 w-8 shrink-0" />
            <div>
              <p className="font-body font-bold">Escríbenos por WhatsApp</p>
              <p className="font-body text-sm text-white/85">Respuesta rápida en horario de oficina</p>
            </div>
          </a>

          <div className="flex items-center gap-4 rounded-[var(--radius-card,1rem)] border border-border p-5">
            <Mail className="h-6 w-6 shrink-0 text-accent" strokeWidth={1.75} />
            <div>
              <p className="font-body text-sm font-bold text-secondary">Correo</p>
              <p className="font-body text-sm text-muted-foreground">{config.correoContacto}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-[var(--radius-card,1rem)] border border-border p-5">
            <Clock className="h-6 w-6 shrink-0 text-accent" strokeWidth={1.75} />
            <div>
              <p className="font-body text-sm font-bold text-secondary">Horario de atención</p>
              <p className="font-body text-sm text-muted-foreground">{config.horarioAtencion}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
