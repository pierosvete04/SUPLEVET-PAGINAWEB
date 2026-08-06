import type { ReactNode } from "react";
import { PortalIcon } from "@/components/portal/icons/PortalIcon";

export function CampoLabel({ htmlFor, icono, children }: { htmlFor?: string; icono: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-portal-muted"
    >
      <PortalIcon name={icono} className="text-[14px] text-portal-orange" />
      {children}
    </label>
  );
}
