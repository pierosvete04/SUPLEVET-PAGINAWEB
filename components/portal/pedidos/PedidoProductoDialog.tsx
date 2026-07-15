"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Clock, Star, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { acreditarPuntos } from "@/lib/data/portal/puntos";
import { trackEvent } from "@/lib/analytics";
import { formatFecha } from "@/lib/portal/formato";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { EstadoResena } from "@/lib/resenas";

const TEXTO_MIN = 50;
const PUNTOS_RESENA = 20;

interface ResenaExistente {
  estado: EstadoResena;
  calificacion: number;
  texto: string;
}

interface PedidoEstadoInfo {
  texto: string;
  bg: string;
  color: string;
}

interface PedidoProductoDialogProps {
  clienteId: string;
  pedidoId: string;
  pedidoNumero: string;
  pedidoFecha: string;
  pedidoEstado: PedidoEstadoInfo;
  productoShopifyId: string | null;
  productoNombre: string;
  productoImagen: string | null;
  cantidad: number;
  precio: number;
  puedeResenar: boolean;
  resenaExistente: ResenaExistente | null;
}

const ESTADO_RESENA_BADGE: Record<EstadoResena, { icon: typeof CheckCircle2; texto: string; color: string }> = {
  pendiente: { icon: Clock, texto: "Reseña en revisión", color: "text-muted-foreground" },
  aprobada: { icon: CheckCircle2, texto: "Reseña publicada", color: "text-green-700" },
  rechazada: { icon: XCircle, texto: "Reseña rechazada", color: "text-destructive" },
};

export function PedidoProductoDialog({
  clienteId,
  pedidoId,
  pedidoNumero,
  pedidoFecha,
  pedidoEstado,
  productoShopifyId,
  productoNombre,
  productoImagen,
  cantidad,
  precio,
  puedeResenar,
  resenaExistente,
}: PedidoProductoDialogProps) {
  const [abierto, setAbierto] = useState(false);
  const [resena, setResena] = useState(resenaExistente);
  const [calificacion, setCalificacion] = useState(0);
  const [hoverCalificacion, setHoverCalificacion] = useState(0);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cerrar() {
    setAbierto(false);
    setCalificacion(0);
    setHoverCalificacion(0);
    setTexto("");
    setError(null);
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!productoShopifyId) return;
    if (calificacion < 1) {
      setError("Selecciona una calificación");
      return;
    }
    if (texto.trim().length < TEXTO_MIN) {
      setError(`El comentario debe tener al menos ${TEXTO_MIN} caracteres (llevas ${texto.trim().length})`);
      return;
    }

    setEnviando(true);
    setError(null);
    const supabase = createClient();

    const { data: perfil } = await supabase
      .from("clientes_perfil")
      .select("nombre, apellido, ciudad")
      .eq("id", clienteId)
      .maybeSingle();

    const clienteNombre = [perfil?.nombre, perfil?.apellido].filter(Boolean).join(" ") || null;

    const { error: insertError } = await supabase.from("resenas").insert({
      cliente_id: clienteId,
      pedido_id: pedidoId,
      producto_shopify_id: productoShopifyId,
      producto_nombre: productoNombre,
      calificacion,
      texto: texto.trim(),
      cliente_nombre: clienteNombre,
      cliente_ciudad: perfil?.ciudad ?? null,
      puntos_acreditados: true,
    });

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Ya dejaste una reseña para este producto en este pedido"
          : insertError.message
      );
      setEnviando(false);
      return;
    }

    await acreditarPuntos(
      supabase,
      clienteId,
      "resena_producto",
      PUNTOS_RESENA,
      `Reseña: ${productoNombre}`,
      pedidoId
    );

    trackEvent("submit_review", {
      item_slug: productoShopifyId,
      item_name: productoNombre,
      calificacion,
    });

    const textoEnviado = texto.trim();
    setEnviando(false);
    setResena({ estado: "pendiente", calificacion, texto: textoEnviado });
    setCalificacion(0);
    setTexto("");
  }

  const badge = resena ? ESTADO_RESENA_BADGE[resena.estado] : null;
  const Icono = badge?.icon;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={`shrink-0 rounded-full px-3 py-1.5 font-body text-[11px] font-bold transition-colors ${
          badge
            ? `bg-soft-gray ${badge.color}`
            : puedeResenar
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-soft-gray text-muted-foreground hover:bg-border"
        }`}
      >
        {badge && Icono ? (
          <span className="flex items-center gap-1">
            <Icono className="h-3.5 w-3.5" strokeWidth={1.75} />
            {badge.texto}
          </span>
        ) : puedeResenar ? (
          "Dejar reseña"
        ) : (
          "Ver detalle"
        )}
      </button>

      <Dialog open={abierto} onOpenChange={(o) => !o && cerrar()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del producto</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-soft-gray p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                {productoImagen ? (
                  <Image src={productoImagen} alt={productoNombre} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">📦</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm font-bold text-secondary">{productoNombre}</p>
                <p className="font-body text-xs text-muted-foreground">
                  {cantidad > 1 ? `${cantidad} unidades · ` : ""}S/ {precio.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-xs font-bold text-secondary">{pedidoNumero}</p>
                <p className="font-body text-[11px] text-muted-foreground">{formatFecha(pedidoFecha)}</p>
              </div>
              <span
                className="rounded-full px-3 py-1 font-body text-[11px] font-bold"
                style={{ background: pedidoEstado.bg, color: pedidoEstado.color }}
              >
                {pedidoEstado.texto}
              </span>
            </div>

            {resena ? (
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star
                        key={v}
                        className="h-4 w-4"
                        fill={v <= resena.calificacion ? "#EA8C43" : "none"}
                        color={v <= resena.calificacion ? "#EA8C43" : "#d1d5db"}
                      />
                    ))}
                  </div>
                  {badge && Icono && (
                    <span className={`flex items-center gap-1 font-body text-[11px] font-bold ${badge.color}`}>
                      <Icono className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {badge.texto}
                    </span>
                  )}
                </div>
                <p className="mt-2 font-body text-sm text-secondary">{resena.texto}</p>
              </div>
            ) : puedeResenar && productoShopifyId ? (
              <form onSubmit={handleEnviar} className="flex flex-col gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((valor) => (
                    <button
                      key={valor}
                      type="button"
                      aria-label={`${valor} estrella${valor > 1 ? "s" : ""}`}
                      onClick={() => setCalificacion(valor)}
                      onMouseEnter={() => setHoverCalificacion(valor)}
                      onMouseLeave={() => setHoverCalificacion(0)}
                    >
                      <Star
                        className="h-7 w-7"
                        strokeWidth={1.5}
                        fill={valor <= (hoverCalificacion || calificacion) ? "#EA8C43" : "none"}
                        color={valor <= (hoverCalificacion || calificacion) ? "#EA8C43" : "#d1d5db"}
                      />
                    </button>
                  ))}
                </div>

                <div className="grid gap-1.5">
                  <Textarea
                    rows={4}
                    placeholder="Cuéntanos tu experiencia con el producto…"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                  />
                  <p className="font-body text-xs text-muted-foreground">
                    {texto.trim().length}/{TEXTO_MIN} caracteres mínimo
                  </p>
                </div>

                {error && <p className="font-body text-sm text-destructive">{error}</p>}

                <Button type="submit" disabled={enviando} className="ml-auto">
                  {enviando ? "Enviando…" : "Enviar reseña"}
                </Button>
              </form>
            ) : (
              <p className="font-body text-sm text-muted-foreground">
                Podrás dejar tu reseña cuando el pedido esté entregado.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
