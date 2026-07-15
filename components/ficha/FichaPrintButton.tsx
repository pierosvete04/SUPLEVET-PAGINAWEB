"use client";

import { Button } from "@/components/ui/button";

export function FichaPrintButton() {
  return (
    <Button
      type="button"
      size="sm"
      className="bg-portal-navy-dark text-white hover:bg-portal-navy print:hidden"
      onClick={() => window.print()}
    >
      Descargar PDF
    </Button>
  );
}
