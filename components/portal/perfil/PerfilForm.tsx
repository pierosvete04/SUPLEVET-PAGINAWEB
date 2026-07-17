"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { acreditarPuntos } from "@/lib/data/portal/puntos";
import type { ClientePerfil } from "@/lib/data/portal/cliente";
import { NOMBRE_NIVEL } from "@/lib/data/portal/logros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PerfilFormProps {
  user: User;
  perfilInicial: ClientePerfil | null;
  codigoReferido: string;
  nivel: string;
  yaTieneReferido: boolean;
}

export function PerfilForm({ user, perfilInicial, codigoReferido, nivel, yaTieneReferido }: PerfilFormProps) {
  const [form, setForm] = useState({
    nombre: perfilInicial?.nombre ?? "",
    apellido: perfilInicial?.apellido ?? "",
    telefono: perfilInicial?.telefono ?? "",
    direccion: perfilInicial?.direccion ?? "",
    distrito: perfilInicial?.distrito ?? "",
    ciudad: perfilInicial?.ciudad ?? "Lima",
  });
  const [fotoUrl, setFotoUrl] = useState(perfilInicial?.foto_url ?? null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [codigoInvitado, setCodigoInvitado] = useState("");
  const [referidoAplicando, setReferidoAplicando] = useState(false);
  const [referidoMsg, setReferidoMsg] = useState<string | null>(null);
  const [referidoAplicado, setReferidoAplicado] = useState(yaTieneReferido);

  const nombreCompleto = [form.nombre, form.apellido].filter(Boolean).join(" ") || user.email?.split("@")[0] || "";
  const inicial = nombreCompleto.charAt(0).toUpperCase();

  useEffect(() => {
    setGuardado(false);
  }, [form]);

  async function subirFoto(file: File) {
    setSubiendoFoto(true);
    const supabase = createClient();
    const path = `${user.id}/perfil/avatar-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("comunidad-fotos").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("comunidad-fotos").getPublicUrl(path);
      setFotoUrl(data.publicUrl);
      await supabase.from("clientes_perfil").update({ foto_url: data.publicUrl }).eq("id", user.id);
    }
    setSubiendoFoto(false);
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const supabase = createClient();
    const perfilCompleto = !!(form.nombre && form.telefono);

    const { data: perfilAntes } = await supabase
      .from("clientes_perfil")
      .select("perfil_completo")
      .eq("id", user.id)
      .maybeSingle();

    await supabase
      .from("clientes_perfil")
      .update({ ...form, perfil_completo: perfilCompleto })
      .eq("id", user.id);

    if (perfilCompleto && !perfilAntes?.perfil_completo) {
      const { data: yaAcreditado } = await supabase
        .from("suplepuntos_transacciones")
        .select("id")
        .eq("cliente_id", user.id)
        .eq("accion", "perfil_completo")
        .limit(1);
      if (!yaAcreditado || yaAcreditado.length === 0) {
        await acreditarPuntos(supabase, user.id, "perfil_completo", 30, "Perfil completado");
      }
    }

    setGuardando(false);
    setGuardado(true);
  }

  function copiarCodigo() {
    navigator.clipboard.writeText(codigoReferido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function aplicarCodigoInvitado() {
    const codigo = codigoInvitado.trim().toUpperCase();
    if (!codigo) {
      setReferidoMsg("Escribe un código primero");
      return;
    }
    setReferidoAplicando(true);
    setReferidoMsg(null);
    const { data, error } = await createClient().rpc("aplicar_codigo_referido", { p_codigo: codigo });
    setReferidoAplicando(false);
    if (error || !data?.ok) {
      const mensajes: Record<string, string> = {
        invalid_format: "Formato inválido. Ej: SUPLE-A1B2C3",
        own_code: "No puedes usar tu propio código",
        already_referred: "Ya tienes un código de referido aplicado",
        code_not_found: "Código no encontrado. Verifica que esté bien escrito",
      };
      setReferidoMsg(mensajes[data?.error] || "Error al aplicar el código");
      return;
    }
    setReferidoAplicado(true);
    setReferidoMsg("¡Código aplicado! Ganarás 100 pts en tu primera compra 🎁");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-portal-navy">Mi Perfil</h1>
        <p className="text-sm text-portal-muted">Gestiona tu información personal y ajustes de cuenta.</p>
      </div>

      {/* Hero */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl bg-portal-navy p-6 text-white">
        <div className="relative h-20 w-20 shrink-0">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white/15">
            {fotoUrl ? (
              <Image src={fotoUrl} alt="" fill className="rounded-full object-cover" sizes="80px" />
            ) : (
              <span className="font-display text-2xl font-bold">{inicial}</span>
            )}
          </div>
          {/* Fuera del círculo con overflow-hidden de arriba — si va adentro,
              el propio recorte circular del avatar se come la mitad del
              badge al estar pegado a la esquina inferior derecha. Sin borde
              (se perdía contra el navy del fondo) — usa sombra para
              despegarse en su lugar. */}
          <label className="absolute bottom-0 right-0 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-portal-orange shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
            <span className="material-symbols-rounded text-base leading-none text-white">photo_camera</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={subiendoFoto}
              onChange={(e) => e.target.files?.[0] && subirFoto(e.target.files[0])}
            />
          </label>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold">{nombreCompleto || "Sin nombre"}</h2>
          <p className="text-sm text-white/70">{user.email}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-portal-orange">
            {subiendoFoto ? "Subiendo foto…" : NOMBRE_NIVEL[nivel] ?? nivel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={handleGuardar} className="rounded-2xl border border-portal-surface-variant bg-white p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-portal-navy">
              <span className="material-symbols-rounded text-portal-navy">person</span> Datos Personales
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Nombre</Label>
                <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Apellido</Label>
                <Input value={form.apellido} onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Distrito</Label>
                <Input value={form.distrito} onChange={(e) => setForm((f) => ({ ...f, distrito: e.target.value }))} />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label>Dirección</Label>
                <Input value={form.direccion} onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))} />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button type="submit" disabled={guardando} className="bg-portal-orange hover:bg-portal-orange-dark">
                {guardando ? "Guardando…" : "Guardar cambios"}
              </Button>
              {guardado && <span className="text-sm text-green-600">Guardado ✓</span>}
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-portal-orange to-portal-orange-dark p-6 text-white">
            <span className="material-symbols-rounded">redeem</span>
            <h3 className="mt-2 font-display text-lg font-semibold">¡Gana 100 pts!</h3>
            <p className="mt-1 text-sm text-white/85">
              Comparte tu código. Cuando un amigo haga su primera compra, ambos ganan puntos.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/15 p-2">
              <code className="flex-1 truncate px-2 text-sm font-bold tracking-wide">{codigoReferido}</code>
              <button
                type="button"
                onClick={copiarCodigo}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30"
              >
                <span className="material-symbols-rounded text-[16px]">{copiado ? "check" : "content_copy"}</span>
              </button>
            </div>
          </div>

          {!referidoAplicado ? (
            <div className="rounded-2xl border border-portal-surface-variant bg-white p-5">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold text-portal-navy">
                <span className="material-symbols-rounded text-[18px]">group_add</span> ¿Te invitó un amigo?
              </h3>
              <p className="mt-1 text-xs text-portal-muted">
                Ingresa su código y ambos ganarán 100 SuplePoints con tu primera compra.
              </p>
              <div className="mt-3 flex gap-2">
                <Input
                  value={codigoInvitado}
                  onChange={(e) => setCodigoInvitado(e.target.value)}
                  placeholder="CÓDIGO"
                  className="uppercase"
                />
                <Button
                  type="button"
                  disabled={referidoAplicando}
                  onClick={aplicarCodigoInvitado}
                  className="shrink-0 bg-portal-teal-mid hover:bg-portal-teal"
                >
                  {referidoAplicando ? "…" : "Aplicar"}
                </Button>
              </div>
              {referidoMsg && <p className="mt-2 text-xs text-portal-muted">{referidoMsg}</p>}
            </div>
          ) : (
            <div className="rounded-2xl border border-portal-surface-variant bg-white p-5 text-sm text-portal-muted">
              ✅ Ya tienes un código de referido aplicado.
            </div>
          )}

          <Link
            href="/mi-cuenta/libro-reclamaciones"
            className="flex items-center justify-between rounded-2xl border border-portal-surface-variant bg-white p-5 hover:bg-portal-surface-low"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-portal-navy">menu_book</span>
              <div>
                <p className="text-sm font-bold text-portal-navy">Libro de Reclamaciones</p>
                <p className="text-xs text-portal-muted">Atención al consumidor.</p>
              </div>
            </div>
            <span className="material-symbols-rounded text-portal-muted">chevron_right</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
