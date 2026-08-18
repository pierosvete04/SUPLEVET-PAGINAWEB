"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CuponForm, type Cupon } from "@/components/admin/cupones/CuponForm";
import { PedidosPorCupones } from "@/components/admin/editores/PedidosPorCupones";
import { ResetPasswordEditor } from "@/components/admin/editores/ResetPasswordEditor";
import { TransferirCartera } from "@/components/admin/editores/TransferirCartera";
import { ClientesAsignados } from "@/components/admin/editores/ClientesAsignados";

interface EditorPerfil {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
}

const LABEL_TIPO: Record<Cupon["tipo"], string> = {
  envio_gratis: "Envío gratis",
  pct_envio: "% envío",
  pct_producto: "% producto",
  monto_fijo_producto: "Monto fijo producto",
};

export default function AdminEditorDetallePage() {
  const params = useParams<{ id: string }>();
  const [editor, setEditor] = useState<EditorPerfil | null>(null);
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [cargando, setCargando] = useState(true);
  const [creandoCupon, setCreandoCupon] = useState(false);
  const [editandoCupon, setEditandoCupon] = useState<Cupon | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [restableciendoPassword, setRestableciendoPassword] = useState(false);
  const [transfiriendo, setTransfiriendo] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const supabase = createClient();
    const [{ data: resumen }, { data: cuponesData }] = await Promise.all([
      supabase.from("editores_resumen").select("id, nombre, email, activo").eq("id", params.id).maybeSingle(),
      supabase.from("cupones").select("*").eq("editor_id", params.id).order("created_at", { ascending: false }),
    ]);
    setEditor(resumen as EditorPerfil | null);
    setCupones((cuponesData as Cupon[]) ?? []);
    setCargando(false);
  }, [params.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function toggleActivo() {
    if (!editor) return;
    setCambiandoEstado(true);
    const res = await fetch(`/api/admin/editores/${editor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !editor.activo }),
    });
    if (!res.ok) {
      toast.error("No se pudo cambiar el estado del editor.");
      setCambiandoEstado(false);
      return;
    }
    toast.success(editor.activo ? "Editor desactivado." : "Editor activado.");
    await cargar();
    setCambiandoEstado(false);
  }

  const codigos = cupones.map((c) => c.codigo);

  if (cargando && !editor) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }
  if (!editor) {
    return <p className="text-sm text-muted-foreground">Editor no encontrado.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/editores" className="flex w-fit items-center gap-1 text-sm font-medium text-secondary">
        <ArrowLeft className="h-4 w-4" /> Volver a editores
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{editor.nombre}</h2>
            <Badge color={editor.activo ? "verde" : "gris"}>{editor.activo ? "Activo" : "Inactivo"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{editor.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setTransfiriendo(true)}>
            Transferir cartera
          </Button>
          <Button variant="outline" onClick={() => setRestableciendoPassword(true)}>
            Restablecer contraseña
          </Button>
          <Button variant="outline" onClick={toggleActivo} disabled={cambiandoEstado}>
            {editor.activo ? "Desactivar" : "Activar"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Cupones</h3>
            <Button size="sm" onClick={() => setCreandoCupon(true)}>
              <Plus className="h-4 w-4" /> Nuevo cupón
            </Button>
          </div>
          {cupones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cupones todavía.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cupones.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setEditandoCupon(c)}
                  className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-soft-gray"
                >
                  <span className="font-mono font-medium">{c.codigo}</span>
                  <span className="text-muted-foreground">
                    {LABEL_TIPO[c.tipo]}
                    {c.tipo !== "envio_gratis" && ` · ${c.tipo.startsWith("pct") ? `${c.valor}%` : `S/.${c.valor}`}`}
                  </span>
                  <Badge color={c.activo ? "verde" : "gris"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PedidosPorCupones codigos={codigos} linkDetalle={(p) => `/admin/pedidos/${p.numero_pedido ?? p.id}`} />

      <ClientesAsignados editorId={editor.id} codigosCupon={codigos} puedeAsignar />

      {(creandoCupon || editandoCupon) && (
        <CuponForm
          cupon={editandoCupon}
          editorId={editor.id}
          onClose={() => {
            setCreandoCupon(false);
            setEditandoCupon(null);
          }}
          onSaved={() => {
            setCreandoCupon(false);
            setEditandoCupon(null);
            cargar();
          }}
        />
      )}

      {restableciendoPassword && (
        <ResetPasswordEditor
          editorId={editor.id}
          email={editor.email}
          onClose={() => setRestableciendoPassword(false)}
        />
      )}

      {transfiriendo && (
        <TransferirCartera
          editorId={editor.id}
          editorNombre={editor.nombre}
          cuponesCount={cupones.length}
          onClose={() => setTransfiriendo(false)}
          onTransferido={() => {
            setTransfiriendo(false);
            cargar();
          }}
        />
      )}
    </div>
  );
}
