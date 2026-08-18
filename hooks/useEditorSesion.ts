"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Cupon } from "@/components/admin/cupones/CuponForm";

/** Sesión + cupones propios del editor — repetido en cada pestaña de /admin/mi-panel/*, centralizado acá. */
export function useEditorSesion() {
  const [miId, setMiId] = useState<string | null>(null);
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCargando(false);
        return;
      }
      setMiId(user.id);
      const { data } = await supabase
        .from("cupones")
        .select("*")
        .eq("editor_id", user.id)
        .order("created_at", { ascending: false });
      setCupones((data as Cupon[]) ?? []);
      setCargando(false);
    }
    cargar();
  }, []);

  return { miId, cupones, codigos: cupones.map((c) => c.codigo), cargando };
}
