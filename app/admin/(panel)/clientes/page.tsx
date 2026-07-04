"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BADGE_NIVEL, formatFecha, type ClienteResumen } from "@/lib/data/clientes-admin";

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<ClienteResumen[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    createClient()
      .from("admin_clientes_resumen")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setClientes((data as ClienteResumen[]) ?? []);
        setCargando(false);
      });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Clientes</h2>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Total compras</TableHead>
                <TableHead>Última compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && clientes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Sin clientes registrados todavía.
                  </TableCell>
                </TableRow>
              )}
              {clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/admin/clientes/${c.id}`} className="font-medium text-primary hover:underline">
                      {c.nombre || c.apellido ? `${c.nombre ?? ""} ${c.apellido ?? ""}`.trim() : "Sin nombre"}
                    </Link>
                  </TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell className="text-muted-foreground">{c.telefono ?? "—"}</TableCell>
                  <TableCell>
                    <Badge color={BADGE_NIVEL[c.nivel ?? "basico"] ?? "gris"}>{c.nivel ?? "básico"}</Badge>
                  </TableCell>
                  <TableCell>{c.total_compras ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">{formatFecha(c.ultima_compra_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
