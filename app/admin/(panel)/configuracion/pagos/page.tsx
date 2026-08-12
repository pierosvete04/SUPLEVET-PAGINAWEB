"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { uploadFileToR2 } from "@/lib/uploadToR2";
import { QR_YAPE_POR_DEFECTO } from "@/lib/configuracion-cliente";
import { Campo, ConfiguracionSeccion } from "@/components/admin/configuracion/ConfiguracionSeccion";
import { useConfiguracionAdmin } from "@/components/admin/configuracion/useConfiguracionAdmin";

// Datos de los pagos manuales del checkout.
//
// Hasta ahora este formulario era decorativo: guardaba en configuracion_sitio
// unas columnas que ninguna página leía, mientras el checkout mostraba los
// datos bancarios escritos a mano en components/checkout/PaymentStep.tsx. Se
// podía llenar todo, salía "guardado", y el cliente seguía viendo lo de antes.
// Ahora el checkout lee de acá, así que lo que se escriba en esta página SÍ es
// lo que ve quien va a pagar — conviene revisarlo dos veces antes de guardar.
export default function ConfiguracionPagosPage() {
  const { config, actualizar, guardar, guardando, subiendo, setSubiendo } = useConfiguracionAdmin();

  async function subirQr(file: File) {
    setSubiendo(true);
    const url = await uploadFileToR2("productos-web-fotos", file, "configuracion");
    if (url) actualizar("yape_plin_qr_url", url);
    setSubiendo(false);
  }

  if (!config) return <BrandedLoader />;

  return (
    <ConfiguracionSeccion
      titulo="Métodos de pago"
      descripcion="Estos datos son los que ve el cliente en el checkout al elegir Yape/Plin o transferencia."
      guardando={guardando || subiendo}
      onGuardar={guardar}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Yape / Plin</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              id="yp-numero"
              label="Número"
              value={config.yape_plin_numero ?? ""}
              onChange={(v) => actualizar("yape_plin_numero", v)}
              ayuda="Se muestra tal cual lo escribas. Ej: 943 116 820"
            />
            <Campo
              id="yp-titular"
              label="Titular"
              value={config.yape_plin_titular ?? ""}
              onChange={(v) => actualizar("yape_plin_titular", v)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="yp-qr">Código QR</Label>
            <Input
              id="yp-qr"
              type="file"
              accept="image/*"
              disabled={subiendo}
              onChange={(e) => e.target.files?.[0] && subirQr(e.target.files[0])}
            />
            {/* La vista previa muestra el QR EN USO, no solo el subido. Antes
                solo aparecía si había uno en la base, y como nunca se subió
                ninguno el recuadro salía vacío — daba a entender que el
                checkout no tenía QR, cuando sí lo tiene: usa el archivo que
                viene con el sitio. Enseñar el que realmente ve el cliente es
                lo que hace que esta pantalla sirva para comprobar algo. */}
            <div className="mt-1 flex items-center gap-3">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-white">
                <Image
                  src={config.yape_plin_qr_url || QR_YAPE_POR_DEFECTO}
                  alt="Código QR de Yape"
                  fill
                  className="object-contain p-1"
                  sizes="96px"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {config.yape_plin_qr_url
                  ? "QR personalizado. Es el que ve el cliente al pagar con Yape/Plin."
                  : "Es el QR que viene con el sitio y el que ve el cliente hoy. Sube uno para reemplazarlo."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Cuenta bancaria (transferencia)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo
            id="banco-nombre"
            label="Banco"
            value={config.banco_nombre ?? ""}
            onChange={(v) => actualizar("banco_nombre", v)}
          />
          <Campo
            id="banco-titular"
            label="Titular"
            value={config.banco_titular ?? ""}
            onChange={(v) => actualizar("banco_titular", v)}
          />
          <Campo
            id="banco-cuenta"
            label="N° de cuenta"
            value={config.banco_cuenta ?? ""}
            onChange={(v) => actualizar("banco_cuenta", v)}
          />
          <Campo
            id="banco-cci"
            label="CCI"
            value={config.banco_cci ?? ""}
            onChange={(v) => actualizar("banco_cci", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Envío del comprobante</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo
            id="pago-wa"
            label="WhatsApp"
            value={config.pago_whatsapp_comprobantes ?? ""}
            onChange={(v) => actualizar("pago_whatsapp_comprobantes", v)}
            ayuda="Formato internacional sin +. Ej: 51920723721"
          />
          <Campo
            id="pago-correo"
            label="Correo"
            value={config.pago_correo_comprobantes ?? ""}
            onChange={(v) => actualizar("pago_correo_comprobantes", v)}
          />
        </CardContent>
      </Card>
    </ConfiguracionSeccion>
  );
}
