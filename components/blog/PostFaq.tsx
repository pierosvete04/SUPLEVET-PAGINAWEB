import { Plus } from "lucide-react";
import type { BlogFaq } from "@/lib/data/blog-shared";

interface PostFaqProps {
  faqs: BlogFaq[];
}

/**
 * Acordeón de preguntas frecuentes de UN artículo del blog. A diferencia de
 * components/shared/Faq.tsx (las FAQs genéricas del sitio, con formulario de
 * contacto), esta es texto visible que respalda el FAQPage JSON-LD emitido en
 * app/blog/[slug]/page.tsx — mismas preguntas en pantalla y en el schema.
 */
export function PostFaq({ faqs }: PostFaqProps) {
  if (faqs.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="post-faq-heading">
      <h2 id="post-faq-heading" className="mb-4 font-display text-xl font-bold text-secondary">
        Preguntas frecuentes
      </h2>
      <div className="flex flex-col rounded-md border border-border bg-soft-gray px-5">
        {faqs.map((faq) => (
          <details
            key={faq.pregunta}
            className="group border-b border-border py-4 last:border-b-0 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-body font-bold text-secondary">
              {faq.pregunta}
              <Plus
                className="h-4 w-4 shrink-0 text-secondary transition-transform duration-200 group-open:rotate-45"
                strokeWidth={2}
              />
            </summary>
            <p className="mt-2 font-body text-sm text-muted-foreground">{faq.respuesta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
