"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Destino {
  id: string;
  nombre: string;
  esYoMismo?: boolean;
}

interface TransferirCarteraProps {
  editorId: string;
  editorNombre: string;
  cuponesCount: number;
  onClose: () => void;
  onTransferido: () => void;
}

// Mueve TODOS los cupones de este editor a otro dueño — mismos códigos, así
// que no cambia nada para el cliente que ya los tiene. Solo cambia quién
// recibe el crédito de las ventas de ahora en adelante.
export function TransferirCartera({
  editorId,
  editorNombre,
  cuponesCount,
  onClose,
  onTransferido,
}: TransferirCarteraProps) {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [destinoId, setDestinoId] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [transfiriendo, setTransfiriendo] = useState(false);

  useEffect(() => {
    async function cargarDestinos() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [{ data: yo }, { data: otrosEditores }] = await Promise.all([
        user
          ? supabase.from("admins").select("id, nombre").eq("id", user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("editores_resumen")
          .select("id, nombre")
          .eq("activo", true)
          .neq("id", editorId)
          .order("nombre"),
      ]);

      const lista: Destino[] = [];
      if (yo) lista.push({ id: yo.id, nombre: `Yo mismo (${yo.nombre})`, esYoMismo: true });
      lista.push(...((otrosEditores as { id: string; nombre: string }[]) ?? []));
      setDestinos(lista);
    }
    cargarDestinos();
  }, [editorId]);

  async function transferir() {
    if (!destinoId) return;
    setTransfiriendo(true);
    const { error } = await createClient()
      .from("cupones")
      .update({ editor_id: destinoId })
      .eq("editor_id", editorId);
    setTransfiriendo(false);
    setConfirmando(false);
    if (error) {
      toast.error("No se pudo transferir la cartera.");
      return;
    }
    toast.success("Cartera transferida.");
    onTransferido();
  }

  const destino = destinos.find((d) => d.id === destinoId);

  return (
    <Modal titulo="Transferir cartera" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Mueve los {cuponesCount} cupón{cuponesCount === 1 ? "" : "es"} de <strong>{editorNombre}</strong> a otro
          dueño. Los códigos siguen siendo los mismos — solo cambia quién recibe el crédito de las ventas de ahora en
          adelante.
        </p>

        {cuponesCount === 0 ? (
          <p className="text-sm text-muted-foreground">Este editor no tiene cupones que transferir.</p>
        ) : (
          <>
            <Select value={destinoId} onValueChange={setDestinoId}>
              <SelectTrigger>
                <SelectValue placeholder="Elige a quién transferir" />
              </SelectTrigger>
              <SelectContent>
                {destinos.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => setConfirmando(true)} disabled={!destinoId} className="w-fit">
              Transferir
            </Button>
          </>
        )}
      </div>

      <AlertDialog open={confirmando} onOpenChange={(open) => !open && setConfirmando(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Transferir {cuponesCount} cupón{cuponesCount === 1 ? "" : "es"} a {destino?.nombre}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editorNombre} deja de recibir crédito por las ventas hechas con esos códigos desde ahora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction disabled={transfiriendo} onClick={transferir}>
              Sí, transferir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Modal>
  );
}
