"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { whatsappLink } from "@/lib/site-config";
import { useConfiguracionSitio } from "@/hooks/use-configuracion-sitio";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import type { Faq as FaqItem } from "@/lib/faqs";

const CAMPOS_VACIOS = { nombre: "", correo: "", mensaje: "" };

interface FaqProps {
  preguntas: FaqItem[];
  /** true = reduce el padding superior — se usa en Home, donde le precede
   * directamente la sección del Blog y el espacio entre ambas quedaba
   * demasiado separado. */
  paddingSuperiorReducido?: boolean;
}

export function Faq({ preguntas, paddingSuperiorReducido = false }: FaqProps) {
  const config = useConfiguracionSitio();
  const [form, setForm] = useState(CAMPOS_VACIOS);

  function actualizar<K extends keyof typeof CAMPOS_VACIOS>(campo: K, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.mensaje.trim()) return;
    const mensaje = `Hola, soy ${form.nombre}.\nCorreo: ${form.correo || "-"}\n\nMensaje: ${form.mensaje}`;
    window.open(whatsappLink(config.whatsappB2C, mensaje), "_blank", "noopener,noreferrer");
  }

  return (
    <section className={`bg-soft-gray pb-section-y ${paddingSuperiorReducido ? "pt-7" : "pt-section-y"}`}>
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary to-[#0f1b2e]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative grid grid-cols-1 lg:grid-cols-[3fr_2fr]">
            <div className="p-8 md:p-12 lg:p-14">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h2 className="font-display text-6xl font-black leading-none text-white md:text-7xl">FAQs</h2>
                <span className="rounded-sm bg-white/10 px-4 py-2 font-body text-sm text-white/70">
                  Consultas Frecuentes
                </span>
              </div>

              <div className="mt-10 flex flex-col">
                {preguntas.map((item) => (
                  <details
                    key={item.id}
                    className="group border-b border-white/10 py-5 first:pt-0 last:border-b-0 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-body font-bold text-white">
                      {item.pregunta}
                      <Plus
                        className="h-5 w-5 shrink-0 text-white transition-transform duration-200 group-open:rotate-45"
                        strokeWidth={2}
                      />
                    </summary>
                    <p className="mt-3 font-body text-sm text-white/60">{item.respuesta}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 p-8 md:p-12 lg:border-l lg:border-t-0 lg:p-14">
              <h3 className="font-display text-2xl font-bold text-white">¿Tienes otras dudas?</h3>
              <p className="mt-2 font-body text-sm text-white/60">
                Envíanos tu consulta por aquí o más rápido por WhatsApp.
              </p>

              <form onSubmit={handleEnviar} className="mt-6 flex flex-col gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={(e) => actualizar("nombre", e.target.value)}
                  className="rounded-sm bg-white/5 px-4 py-3 font-body text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={form.correo}
                  onChange={(e) => actualizar("correo", e.target.value)}
                  className="rounded-sm bg-white/5 px-4 py-3 font-body text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
                <textarea
                  required
                  rows={4}
                  placeholder="Mensaje"
                  value={form.mensaje}
                  onChange={(e) => actualizar("mensaje", e.target.value)}
                  className="resize-none rounded-sm bg-white/5 px-4 py-3 font-body text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
                <div className="mt-2 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-sm bg-accent px-6 py-3 font-body font-bold text-secondary transition-opacity hover:opacity-90"
                  >
                    Enviar
                  </button>
                  <a
                    href={whatsappLink(config.whatsappB2C, "Hola, tengo una consulta sobre Suplevet")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-sm bg-[#25D366] px-6 py-3 font-body font-bold text-white transition-opacity hover:opacity-90"
                  >
                    <WhatsAppIcon className="h-5 w-5 shrink-0" />
                    WhatsApp
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
