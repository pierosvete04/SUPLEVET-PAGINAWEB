"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { traducirErrorSupabase } from "@/lib/errores-supabase";
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
  dni: string | null;
  telefono: string;
  email: string | null;
  direccion: string | null;
  ciudad: string | null;
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  experiencia: string | null;
  mensaje: string | null;
  estado: string;
}

const ESTADOS_LEAD = ["nuevo", "contactado", "descartado"] as const;

const BADGE_ESTADO_LEAD: Record<(typeof ESTADOS_LEAD)[number], { color: "azul" | "verde" | "gris"; label: string }> = {
  nuevo: { color: "azul", label: "Nuevo" },
  contactado: { color: "verde", label: "Contactado" },
  descartado: { color: "gris", label: "Descartado" },
};

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
    const anteriores = leads;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, estado } : l)));
    const { error: saveError } = await createClient()
      .from("distribuidores_leads")
      .update({ estado })
      .eq("id", id);
    if (saveError) {
      setLeads(anteriores);
      toast.error(traducirErrorSupabase(saveError));
      return;
    }
    toast.success("Postulación actualizada.");
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
                <TableHead>DNI</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Distrito / Región</TableHead>
                <TableHead>Ocupación</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                  <TableCell className="text-muted-foreground">{l.dni || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{l.telefono}</TableCell>
                  <TableCell className="max-w-[16rem] text-muted-foreground">{l.direccion || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {l.distrito || l.ciudad || "—"}
                    {(l.provincia || l.departamento) && (
                      <span className="block text-xs text-muted-foreground/70">
                        {[l.provincia, l.departamento].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">{l.experiencia || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString("es-PE")}
                  </TableCell>
                  <TableCell>
                    <Select value={l.estado} onValueChange={(v) => cambiarEstadoLead(l.id, v)}>
                      <SelectTrigger className="h-auto w-fit gap-1.5 border-none bg-transparent p-0 shadow-none focus:ring-0 [&_svg]:opacity-50">
                        <Badge color={BADGE_ESTADO_LEAD[l.estado as (typeof ESTADOS_LEAD)[number]]?.color ?? "gris"}>
                          {BADGE_ESTADO_LEAD[l.estado as (typeof ESTADOS_LEAD)[number]]?.label ?? l.estado}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_LEAD.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {BADGE_ESTADO_LEAD[estado].label}
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
