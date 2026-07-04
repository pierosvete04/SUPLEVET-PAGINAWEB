"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
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
    <div>
      <h1 className="mb-6 font-body text-xl font-bold text-secondary">Clientes</h1>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full font-body text-sm">
          <thead className="bg-soft-gray text-left text-xs font-bold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Nivel</th>
              <th className="px-4 py-3">Total compras</th>
              <th className="px-4 py-3">Última compra</th>
            </tr>
          </thead>
          <tbody>
            {!cargando && clientes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Sin clientes registrados todavía.
                </td>
              </tr>
            )}
            {clientes.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clientes/${c.id}`}
                    className="font-bold text-primary hover:underline"
                  >
                    {c.nombre || c.apellido ? `${c.nombre ?? ""} ${c.apellido ?? ""}`.trim() : "Sin nombre"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-secondary">{c.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.telefono ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge color={BADGE_NIVEL[c.nivel ?? "basico"] ?? "gris"}>{c.nivel ?? "básico"}</Badge>
                </td>
                <td className="px-4 py-3 text-secondary">{c.total_compras ?? 0}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatFecha(c.ultima_compra_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
