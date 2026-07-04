import { ChevronDown } from "lucide-react";

const preguntas = [
  {
    pregunta: "¿Cómo se administra Suplevet?",
    respuesta:
      "Se mezcla directamente con el alimento seco, se combina con alimento húmedo, o se disuelve en agua tibia — usando la cuchara medidora incluida según el peso de tu mascota.",
  },
  {
    pregunta: "¿Suplevet reemplaza el alimento?",
    respuesta:
      "No. Suplevet es un suplemento nutricional que complementa la alimentación diaria de tu mascota, ayudando a fortalecer su sistema inmunológico, digestión y vitalidad.",
  },
  {
    pregunta: "¿Es un medicamento?",
    respuesta:
      "No. Es un suplemento hiperproteico de uso veterinario, no un medicamento. Ayuda a fortalecer procesos naturales del organismo de tu mascota.",
  },
];

export function Faq() {
  return (
    <section className="bg-soft-gray py-section-y">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <h2 className="text-center font-display text-3xl font-bold text-secondary md:text-4xl">
          Preguntas Frecuentes
        </h2>
        <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-3">
          {preguntas.map((item) => (
            <details
              key={item.pregunta}
              className="group rounded-xl bg-white p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-body font-bold text-accent">
                {item.pregunta}
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-secondary transition-transform group-open:rotate-180"
                  strokeWidth={1.75}
                />
              </summary>
              <p className="mt-3 font-body text-sm text-muted-foreground">{item.respuesta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
