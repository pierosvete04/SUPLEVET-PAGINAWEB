"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface LinkQrCodeProps {
  link: string;
  size?: number;
  className?: string;
}

// QR genérico para cualquier link (WhatsApp, etc.) — se regenera si `link`
// cambia (ej. el mensaje predeterminado incluye datos del pedido/formulario).
// errorCorrectionLevel "H" (máximo) + quiet zone estándar (margin 4) para que
// se pueda escanear de forma confiable con la cámara del celular — un QR
// chico o con margen apretado falla mucho al escanear en la práctica.
export function LinkQrCode({ link, size = 160, className = "" }: LinkQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    QRCode.toDataURL(link, { width: size * 3, margin: 4, errorCorrectionLevel: "H" })
      .then((url) => !cancelado && setDataUrl(url))
      .catch(() => !cancelado && setDataUrl(null));
    return () => {
      cancelado = true;
    };
  }, [link, size]);

  if (!dataUrl) {
    return (
      <div
        className={`animate-pulse rounded-md bg-soft-gray ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="Código QR para abrir WhatsApp"
      width={size}
      height={size}
      className={`rounded-md border border-border ${className}`}
    />
  );
}
