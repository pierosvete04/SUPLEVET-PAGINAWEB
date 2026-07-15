"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart/CartContext";
import { trackEvent } from "@/lib/analytics";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { ShippingStep, direccionVacia, type DireccionEnvio } from "@/components/checkout/ShippingStep";
import { PaymentStep, type MetodoPago } from "@/components/checkout/PaymentStep";
import { OrderSummary, type DescuentoAplicado } from "@/components/checkout/OrderSummary";
import { zonaEnvioSlug, type EnvioZona } from "@/lib/shipping";

export default function CheckoutPage() {
  const {
    items,
    subtotal,
    removeItem,
    cargando: carritoCargando,
    colorRegaloSeleccionado,
    setColorRegaloSeleccionado,
  } = useCart();
  const router = useRouter();

  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [direccion, setDireccion] = useState<DireccionEnvio>(direccionVacia);
  const [zona, setZona] = useState<EnvioZona | undefined>(undefined);
  const [costoEnvio, setCostoEnvio] = useState<number | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [errorPedido, setErrorPedido] = useState<string | null>(null);
  const [descuento, setDescuento] = useState<DescuentoAplicado | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
      setCargandoSesion(false);
      if (data.user) precargarDesdePerfil(supabase, data.user.id);
    });
  }, []);

  // Precarga nombre/apellidos/teléfono/dirección desde el perfil del portal
  // (clientes_perfil) — el cliente ya está registrado (obligatorio para
  // comprar), así que estos campos ya no son "registro" sino solo datos de
  // facturación/envío que confirma o ajusta, no que escribe desde cero.
  async function precargarDesdePerfil(supabase: ReturnType<typeof createClient>, userId: string) {
    const { data: perfil } = await supabase
      .from("clientes_perfil")
      .select("nombre, apellido, telefono, direccion")
      .eq("id", userId)
      .maybeSingle();
    if (!perfil) return;
    setDireccion((d) => ({
      ...d,
      nombre: d.nombre || perfil.nombre || "",
      apellidos: d.apellidos || perfil.apellido || "",
      telefono: d.telefono || perfil.telefono || "",
      direccion: d.direccion || perfil.direccion || "",
    }));
  }

  useEffect(() => {
    if (!carritoCargando && items.length === 0 && !procesando) {
      router.replace("/carrito");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carritoCargando, items.length]);

  function handleLoginExitoso(user: User) {
    setUsuario(user);
    precargarDesdePerfil(createClient(), user.id);
  }

  const direccionCompleta =
    !!direccion.nombre &&
    !!direccion.apellidos &&
    !!direccion.direccion &&
    !!direccion.departamento &&
    !!direccion.provincia &&
    !!direccion.distrito &&
    !!direccion.telefono &&
    !!direccion.metodoEnvio;
  const puedeConfirmar = direccionCompleta && !!zona && costoEnvio !== null && !!metodoPago;

  // Registra el pedido de verdad en `pedidos` vía RPC (registrar_pedido_web) —
  // el INSERT directo está restringido a is_admin() por RLS (la tabla nació
  // para el sync de Shopify), así que un SECURITY DEFINER lo hace en nombre
  // del cliente autenticado. Queda con estado_pago "pendiente_verificacion"
  // hasta que el equipo confirme el Yape/Plin/transferencia manualmente.
  async function handleConfirmarPedido() {
    if (!puedeConfirmar || !metodoPago || !usuario) return;
    setProcesando(true);
    setErrorPedido(null);
    const supabase = createClient();

    // Guarda los datos confirmados de vuelta en el perfil del portal, para que
    // la próxima compra (o visita a /mi-cuenta/perfil) ya los tenga precargados.
    supabase
      .from("clientes_perfil")
      .update({
        nombre: direccion.nombre,
        apellido: direccion.apellidos,
        telefono: direccion.telefono,
        direccion: direccion.direccion,
        distrito: direccion.distrito,
        ciudad: direccion.departamento,
        perfil_completo: true,
      })
      .eq("id", usuario.id)
      .then(() => {});

    const { data, error } = await supabase.rpc("registrar_pedido_web", {
      p_cliente_id: usuario.id,
      p_productos: items.map((i) => ({ nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, sku: i.slug })),
      p_subtotal: subtotal,
      p_costo_envio: costoEnvio ?? 0,
      p_forma_pago: metodoPago,
      p_codigo_descuento: descuento?.codigo ?? null,
      p_zona_envio: zona ? zonaEnvioSlug(zona.nombre) : null,
      p_direccion_envio: {
        direccion: direccion.direccion,
        direccionSecundaria: direccion.direccionSecundaria,
        distrito: direccion.distrito,
        provincia: direccion.provincia,
        departamento: direccion.departamento,
        codigoPostal: direccion.codigoPostal,
        metodoEnvio: direccion.metodoEnvio,
      },
      p_cliente_nombre: `${direccion.nombre} ${direccion.apellidos}`.trim(),
      p_cliente_telefono: direccion.telefono,
    });

    if (error || !data?.ok) {
      setErrorPedido(data?.error ?? "No se pudo registrar el pedido, intenta de nuevo.");
      setProcesando(false);
      return;
    }

    // El correo se manda desde el servidor (RESEND_API_KEY no puede vivir en
    // el navegador) — si falla, no debe bloquear la confirmación del pedido,
    // que ya quedó registrado en la BD.
    fetch("/api/checkout/confirmar-pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedidoId: data.pedido_id }),
    }).catch(() => {});

    trackEvent("purchase", {
      transaction_id: data.numero,
      value: data.total,
      metodo_pago: metodoPago,
      items: items.map((i) => ({ item_slug: i.slug, item_name: i.nombre, quantity: i.cantidad })),
    });

    sessionStorage.setItem(
      "ultimo_pedido",
      JSON.stringify({
        numero: data.numero,
        metodo: metodoPago,
        total: data.total,
        nombre: `${direccion.nombre} ${direccion.apellidos}`.trim(),
        telefono: direccion.telefono,
        direccionTexto: [
          direccion.direccion,
          direccion.distrito,
          direccion.provincia,
          direccion.departamento,
        ]
          .filter(Boolean)
          .join(", "),
        metodoEnvio: direccion.metodoEnvio === "shalom" ? "Agencia Shalom" : "Delivery motorizado",
        productos: items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad })),
        colorRegalo: colorRegaloSeleccionado,
      })
    );
    items.forEach((i) => removeItem(i.slug));
    setColorRegaloSeleccionado(null);
    router.push("/checkout/exito");
  }

  if (cargandoSesion || carritoCargando || items.length === 0) return null;

  if (!usuario) {
    return (
      <div className="mx-auto max-w-3xl px-mobile-margin py-section-y md:px-gutter">
        <LoginPanel next="/checkout" onAuthenticated={handleLoginExitoso} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-mobile-margin py-section-y md:px-gutter">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-secondary">Contacto</h2>
            <span className="font-body text-sm text-secondary">{usuario.email}</span>
          </div>

          <ShippingStep
            subtotal={subtotal}
            value={direccion}
            onChange={setDireccion}
            onZonaChange={(z, costo) => {
              setZona(z);
              setCostoEnvio((anterior) => {
                if (anterior !== costo) setDescuento(null);
                return costo;
              });
            }}
          />

          <PaymentStep metodo={metodoPago} onChange={setMetodoPago} />

          {errorPedido && <p className="font-body text-sm text-destructive">{errorPedido}</p>}

          <button
            type="button"
            disabled={!puedeConfirmar || procesando}
            onClick={handleConfirmarPedido}
            className="w-full rounded-full bg-primary px-6 py-3.5 font-body font-bold text-primary-foreground disabled:opacity-50 sm:w-fit"
          >
            {procesando ? "Procesando…" : "Pagar ahora"}
          </button>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            envio={costoEnvio}
            clienteId={usuario.id}
            descuento={descuento}
            onDescuentoChange={setDescuento}
          />
        </div>
      </div>
    </div>
  );
}
