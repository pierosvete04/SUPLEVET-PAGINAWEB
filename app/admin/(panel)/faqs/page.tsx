"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
import { FaqForm } from "@/components/admin/faqs/FaqForm";
import type { Faq } from "@/lib/faqs";

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Faq | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("faqs")
      .select("*")
      .order("orden", { ascending: true });
    setFaqs((data as Faq[]) ?? []);
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
        <div>
          <h2 className="text-lg font-semibold">FAQs</h2>
          <p className="text-sm text-muted-foreground">
            Preguntas frecuentes mostradas en Inicio y en la página de cada producto.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nueva pregunta
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pregunta</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && faqs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sin preguntas configuradas.
                  </TableCell>
                </TableRow>
              )}
              {faqs.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="max-w-md">{f.pregunta}</TableCell>
                  <TableCell className="text-muted-foreground">{f.orden}</TableCell>
                  <TableCell>
                    <Badge color={f.activo ? "verde" : "gris"}>{f.activo ? "Activa" : "Inactiva"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(f)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(creando || editando) && <FaqForm faq={editando} onClose={cerrar} onSaved={recargarYCerrar} />}
    </div>
  );
}
