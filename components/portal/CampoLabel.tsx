import type { ReactNode } from "react";

export function CampoLabel({ htmlFor, icono, children }: { htmlFor?: string; icono: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-portal-muted"
    >
      <span className="material-symbols-rounded text-[14px] text-portal-orange">{icono}</span>
      {children}
    </label>
  );
}
