"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface RestrictedHeaderProps {
  admin: { nombre: string };
  titulo: string;
}

// Header minimalista para roles restringidos (ej. "oportunidad_negocio",
// pensado para personal externo): sin sidebar ni enlaces a otras secciones,
// solo el título de su única sección permitida y cerrar sesión.
export function RestrictedHeader({ admin, titulo }: RestrictedHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Image src="/logos/icon-only/icon-orange.png" alt="" width={24} height={24} />
        <span className="font-body text-sm font-semibold text-secondary">{titulo}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden font-body text-sm text-muted-foreground sm:inline">{admin.nombre}</span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
}
