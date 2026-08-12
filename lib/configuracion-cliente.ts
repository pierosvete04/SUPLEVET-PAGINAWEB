import { siteConfig } from "@/lib/site-config";
import type { ConfiguracionSitio } from "@/lib/data/configuracion";

// Subconjunto de configuracion_sitio que consumen los componentes cliente
// (Header, Footer, WhatsAppFloat, Faq, formularios de contacto…).
//
// Vive en su propio módulo, separado del hook, porque lo necesitan los DOS
// lados: app/layout.tsx (servidor) lo arma a partir de la fila de Supabase, y
// el contexto (componentes cliente) lo consume. Si el mapeo viviera dentro del
// hook "use client", el servidor no podría reutilizarlo y habría dos versiones
// del mismo mapeo destinadas a desincronizarse.
export interface ConfiguracionSitioCliente {
  whatsappB2C: string;
  whatsappB2B: string;
  whatsappDistribuidores: string;
  correoContacto: string;
  horarioAtencion: string;
  legalRazonSocial: string;
  legalRuc: string;
  legalDomicilioFiscal: string;
  legalCorreoAtencion: string[];
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  pago: DatosPago;
}

/** Datos que el checkout muestra para los pagos manuales. */
export interface DatosPago {
  yapeNumero: string;
  yapeTitular: string;
  yapeQrUrl: string;
  bancoNombre: string;
  bancoTitular: string;
  bancoCuenta: string;
  bancoCci: string;
  whatsappComprobantes: string;
  correoComprobantes: string;
}

// Los valores que estuvieron escritos a mano en PaymentStep.tsx hasta que se
// conectó el checkout a la base. Siguen acá como respaldo: si la consulta de
// configuración fallara, el cliente ve los datos correctos igual. Un checkout
// que muestra una cuenta bancaria vacía es peor que uno que muestra la de
// siempre.
const PAGO_POR_DEFECTO: DatosPago = {
  yapeNumero: "943 116 820",
  yapeTitular: "Piero Paolo Svete Anchante",
  yapeQrUrl: "/pago/yape-qr.png",
  bancoNombre: "Interbank",
  bancoTitular: "Nutrova For Pets",
  bancoCuenta: "200-3006830577",
  bancoCci: "003-200-003006830577-37",
  whatsappComprobantes: "51920723721",
  correoComprobantes: "suplevetperu@gmail.com",
};

/** Valores de site-config.ts, usados cuando el campo está vacío en la base o si
 *  la consulta falla — ningún componente queda nunca sin dato que mostrar. */
export const CONFIGURACION_POR_DEFECTO: ConfiguracionSitioCliente = {
  whatsappB2C: siteConfig.whatsappB2C,
  whatsappB2B: siteConfig.whatsappB2B,
  whatsappDistribuidores: siteConfig.whatsappDistribuidores,
  correoContacto: siteConfig.correoContacto,
  horarioAtencion: siteConfig.horarioAtencion,
  legalRazonSocial: siteConfig.legal.razonSocial,
  legalRuc: siteConfig.legal.ruc,
  legalDomicilioFiscal: siteConfig.legal.domicilioFiscal,
  legalCorreoAtencion: [...siteConfig.legal.correoAtencion],
  facebookUrl: siteConfig.redesSociales.facebook,
  instagramUrl: siteConfig.redesSociales.instagram,
  tiktokUrl: siteConfig.redesSociales.tiktok,
  linkedinUrl: siteConfig.redesSociales.linkedin,
  pago: PAGO_POR_DEFECTO,
};

/** Fila de configuracion_sitio -> forma que consumen los componentes cliente. */
export function mapConfiguracionCliente(
  data: ConfiguracionSitio | null
): ConfiguracionSitioCliente {
  if (!data) return CONFIGURACION_POR_DEFECTO;

  const d = CONFIGURACION_POR_DEFECTO;
  return {
    whatsappB2C: data.whatsapp_b2c || d.whatsappB2C,
    whatsappB2B: data.whatsapp_b2b || d.whatsappB2B,
    whatsappDistribuidores: data.whatsapp_distribuidores || d.whatsappDistribuidores,
    correoContacto: data.correo_contacto || d.correoContacto,
    horarioAtencion: data.horario_atencion || d.horarioAtencion,
    legalRazonSocial: data.legal_razon_social || d.legalRazonSocial,
    legalRuc: data.legal_ruc || d.legalRuc,
    legalDomicilioFiscal: data.legal_domicilio_fiscal || d.legalDomicilioFiscal,
    legalCorreoAtencion: data.legal_correo_atencion
      ? data.legal_correo_atencion.split(",").map((c) => c.trim())
      : d.legalCorreoAtencion,
    facebookUrl: data.facebook_url || d.facebookUrl,
    instagramUrl: data.instagram_url || d.instagramUrl,
    tiktokUrl: data.tiktok_url || d.tiktokUrl,
    linkedinUrl: data.linkedin_url || d.linkedinUrl,
    pago: {
      yapeNumero: data.yape_plin_numero || d.pago.yapeNumero,
      yapeTitular: data.yape_plin_titular || d.pago.yapeTitular,
      yapeQrUrl: data.yape_plin_qr_url || d.pago.yapeQrUrl,
      bancoNombre: data.banco_nombre || d.pago.bancoNombre,
      bancoTitular: data.banco_titular || d.pago.bancoTitular,
      bancoCuenta: data.banco_cuenta || d.pago.bancoCuenta,
      bancoCci: data.banco_cci || d.pago.bancoCci,
      whatsappComprobantes: data.pago_whatsapp_comprobantes || d.pago.whatsappComprobantes,
      correoComprobantes: data.pago_correo_comprobantes || d.pago.correoComprobantes,
    },
  };
}
