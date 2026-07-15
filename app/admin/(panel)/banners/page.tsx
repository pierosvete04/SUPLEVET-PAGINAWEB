"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, GalleryHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BannerForm } from "@/components/admin/banners/BannerForm";
import type { Banner } from "@/lib/banners";

const LABEL_PAGINA: Record<Banner["pagina"], string> = {
  productos: "Productos",
  ofertas: "Ofertas",
  ambas: "Productos y Ofertas",
  home: "Nuevas presentaciones (Home)",
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Banner | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("banners")
      .select("*")
      .order("orden", { ascending: true });
    setBanners((data as Banner[]) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cerrar() {
    setEditando(null);
    setCreando(false);
  }

  async function recargarYCerrar() {
    await cargar();
    cerrar();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Banners</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo banner
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banner</TableHead>
                <TableHead>Página</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && banners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sin banners configurados.
                  </TableCell>
                </TableRow>
              )}
              {banners.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="relative flex h-10 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-soft-gray">
                      {b.imagen ? (
                        <Image src={b.imagen} alt="" fill className="object-cover" sizes="80px" />
                      ) : (
                        <GalleryHorizontal className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{LABEL_PAGINA[b.pagina]}</TableCell>
                  <TableCell className="text-muted-foreground">{b.orden}</TableCell>
                  <TableCell>
                    <Badge color={b.activo ? "verde" : "gris"}>{b.activo ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(b)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(creando || editando) && (
        <BannerForm banner={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
