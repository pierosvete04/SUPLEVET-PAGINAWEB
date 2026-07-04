"use client";

import { useState } from "react";
import { MessageCircle, Mail, Clock } from "lucide-react";
import { siteConfig, whatsappLink } from "@/lib/site-config";

// Pendiente técnico: conectar el formulario a un endpoint real (app/api/contacto)
// que guarde el mensaje o lo envíe por correo — hoy solo valida en el cliente.
export default function ContactoPage() {
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviado(true);
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {enviado && (
            <p className="rounded-lg bg-green-100 p-3 font-body text-sm text-green-800">
              ¡Gracias! Recibimos tu mensaje, te contactaremos pronto.
            </p>
          )}
          <input
            type="text"
            required
            placeholder="Nombre completo"
            className="rounded-lg border border-border px-4 py-3 font-body text-sm"
          />
          <input
            type="email"
            required
            placeholder="Correo electrónico"
            className="rounded-lg border border-border px-4 py-3 font-body text-sm"
          />
          <input
            type="tel"
            placeholder="Teléfono"
            className="rounded-lg border border-border px-4 py-3 font-body text-sm"
          />
          <textarea
            required
            rows={5}
            placeholder="Mensaje"
            className="rounded-lg border border-border px-4 py-3 font-body text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground hover:opacity-90"
          >
            Enviar
          </button>
        </form>

        <div className="flex flex-col gap-4">
          <a
            href={whatsappLink(siteConfig.whatsappB2C, "Hola, tengo una consulta sobre Suplevet")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-xl bg-green-500 p-5 text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-8 w-8 shrink-0" strokeWidth={1.75} />
            <div>
              <p className="font-body font-bold">Escríbenos por WhatsApp</p>
              <p className="font-body text-sm text-white/85">Respuesta rápida en horario de oficina</p>
            </div>
          </a>

          {/* Pendiente operativo: falta el correo de contacto real y el horario
              de atención confirmado — no se inventan, se dejan marcados. */}
          <div className="flex items-center gap-4 rounded-xl border border-border p-5">
            <Mail className="h-6 w-6 shrink-0 text-accent" strokeWidth={1.75} />
            <div>
              <p className="font-body text-sm font-bold text-secondary">Correo</p>
              <p className="font-body text-sm text-muted-foreground">Por confirmar</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-border p-5">
            <Clock className="h-6 w-6 shrink-0 text-accent" strokeWidth={1.75} />
            <div>
              <p className="font-body text-sm font-bold text-secondary">Horario de atención</p>
              <p className="font-body text-sm text-muted-foreground">Por confirmar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
