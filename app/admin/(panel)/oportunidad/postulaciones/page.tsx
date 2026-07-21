"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { TableCard } from "@/components/admin/table/TableCard";
import { BrandedLoader } from "@/components/ui/branded-loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DistribuidorLead {
  id: string;
  created_at: string;
  nombre: string;
  telefono: string;
  email: string | null;
  ciudad: string | null;
  experiencia: string | null;
  mensaje: string | null;
  estado: string;
}

const ESTADOS_LEAD = ["nuevo", "contactado", "descartado"] as const;

export default function AdminOportunidadPostulacionesPage() {
  const [leads, setLeads] = useState<DistribuidorLead[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("distribuidores_leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads((data as DistribuidorLead[]) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cambiarEstadoLead(id: string, estado: string) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, estado } : l)));
    await createClient().from("distribuidores_leads").update({ estado }).eq("id", id);
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Postulaciones — Oportunidad de negocio</h2>

      {cargando ? (
        <BrandedLoader />
      ) : (
        <TableCard badge={<Badge color="gris">{leads.length}</Badge>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Ocupación</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Sin postulaciones todavía.
                  </TableCell>
                </TableRow>
              )}
              {leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    {l.nombre}
                    {l.email && <span className="block text-xs text-muted-foreground/70">{l.email}</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.telefono}</TableCell>
                  <TableCell className="text-muted-foreground">{l.ciudad || "—"}</TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">{l.experiencia || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString("es-PE")}
                  </TableCell>
                  <TableCell>
                    <Select value={l.estado} onValueChange={(v) => cambiarEstadoLead(l.id, v)}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_LEAD.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado.charAt(0).toUpperCase() + estado.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
