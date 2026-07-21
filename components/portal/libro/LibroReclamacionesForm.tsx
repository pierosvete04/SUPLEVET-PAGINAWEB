"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ClientePerfil } from "@/lib/data/portal/cliente";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

// Decreto Supremo N.° 011-2011-PCM · Ley N.° 29571 — datos legales del proveedor.
const PROVEEDOR = {
  razonSocial: "Nutrova for Pets S.A.C.",
  ruc: "20613665995",
  domicilio: "Calle Río Elba 132, La Molina, Lima",
  email: "ventas@suplevet.pe",
};

interface LibroReclamacionesFormProps {
  user: User | null;
  perfil: ClientePerfil | null;
}

function formatCorrelativo(n: number): string {
  return `${new Date().getFullYear()}-${String(n).padStart(6, "0")}`;
}

export function LibroReclamacionesForm({ user, perfil }: LibroReclamacionesFormProps) {
  const [tipoSolicitud, setTipoSolicitud] = useState<"reclamo" | "queja">("reclamo");
  const [tipoBien, setTipoBien] = useState<"producto" | "servicio">("producto");
  const [nombre, setNombre] = useState([perfil?.nombre, perfil?.apellido].filter(Boolean).join(" "));
  const [tipoDoc, setTipoDoc] = useState("DNI");
  const [numDoc, setNumDoc] = useState("");
  const [telefono, setTelefono] = useState(perfil?.telefono ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [domicilio, setDomicilio] = useState(perfil?.direccion ?? "");
  const [esMenor, setEsMenor] = useState(false);
  const [apoderadoNombre, setApoderadoNombre] = useState("");
  const [apoderadoDoc, setApoderadoDoc] = useState("");
  const [bienDesc, setBienDesc] = useState("");
  const [monto, setMonto] = useState("");
  const [detalle, setDetalle] = useState("");
  const [pedido, setPedido] = useState("");
  const [acepto, setAcepto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState<number | null>(null);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user, email]);

  const linkMailto = useMemo(() => {
    const asunto = `Libro de Reclamaciones — ${tipoSolicitud === "queja" ? "Queja" : "Reclamo"} de ${nombre || "cliente"}`;
    const cuerpo = `HOJA DE RECLAMACIÓN
Tipo: ${tipoSolicitud === "queja" ? "Queja" : "Reclamo"}

— CONSUMIDOR —
Nombre: ${nombre}
Documento: ${tipoDoc} ${numDoc}
Correo: ${email}
Teléfono: ${telefono}
Domicilio: ${domicilio}

— BIEN CONTRATADO —
Tipo: ${tipoBien}
Descripción: ${bienDesc}
Monto reclamado (S/): ${monto}

— DETALLE —
${detalle}

— PEDIDO DEL CONSUMIDOR —
${pedido}`;
    return `mailto:${PROVEEDOR.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  }, [tipoSolicitud, tipoBien, nombre, tipoDoc, numDoc, email, telefono, domicilio, bienDesc, monto, detalle, pedido]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return setError("Ingresa tu nombre completo");
    if (!numDoc.trim()) return setError("Ingresa tu número de documento");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Ingresa un correo electrónico válido");
    if (esMenor && (!apoderadoNombre.trim() || !apoderadoDoc.trim())) {
      return setError("Ingresa nombre y documento del apoderado");
    }
    if (!detalle.trim()) return setError("Describe el detalle de tu solicitud");
    if (!pedido.trim()) return setError("Indica qué solicitas");
    if (!acepto) return setError("Debes aceptar la declaración para continuar");

    setError(null);
    setEnviando(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("libro_reclamaciones")
      .insert({
        cliente_id: user?.id ?? null,
        tipo_solicitud: tipoSolicitud,
        consumidor_nombre: nombre.trim(),
        consumidor_tipo_doc: tipoDoc,
        consumidor_num_doc: numDoc.trim(),
        consumidor_telefono: telefono.trim() || null,
        consumidor_email: email.trim(),
        consumidor_domicilio: domicilio.trim() || null,
        es_menor: esMenor,
        apoderado_nombre: esMenor ? apoderadoNombre.trim() || null : null,
        apoderado_num_doc: esMenor ? apoderadoDoc.trim() || null : null,
        tipo_bien: tipoBien,
        bien_descripcion: bienDesc.trim() || null,
        monto_reclamado: monto ? parseFloat(monto) : null,
        detalle: detalle.trim(),
        pedido_consumidor: pedido.trim(),
      })
      .select("correlativo")
      .maybeSingle();
    setEnviando(false);

    if (insertError) {
      setError("No se pudo registrar. Intenta de nuevo o usa el envío por correo.");
      return;
    }
    setExito(data?.correlativo ?? 0);
  }

  if (exito !== null) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-[var(--radius-card)] bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="h-14 w-14 text-green-500" strokeWidth={1.5} />
        <h2 className="font-display text-xl font-bold text-secondary">Registramos tu solicitud</h2>
        {exito > 0 && (
          <p className="font-body text-sm text-muted-foreground">
            N.° <strong>{formatCorrelativo(exito)}</strong>
          </p>
        )}
        <p className="font-body text-sm text-muted-foreground">
          Responderemos en un plazo máximo de 15 días hábiles a tu correo.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="rounded-[var(--radius-card)] bg-white p-5 shadow-sm">
        <p className="font-body text-xs font-bold uppercase text-muted-foreground">Datos del proveedor</p>
        <p className="mt-1 font-body text-sm text-secondary">
          {PROVEEDOR.razonSocial} — RUC {PROVEEDOR.ruc}
        </p>
        <p className="font-body text-xs text-muted-foreground">{PROVEEDOR.domicilio}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-[var(--radius-card)] bg-white p-6 shadow-sm">
        <div className="flex gap-2">
          {(["reclamo", "queja"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipoSolicitud(t)}
              className={`flex-1 rounded-[17px] border-2 py-2 font-body text-sm font-bold capitalize ${
                tipoSolicitud === t ? "border-primary bg-primary/10 text-secondary" : "border-border text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Nombre completo</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label>Tipo doc.</Label>
              <Input value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>N° documento</Label>
              <Input value={numDoc} onChange={(e) => setNumDoc(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Correo</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Teléfono</Label>
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Domicilio</Label>
            <Input value={domicilio} onChange={(e) => setDomicilio(e.target.value)} />
          </div>
        </div>

        <label className="flex items-center gap-2 font-body text-sm text-secondary">
          <Checkbox checked={esMenor} onCheckedChange={(c) => setEsMenor(c === true)} />
          El consumidor es menor de edad
        </label>
        {esMenor && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Nombre del apoderado</Label>
              <Input value={apoderadoNombre} onChange={(e) => setApoderadoNombre(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Documento del apoderado</Label>
              <Input value={apoderadoDoc} onChange={(e) => setApoderadoDoc(e.target.value)} />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {(["producto", "servicio"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setTipoBien(b)}
              className={`flex-1 rounded-[17px] border-2 py-2 font-body text-sm font-bold capitalize ${
                tipoBien === b ? "border-primary bg-primary/10 text-secondary" : "border-border text-muted-foreground"
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Descripción del bien/servicio</Label>
            <Input value={bienDesc} onChange={(e) => setBienDesc(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Monto reclamado (S/, opcional)</Label>
            <Input type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label>Detalle</Label>
          <Textarea rows={4} value={detalle} onChange={(e) => setDetalle(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Pedido del consumidor</Label>
          <Textarea rows={2} value={pedido} onChange={(e) => setPedido(e.target.value)} />
        </div>

        <label className="flex items-start gap-2 font-body text-xs text-muted-foreground">
          <Checkbox checked={acepto} onCheckedChange={(c) => setAcepto(c === true)} className="mt-0.5" />
          Declaro que la información proporcionada es veraz y autorizo su tratamiento conforme a la Ley N.° 29733.
        </label>

        {error && <p className="font-body text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar solicitud"}
          </Button>
          <a href={linkMailto} className="font-body text-xs font-bold text-muted-foreground underline">
            O envía una copia por correo
          </a>
        </div>
      </form>
    </div>
  );
}
