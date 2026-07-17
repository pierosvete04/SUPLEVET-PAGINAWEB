import type { ReactNode } from "react";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";

interface LegalDocProps {
  titulo: string;
  actualizado: string;
  children: ReactNode;
}

export function LegalDoc({ titulo, actualizado, children }: LegalDocProps) {
  return (
    <>
      <PageBreadcrumbs items={[{ label: "Legal" }, { label: titulo }]} />
      <div className="mx-auto max-w-2xl px-mobile-margin py-section-y md:px-gutter">
      <p className="font-impact text-xs tracking-wide text-accent">DOCUMENTO LEGAL</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-secondary">{titulo}</h1>
      <p className="mt-2 font-body text-xs text-muted-foreground">
        Última actualización: {actualizado}
      </p>
      <div className="prose-legal mt-8 flex flex-col gap-5 font-body text-sm leading-relaxed text-secondary [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-secondary [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-soft-gray [&_th]:p-2 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
      </div>
    </>
  );
}
