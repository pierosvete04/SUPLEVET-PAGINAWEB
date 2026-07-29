"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { traducirErrorSupabase } from "@/lib/errores-supabase";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BrandedLoader } from "@/components/ui/branded-loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BADGE_ESTADO_RECLAMO,
  LABEL_TIPO_SOLICITUD,
  diasHabilesTranscurridos,
  formatCorrelativoReclamo,
  reclamoVencido,
  PLAZO_DIAS_HABILES,
  type LibroReclamacion,
} from "@/lib/data/libro-reclamaciones-admin";

export default function AdminLibroReclamacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [reclamo, setReclamo] = useState<LibroReclamacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const { data } = await createClient().from("libro_reclamaciones").select("*").eq("id", id).single();
      const r = data as LibroReclamacion | null;
      setReclamo(r);
      setRespuesta(r?.respuesta_proveedor ?? "");
      setCargando(false);
    }
    cargar();
  }, [id]);

  async function cambiarEstado(estado: "pendiente" | "en_proceso") {
    if (!reclamo) return;
    setActualizandoEstado(true);
    const { error: saveError } = await createClient()
      .from("libro_reclamaciones")
      .update({ estado })
      .eq("id", id);
    setActualizandoEstado(false);
    if (saveError) {
      toast.error(traducirErrorSupabase(saveError));
      return;
    }
    setReclamo((r) => (r ? { ...r, estado } : r));
    toast.success(`Marcado como "${BADGE_ESTADO_RECLAMO[estado].label}".`);
  }

  async function enviarRespuesta() {
    if (!respuesta.trim()) {
      toast.error("Escribe una respuesta antes de enviarla.");
      return;
    }
    setEnviando(true);
    const res = await fetch(`/api/admin/libro-reclamaciones/${id}/responder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respuesta: respuesta.trim() }),
    });
    const data = await res.json().catch(() => null);
    setEnviando(false);
    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo enviar la respuesta.");
      return;
    }
    setReclamo((r) =>
      r ? { ...r, estado: "resuelto", respuesta_proveedor: respuesta.trim(), respondido_at: new Date().toISOString() } : r
    );
    toast.success(
      data.correoEnviado
        ? "Respuesta enviada al consumidor por correo."
        : "Respuesta guardada, pero no se pudo enviar el correo — avísale al consumidor por otro medio."
    );
  }

  if (cargando) return <BrandedLoader />;
  if (!reclamo) return <p className="text-sm text-muted-foreground">Reclamo no encontrado.</p>;

  const badge = BADGE_ESTADO_RECLAMO[reclamo.estado];
  const vencido = reclamoVencido(reclamo);
  const dias = diasHabilesTranscurridos(reclamo.created_at);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/libro-reclamaciones"
        className="flex w-fit items-center gap-1 text-sm font-medium text-secondary"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a libro de reclamaciones
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {LABEL_TIPO_SOLICITUD[reclamo.tipo_solicitud]} {formatCorrelativoReclamo(reclamo.correlativo, reclamo.created_at)}
        </h2>
        <Badge color={badge.color}>{badge.label}</Badge>
      </div>

      {vencido && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-destructive">
          Vencido — han pasado {dias} días hábiles, más del plazo de {PLAZO_DIAS_HABILES} que exige la Ley N.° 29571.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Detalle de la solicitud</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {reclamo.tipo_bien === "servicio" ? "Servicio" : "Producto"} reclamado
                </p>
                <p>{reclamo.bien_descripcion || "—"}</p>
              </div>
              {reclamo.monto_reclamado != null && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Monto reclamado</p>
                  <p>S/.{Number(reclamo.monto_reclamado).toFixed(2)}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Detalle</p>
                <p className="whitespace-pre-wrap">{reclamo.detalle}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Pedido del consumidor</p>
                <p className="whitespace-pre-wrap">{reclamo.pedido_consumidor}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Respuesta del proveedor</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {reclamo.respondido_at && (
                <p className="text-xs text-muted-foreground">
                  Respondido el{" "}
                  {new Date(reclamo.respondido_at).toLocaleDateString("es-PE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
              <Textarea
                rows={6}
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Escribe la respuesta que recibirá el consumidor por correo…"
              />
              <Button onClick={enviarRespuesta} disabled={enviando} className="w-fit">
                {enviando ? "Enviando…" : "Enviar respuesta"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Consumidor</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <p className="font-medium">{reclamo.consumidor_nombre}</p>
              <p className="text-muted-foreground">
                {reclamo.consumidor_tipo_doc} {reclamo.consumidor_num_doc}
              </p>
              <p className="text-muted-foreground">{reclamo.consumidor_email}</p>
              <p className="text-muted-foreground">{reclamo.consumidor_telefono || "Sin teléfono"}</p>
              <p className="text-muted-foreground">{reclamo.consumidor_domicilio || "Sin domicilio"}</p>
              {reclamo.es_menor && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Apoderado: {reclamo.apoderado_nombre} — {reclamo.apoderado_num_doc}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Registrado el{" "}
                {new Date(reclamo.created_at).toLocaleDateString("es-PE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={reclamo.estado === "resuelto" ? "en_proceso" : reclamo.estado}
                disabled={actualizandoEstado || reclamo.estado === "resuelto"}
                onValueChange={(v) => cambiarEstado(v as "pendiente" | "en_proceso")}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_proceso">En proceso</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                Pasa a &quot;Resuelto&quot; automáticamente al enviar la respuesta.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
