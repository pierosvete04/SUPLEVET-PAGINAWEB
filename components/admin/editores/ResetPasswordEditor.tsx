"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { generarPassword } from "@/lib/admin/generar-password";

interface ResetPasswordEditorProps {
  editorId: string;
  email: string;
  onClose: () => void;
}

// El editor no tiene forma de cambiar su propia contraseña (no hay "olvidé mi
// contraseña" en /admin/login) — este es el único camino: el admin genera
// una nueva y se la pasa por su cuenta. Pide confirmación aparte porque es
// irreversible al toque: la contraseña anterior deja de servir de inmediato.
export function ResetPasswordEditor({ editorId, email, onClose }: ResetPasswordEditorProps) {
  const [password, setPassword] = useState(generarPassword);
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  async function guardar() {
    setConfirmando(false);
    setGuardando(true);
    setError(null);
    const res = await fetch(`/api/admin/editores/${editorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo cambiar la contraseña.");
      setGuardando(false);
      return;
    }
    toast.success("Contraseña actualizada.");
    setListo(true);
    setGuardando(false);
  }

  if (listo) {
    return (
      <Modal titulo="Contraseña actualizada" onClose={onClose}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Pásale la nueva contraseña al editor — la anterior ya no funciona.
          </p>
          <div className="flex flex-col gap-2 rounded-md border bg-soft-gray p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Correo: </span>
              <strong>{email}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Contraseña: </span>
              <strong className="font-mono">{password}</strong>
            </p>
          </div>
          <Button onClick={onClose} className="w-fit">
            Listo
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal titulo="Restablecer contraseña" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Se reemplaza la contraseña de <strong>{email}</strong> por esta — el editor deja de poder entrar con la
          anterior de inmediato.
        </p>
        <div className="flex gap-2">
          <Input value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} className="font-mono" />
          <Button type="button" variant="outline" onClick={() => setPassword(generarPassword())}>
            Generar
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={() => setConfirmando(true)} disabled={guardando || password.length < 8} className="w-fit">
          {guardando ? "Guardando…" : "Confirmar cambio"}
        </Button>
      </div>

      <AlertDialog open={confirmando} onOpenChange={(open) => !open && setConfirmando(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar la contraseña de {email}?</AlertDialogTitle>
            <AlertDialogDescription>
              La contraseña anterior deja de funcionar de inmediato. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction disabled={guardando} onClick={guardar}>
              Sí, cambiar contraseña
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Modal>
  );
}
