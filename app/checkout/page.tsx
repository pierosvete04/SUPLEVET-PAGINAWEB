"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart/CartContext";
import { OtpLogin } from "@/components/checkout/OtpLogin";
import { ShippingStep, type DireccionEnvio } from "@/components/checkout/ShippingStep";
import { PaymentStep, type MetodoPago } from "@/components/checkout/PaymentStep";
import { OrderSummary } from "@/components/checkout/OrderSummary";

type Paso = "identificacion" | "envio" | "pago";

const pasos: { id: Paso; label: string }[] = [
  { id: "identificacion", label: "01. Identificación" },
  { id: "envio", label: "02. Envío" },
  { id: "pago", label: "03. Pago" },
];

export default function CheckoutPage() {
  const { items, subtotal, removeItem, cargando: carritoCargando } = useCart();
  const router = useRouter();

  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [paso, setPaso] = useState<Paso>("identificacion");
  const [direccion, setDireccion] = useState<DireccionEnvio | null>(null);
  const [costoEnvio, setCostoEnvio] = useState<number | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
      if (data.user) setPaso("envio");
      setCargandoSesion(false);
    });
  }, []);

  useEffect(() => {
    if (!carritoCargando && items.length === 0 && !procesando) {
      router.replace("/carrito");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carritoCargando, items.length]);

  function handleLoginExitoso() {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUsuario(data.user));
    setPaso("envio");
  }

  function handleEnvioContinuar(dir: DireccionEnvio) {
    setDireccion(dir);
    const esLima = dir.departamento === "Lima";
    const umbral = esLima ? 150 : 350;
    const tarifa = esLima ? 15 : 25;
    setCostoEnvio(subtotal >= umbral ? 0 : tarifa);
    setPaso("pago");
  }

  // Simulación de confirmación de pedido — no existe todavía la tabla
  // `pedidos` en Supabase (Fase 1), así que esto no persiste nada real aún.
  // Cuando exista, acá va el insert + RPC `registrar_pedido_web` (PLAN.md 8.5).
  function handleConfirmarPedido(metodo: MetodoPago) {
    setProcesando(true);
    const numeroPedido = `W-${Math.floor(1000 + Math.random() * 9000)}`;
    sessionStorage.setItem(
      "ultimo_pedido",
      JSON.stringify({ numero: numeroPedido, metodo, total: subtotal + (costoEnvio ?? 0) })
    );
    setTimeout(() => {
      items.forEach((i) => removeItem(i.slug));
      router.push("/checkout/exito");
    }, 800);
  }

  if (cargandoSesion || carritoCargando || items.length === 0) return null;

  return (
    <div className="mx-auto max-w-container px-mobile-margin py-section-y md:px-gutter">
      <div className="mb-10 flex justify-center gap-8 border-b border-border pb-4">
        {pasos.map((p) => (
          <span
            key={p.id}
            className={`font-impact text-sm tracking-wide ${
              paso === p.id ? "border-b-2 border-primary pb-4 text-secondary" : "text-muted-foreground"
            }`}
          >
            {p.label}
          </span>
        ))}
      </div>

      {paso === "identificacion" && !usuario && <OtpLogin onSuccess={handleLoginExitoso} />}

      {paso === "envio" && (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ShippingStep subtotal={subtotal} onContinuar={handleEnvioContinuar} />
          </div>
          <OrderSummary items={items} subtotal={subtotal} />
        </div>
      )}

      {paso === "pago" && (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {direccion && (
              <p className="mb-6 font-body text-sm text-muted-foreground">
                Enviando a {direccion.direccion}, {direccion.distrito}, {direccion.provincia}
              </p>
            )}
            <PaymentStep onConfirmar={handleConfirmarPedido} procesando={procesando} />
          </div>
          <OrderSummary items={items} subtotal={subtotal} envio={costoEnvio} />
        </div>
      )}
    </div>
  );
}
