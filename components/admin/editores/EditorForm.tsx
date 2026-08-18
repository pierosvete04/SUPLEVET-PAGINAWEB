"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { consultarDocumento } from "@/lib/documento";
import { generarPassword } from "@/lib/admin/generar-password";
import { generarCorreoEditor } from "@/lib/admin/generar-correo-editor";

interface EditorFormProps {
  onClose: () => void;
  onSaved: () => void;
}

export function EditorForm({ onClose, onSaved }: EditorFormProps) {
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(generarPassword);
  const [consultandoDni, setConsultandoDni] = useState(false);
  const [errorDni, setErrorDni] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState(false);

  // Trae el nombre real desde RENIEC (vía Decolecta) para no depender de que
  // el admin lo tipee bien — así el editor queda registrado con su identidad
  // verificada, igual que se hace con el cliente en el checkout.
  async function consultarDni() {
    if (dni.length !== 8 || consultandoDni) return;
    setConsultandoDni(true);
    setErrorDni(null);
    const { datos, error: errorConsulta } = await consultarDocumento("dni", dni);
    if (datos) {
      setNombre(datos.nombreCompleto);
      // Correo interno, nunca a mano: nombre de pila + apellido paterno, tal
      // cual vienen separados de RENIEC (no de nombreCompleto, que ya viene
      // junto y sería más difícil de partir bien).
      setEmail(generarCorreoEditor(datos.nombre, datos.apellidos));
    } else {
      setErrorDni(errorConsulta);
    }
    setConsultandoDni(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const res = await fetch("/api/admin/editores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, dni, email, password }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      setError(data?.error ?? "No se pudo crear el editor.");
      setGuardando(false);
      return;
    }

    toast.success("Editor creado.");
    setCreado(true);
    setGuardando(false);
  }

  // Tras crear la cuenta, se muestran las credenciales una sola vez (la
  // contraseña no queda guardada en ningún lado) antes de cerrar el modal.
  if (creado) {
    return (
      <Modal titulo="Editor creado" onClose={onSaved}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Pásale estas credenciales al editor. Entra en <strong>/admin/login</strong>, igual que cualquier
            cuenta del panel.
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
          <Button onClick={onSaved} className="w-fit">
            Listo
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal titulo="Nuevo editor" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="e-dni">DNI</Label>
          <div className="flex gap-2">
            <Input
              id="e-dni"
              required
              inputMode="numeric"
              maxLength={8}
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
              placeholder="8 dígitos"
              className="max-w-40"
            />
            <Button type="button" variant="outline" disabled={dni.length !== 8 || consultandoDni} onClick={consultarDni}>
              {consultandoDni ? "Consultando…" : "Consultar RENIEC"}
            </Button>
          </div>
          {errorDni && <p className="text-xs text-destructive">{errorDni}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="e-nombre">Nombre</Label>
          <Input id="e-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <p className="text-xs text-muted-foreground">Se completa solo al consultar el DNI — igual se puede editar.</p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="e-email">Correo (usuario para iniciar sesión)</Label>
          <Input
            id="e-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre.apellido@suplevetedit.pe"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Se genera solo al consultar el DNI (nombre.apellido@suplevetedit.pe) — no es un correo real, es solo su
            usuario para entrar al panel. Edítalo si ya existe otro editor con el mismo nombre.
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="e-password">Contraseña</Label>
          <div className="flex gap-2">
            <Input
              id="e-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-mono"
            />
            <Button type="button" variant="outline" onClick={() => setPassword(generarPassword())}>
              Generar
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={guardando} className="w-fit">
          {guardando ? "Creando…" : "Crear editor"}
        </Button>
      </form>
    </Modal>
  );
}
