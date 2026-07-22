"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart/CartContext";
import { trackEvent } from "@/lib/analytics";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { ShippingStep, direccionVacia, type DireccionEnvio } from "@/components/checkout/ShippingStep";
import { PaymentStep, type MetodoPago } from "@/components/checkout/PaymentStep";
import { OrderSummary, type DescuentoAplicado } from "@/components/checkout/OrderSummary";
import { esDepartamentoProvincia, zonaEnvioSlug, type EnvioZona } from "@/lib/shipping";
import { TODOS_LOS_METODOS_PAGO as TODOS_LOS_METODOS } from "@/lib/data/productos-shared";
import type { TipoDocumento } from "@/lib/documento";

export default function CheckoutPage() {
  const {
    items,
    subtotal,
    removeItem,
    cargando: carritoCargando,
    bandanaRegaloSeleccionada,
    setBandanaRegaloSeleccionada,
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
      .select(
        "nombre, apellido, telefono, direccion, distrito, ciudad, provincia, codigo_postal, lat, lng, tipo_documento, numero_documento"
      )
      .eq("id", userId)
      .maybeSingle();
    if (!perfil) return;
    setDireccion((d) => ({
      ...d,
      nombre: d.nombre || perfil.nombre || "",
      apellidos: d.apellidos || perfil.apellido || "",
      telefono: d.telefono || perfil.telefono || "",
      direccion: d.direccion || perfil.direccion || "",
      // "ciudad" en clientes_perfil guarda en realidad el departamento (nombre
      // heredado de cuando Lima era una sola zona) — provincia y distrito son
      // columnas propias. Sin department no hay zona de envío que calcular, así
      // que los 4 campos van juntos: de nada sirve precargar el distrito si el
      // departamento se queda vacío.
      departamento: d.departamento || perfil.ciudad || "",
      provincia: d.provincia || perfil.provincia || "",
      distrito: d.distrito || perfil.distrito || "",
      codigoPostal: d.codigoPostal || perfil.codigo_postal || "",
      lat: d.lat ?? perfil.lat ?? null,
      lng: d.lng ?? perfil.lng ?? null,
      tipoDocumento: d.numeroDocumento ? d.tipoDocumento : (perfil.tipo_documento as TipoDocumento) || d.tipoDocumento,
      numeroDocumento: d.numeroDocumento || perfil.numero_documento || "",
    }));
  }

  useEffect(() => {
    if (!carritoCargando && items.length === 0 && !procesando) {
      router.replace("/carrito");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carritoCargando, items.length]);

  // Intersección de métodos admitidos por todos los items del carrito — si
  // hay un combo (solo Yape/transferencia) junto a un producto individual
  // (los 3 métodos), el pedido completo queda limitado a lo que admiten
  // todos los items a la vez (el más restrictivo manda).
  // Contra entrega además solo aplica donde llega el motorizado propio
  // (Lima Metropolitana / Callao) — en provincia el envío va por Agencia
  // Shalom, que no cobra a nombre nuestro, así que el pedido debe venir pagado.
  const metodosPermitidos = useMemo(() => {
    const porProducto = items.reduce<MetodoPago[]>(
      (acc, item) => acc.filter((m) => (item.metodosPagoPermitidos ?? TODOS_LOS_METODOS).includes(m)),
      TODOS_LOS_METODOS
    );
    const contraEntregaDisponible =
      !!direccion.departamento &&
      !esDepartamentoProvincia(direccion.departamento) &&
      direccion.metodoEnvio === "motorizado";
    return contraEntregaDisponible ? porProducto : porProducto.filter((m) => m !== "contra_entrega");
  }, [items, direccion.departamento, direccion.metodoEnvio]);

  // Si el carrito cambia (se agrega un combo, se quita un producto, etc.) y
  // el método ya elegido deja de estar permitido, hay que pedirle que elija
  // de nuevo en vez de dejar seleccionada una opción inválida.
  useEffect(() => {
    if (metodoPago && !metodosPermitidos.includes(metodoPago)) {
      setMetodoPago(null);
    }
  }, [metodosPermitidos, metodoPago]);

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

  // Mismo cálculo que OrderSummary — se replica acá solo para mostrarle al
  // cliente cuánto tener listo si paga contra entrega.
  const envioFinal = descuento ? descuento.costoEnvioFinal : costoEnvio;
  const totalPedido =
    envioFinal === null ? null : Math.max(subtotal - (descuento?.descuentoSubtotal ?? 0), 0) + envioFinal;

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
        provincia: direccion.provincia,
        codigo_postal: direccion.codigoPostal || null,
        lat: direccion.lat,
        lng: direccion.lng,
        tipo_documento: direccion.numeroDocumento ? direccion.tipoDocumento : null,
        numero_documento: direccion.numeroDocumento || null,
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
        // Se guarda también en el pedido (no solo en el perfil) para que el
        // rótulo refleje el documento con el que se hizo ESE envío, aunque el
        // cliente lo cambie después en su perfil.
        tipoDocumento: direccion.numeroDocumento ? direccion.tipoDocumento : null,
        numeroDocumento: direccion.numeroDocumento || null,
        // Coordenadas de Google Places: es lo que se le pasa al courier para
        // que llegue al punto exacto y no a la manzana aproximada.
        lat: direccion.lat,
        lng: direccion.lng,
      },
      p_cliente_nombre: `${direccion.nombre} ${direccion.apellidos}`.trim(),
      p_cliente_telefono: direccion.telefono,
      p_regalo_bandana: bandanaRegaloSeleccionada,
    });

    if (error || !data?.ok) {
      setErrorPedido(data?.error ?? "No se pudo registrar el pedido, intenta de nuevo.");
      setProcesando(false);
      return;
    }

    // Tarjeta no se confirma acá — el pedido queda registrado como
    // "pendiente_verificacion" y el cliente se va a Mercado Pago a pagar de
    // verdad. El webhook (app/api/webhooks/mercadopago) es quien decide si
    // el pago quedó aprobado o rechazado; /checkout/exito relee ese estado
    // en vez de asumir éxito por haber llegado hasta acá.
    if (metodoPago === "tarjeta") {
      const respuestaMp = await fetch("/api/checkout/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId: data.pedido_id }),
      });
      const cuerpoMp = await respuestaMp.json().catch(() => null);

      if (!respuestaMp.ok || !cuerpoMp?.initPoint) {
        setErrorPedido(
          cuerpoMp?.error ??
            `No se pudo iniciar el pago con tarjeta. Tu pedido ${data.numero} quedó registrado — escríbenos por WhatsApp para completarlo.`
        );
        setProcesando(false);
        return;
      }

      trackEvent("purchase", {
        transaction_id: data.numero,
        value: data.total,
        metodo_pago: metodoPago,
        items: items.map((i) => ({ item_slug: i.slug, item_name: i.nombre, quantity: i.cantidad })),
      });
      items.forEach((i) => removeItem(i.slug));
      setBandanaRegaloSeleccionada(null);
      window.location.href = cuerpoMp.initPoint;
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
        regaloBandana: bandanaRegaloSeleccionada,
      })
    );
    items.forEach((i) => removeItem(i.slug));
    setBandanaRegaloSeleccionada(null);
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

          <PaymentStep
            metodo={metodoPago}
            onChange={setMetodoPago}
            metodosPermitidos={metodosPermitidos}
            totalACobrar={totalPedido}
          />

          {errorPedido && <p className="font-body text-sm text-destructive">{errorPedido}</p>}

          <button
            type="button"
            disabled={!puedeConfirmar || procesando}
            onClick={handleConfirmarPedido}
            className="w-full rounded-[17px] bg-primary px-6 py-3.5 font-body font-bold text-white disabled:opacity-50 sm:w-fit"
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
            bandanaRegaloSlug={bandanaRegaloSeleccionada}
          />
        </div>
      </div>
    </div>
  );
}
