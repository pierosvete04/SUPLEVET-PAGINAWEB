"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2 } from "lucide-react";
import type { UsuarioSesion } from "@/lib/supabase/usuario";
import { createClient } from "@/lib/supabase/client";
import { uploadPortalFileToR2 } from "@/lib/uploadToR2";
import { acreditarPuntos } from "@/lib/data/portal/puntos";
import type { ClientePerfil } from "@/lib/data/portal/cliente";
import { NOMBRE_NIVEL } from "@/lib/data/portal/logros";
import { TIPOS_DOCUMENTO, type TipoDocumento } from "@/lib/documento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CampoLabel } from "@/components/portal/CampoLabel";
import { SOMBRA_TARJETA, inputBase } from "@/lib/portal/formTokens";
import { PortalIcon } from "@/components/portal/icons/PortalIcon";

interface PerfilFormProps {
  user: UsuarioSesion;
  perfilInicial: ClientePerfil | null;
  codigoReferido: string;
  nivel: string;
  yaTieneReferido: boolean;
  /** Ya tiene al menos una compra acreditada — el bono de referido ya no aplica. */
  yaCompro: boolean;
}

export function PerfilForm({
  user,
  perfilInicial,
  codigoReferido,
  nivel,
  yaTieneReferido,
  yaCompro,
}: PerfilFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: perfilInicial?.nombre ?? "",
    apellido: perfilInicial?.apellido ?? "",
    telefono: perfilInicial?.telefono ?? "",
    direccion: perfilInicial?.direccion ?? "",
    distrito: perfilInicial?.distrito ?? "",
    ciudad: perfilInicial?.ciudad ?? "Lima",
    tipo_documento: perfilInicial?.tipo_documento ?? "dni",
    numero_documento: perfilInicial?.numero_documento ?? "",
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

  // Solo tiene sentido pedir el código de quien te invitó si el cliente
  // todavía puede ganar el bono: acreditar_puntos_pedido_web lo paga
  // únicamente cuando el referido hace su PRIMERA compra. Con una compra ya
  // acreditada el recuadro desaparece sin reemplazo — no hay nada que el
  // cliente pueda hacer al respecto, así que un aviso solo sería ruido.
  const mostrarInputReferido = !referidoAplicado && !yaCompro;

  const nombreCompleto = [form.nombre, form.apellido].filter(Boolean).join(" ") || user.email?.split("@")[0] || "";
  const inicial = nombreCompleto.charAt(0).toUpperCase();

  useEffect(() => {
    setGuardado(false);
  }, [form]);

  async function subirFoto(file: File) {
    setSubiendoFoto(true);
    const url = await uploadPortalFileToR2("comunidad-fotos", file, `${user.id}/perfil`);
    if (url) {
      const supabase = createClient();
      setFotoUrl(url);
      await supabase.from("clientes_perfil").update({ foto_url: url }).eq("id", user.id);
      router.refresh();
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
      .update({
        ...form,
        // El documento es opcional: sin número, el tipo tampoco se guarda
        // (la constraint de la tabla solo acepta null o un tipo válido).
        tipo_documento: form.numero_documento ? form.tipo_documento : null,
        numero_documento: form.numero_documento || null,
        perfil_completo: perfilCompleto,
      })
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
    // El saludo "Hola, {nombre}" del inicio y el sidebar vienen de componentes
    // de servidor (layout.tsx, page.tsx) que Next mantiene cacheados en el
    // cliente — sin este refresh, el nombre viejo se ve hasta recargar a mano.
    router.refresh();
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
        already_purchased: "El bono de referido solo aplica antes de tu primera compra",
        code_not_found: "Código no encontrado. Verifica que esté bien escrito",
      };
      setReferidoMsg(mensajes[data?.error] || "Error al aplicar el código");
      return;
    }
    setReferidoAplicado(true);
    setReferidoMsg("¡Código aplicado! Ganarás 100 pts en tu primera compra.");
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
            <PortalIcon name="photo_camera" className="text-base leading-none text-white" />
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
          <form onSubmit={handleGuardar} className={`rounded-2xl border-0 bg-white p-6 ${SOMBRA_TARJETA}`}>
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-portal-navy">
              <PortalIcon name="person" className="text-portal-navy" /> Datos Personales
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <CampoLabel icono="person">Nombre</CampoLabel>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  className={inputBase}
                />
              </div>
              <div className="grid gap-1.5">
                <CampoLabel icono="badge">Apellido</CampoLabel>
                <Input
                  value={form.apellido}
                  onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
                  className={inputBase}
                />
              </div>
              <div className="grid gap-1.5">
                <CampoLabel icono="call">Teléfono</CampoLabel>
                <Input
                  value={form.telefono}
                  onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                  className={inputBase}
                />
              </div>
              <div className="grid gap-1.5">
                <CampoLabel icono="description">Tipo de documento</CampoLabel>
                <select
                  value={form.tipo_documento}
                  onChange={(e) => setForm((f) => ({ ...f, tipo_documento: e.target.value as TipoDocumento }))}
                  className={inputBase}
                >
                  {TIPOS_DOCUMENTO.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <CampoLabel icono="fingerprint">N° de documento (opcional)</CampoLabel>
                <Input
                  value={form.numero_documento}
                  onChange={(e) => setForm((f) => ({ ...f, numero_documento: e.target.value }))}
                  placeholder="Nos ayuda a validar tu identidad en la entrega"
                  className={inputBase}
                />
              </div>
              <div className="grid gap-1.5">
                <CampoLabel icono="location_on">Distrito</CampoLabel>
                <Input
                  value={form.distrito}
                  onChange={(e) => setForm((f) => ({ ...f, distrito: e.target.value }))}
                  className={inputBase}
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <CampoLabel icono="home">Dirección</CampoLabel>
                <Input
                  value={form.direccion}
                  onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                  className={inputBase}
                />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button
                type="submit"
                disabled={guardando}
                className="h-12 rounded-[17px] bg-portal-orange px-6 text-base font-semibold shadow-md hover:bg-portal-orange-dark"
              >
                {guardando ? "Guardando…" : "Guardar cambios"}
              </Button>
              {guardado && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" strokeWidth={2.5} /> Guardado
                </span>
              )}
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-portal-orange to-portal-orange-dark p-6 text-white">
            <PortalIcon name="redeem" />
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
                <PortalIcon name={copiado ? "check" : "content_copy"} className="text-[16px]" />
              </button>
            </div>
          </div>

          {mostrarInputReferido ? (
            <div className={`rounded-2xl border-0 bg-white p-5 ${SOMBRA_TARJETA}`}>
              <h3 className="flex items-center gap-2 font-display text-base font-semibold text-portal-navy">
                <PortalIcon name="group_add" className="text-[18px]" /> ¿Te invitó un amigo?
              </h3>
              <p className="mt-1 text-xs text-portal-muted">
                Ingresa su código y ambos ganarán 100 SuplePoints con tu primera compra.
              </p>
              <div className="mt-3 flex gap-2">
                <Input
                  value={codigoInvitado}
                  onChange={(e) => setCodigoInvitado(e.target.value)}
                  placeholder="CÓDIGO"
                  className={`${inputBase} uppercase`}
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
          ) : referidoAplicado ? (
            <div className={`flex items-center gap-2 rounded-2xl border-0 bg-white p-5 text-sm text-portal-muted ${SOMBRA_TARJETA}`}>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-portal-teal-mid" strokeWidth={1.75} />
              Ya tienes un código de referido aplicado.
            </div>
          ) : null}

          <Link
            href="/mi-cuenta/libro-reclamaciones"
            className={`flex items-center justify-between rounded-2xl border-0 bg-white p-5 hover:bg-portal-surface-low ${SOMBRA_TARJETA}`}
          >
            <div className="flex items-center gap-2">
              <PortalIcon name="menu_book" className="text-portal-navy" />
              <div>
                <p className="text-sm font-bold text-portal-navy">Libro de Reclamaciones</p>
                <p className="text-xs text-portal-muted">Atención al consumidor.</p>
              </div>
            </div>
            <PortalIcon name="chevron_right" className="text-portal-muted" />
          </Link>
        </div>
      </div>
    </div>
  );
}
