"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MapPin, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { departamentosCheckout } from "@/lib/shipping";
import { provinciasPorDepartamento, distritosPorProvincia } from "@/lib/data/ubigeo";
import { coordenadasDesdeUrl, formatCoordenadas, linkMaps, tieneCoordenadas } from "@/lib/ubicacion";

export interface DireccionEnvioPedidoAdmin {
  direccion?: string;
  direccionSecundaria?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  codigoPostal?: string;
  metodoEnvio?: string;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  lat?: number | null;
  lng?: number | null;
}

interface DireccionEnvioCardProps {
  pedidoId: string;
  direccion: DireccionEnvioPedidoAdmin | null;
  zonaEnvio: string | null;
  onGuardado: () => void;
}

const VACIA: DireccionEnvioPedidoAdmin = {
  direccion: "",
  direccionSecundaria: "",
  departamento: "",
  provincia: "",
  distrito: "",
};

// El cliente puede no haber dejado dirección (pedidos viejos de Shopify, ventas
// por WhatsApp cargadas a mano) o haberla escrito mal. Esta tarjeta deja
// completarla desde el panel sin tocar la base a mano, y pegar la ubicación de
// Google Maps para que el courier reciba el punto exacto.
export function DireccionEnvioCard({
  pedidoId,
  direccion,
  zonaEnvio,
  onGuardado,
}: DireccionEnvioCardProps) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<DireccionEnvioPedidoAdmin>({ ...VACIA, ...direccion });
  const [linkPegado, setLinkPegado] = useState("");
  const [errorLink, setErrorLink] = useState<string | null>(null);
  const [resolviendo, setResolviendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const provincias = provinciasPorDepartamento[form.departamento ?? ""] ?? [];
  const distritos = form.provincia
    ? distritosPorProvincia[`${form.departamento}::${form.provincia}`] ?? []
    : [];
  const coords = tieneCoordenadas(form) ? form : null;

  function setCampo<K extends keyof DireccionEnvioPedidoAdmin>(
    campo: K,
    valor: DireccionEnvioPedidoAdmin[K]
  ) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function setDepartamento(nuevo: string) {
    const nuevasProvincias = provinciasPorDepartamento[nuevo] ?? [];
    setForm((f) => ({
      ...f,
      departamento: nuevo,
      provincia: nuevasProvincias.length === 1 ? nuevasProvincias[0] : "",
      distrito: "",
    }));
  }

  // Acepta el link largo de Maps, un par de coordenadas pegado a secas, o el
  // link corto (maps.app.goo.gl) que llega por WhatsApp desde el celular. Los
  // dos primeros se resuelven en el navegador; el corto necesita seguir el
  // redirect, y eso solo se puede hacer desde el servidor (CORS).
  async function aplicarLink() {
    const texto = linkPegado.trim();
    const local = coordenadasDesdeUrl(texto);
    if (local) {
      setErrorLink(null);
      setLinkPegado("");
      setForm((f) => ({ ...f, lat: local.lat, lng: local.lng }));
      return;
    }

    setResolviendo(true);
    setErrorLink(null);
    try {
      const r = await fetch("/api/admin/direcciones/resolver-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: texto }),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok) {
        setLinkPegado("");
        setForm((f) => ({ ...f, lat: d.lat, lng: d.lng }));
      } else {
        setErrorLink(d?.error ?? "No encontramos coordenadas. Pega el link de Maps o «lat, lng».");
      }
    } catch {
      setErrorLink("Error de conexión al resolver el link.");
    } finally {
      setResolviendo(false);
    }
  }

  async function guardar() {
    setGuardando(true);
    // Se conserva lo que ya traía el pedido (metodoEnvio, documento) para no
    // borrarlo al reescribir el jsonb completo.
    const actualizada: DireccionEnvioPedidoAdmin = { ...direccion, ...form };
    await createClient()
      .from("pedidos")
      .update({ direccion_envio: actualizada })
      .eq("id", pedidoId);
    setGuardando(false);
    setEditando(false);
    onGuardado();
  }

  async function copiarLink() {
    if (!coords) return;
    try {
      await navigator.clipboard.writeText(linkMaps(coords));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Clipboard bloqueado (contexto no seguro): el link sigue visible en el botón "Abrir".
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm text-muted-foreground">Dirección de envío</CardTitle>
        {!editando && (
          <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
            <Pencil className="h-3.5 w-3.5" /> {direccion?.direccion ? "Editar" : "Agregar"}
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {!editando ? (
          <>
            {direccion?.direccion ? (
              <p className="text-sm">
                {[
                  direccion.direccion,
                  direccion.direccionSecundaria,
                  direccion.distrito,
                  direccion.provincia,
                  direccion.departamento,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin dirección registrada{zonaEnvio ? ` — zona: ${zonaEnvio}` : ""}.
              </p>
            )}

            {coords ? (
              <div className="flex flex-wrap items-center gap-2 rounded-md bg-soft-gray p-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-green-600" strokeWidth={2} />
                <span className="font-mono text-xs">{formatCoordenadas(coords)}</span>
                <div className="ml-auto flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={linkMaps(coords)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" onClick={copiarLink}>
                    {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiado ? "Copiado" : "Copiar link"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sin ubicación exacta. Edita para pegar el link de Google Maps y dárselo al courier.
              </p>
            )}
          </>
        ) : (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="dir-calle">Dirección</Label>
              <Input
                id="dir-calle"
                value={form.direccion ?? ""}
                onChange={(e) => setCampo("direccion", e.target.value)}
                placeholder="Av. Ejemplo 123"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="dir-sec">Interior / referencia</Label>
              <Input
                id="dir-sec"
                value={form.direccionSecundaria ?? ""}
                onChange={(e) => setCampo("direccionSecundaria", e.target.value)}
                placeholder="Dpto. 402, casa de reja verde"
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Región</Label>
              <Select value={form.departamento || undefined} onValueChange={setDepartamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir región" />
                </SelectTrigger>
                <SelectContent>
                  {departamentosCheckout.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Ciudad</Label>
              <Select
                value={form.provincia || undefined}
                disabled={provincias.length === 0}
                onValueChange={(v) => setForm((f) => ({ ...f, provincia: v, distrito: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elegir ciudad" />
                </SelectTrigger>
                <SelectContent>
                  {provincias.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Distrito</Label>
              <Select
                value={form.distrito || undefined}
                disabled={distritos.length === 0}
                onValueChange={(v) => setCampo("distrito", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elegir distrito" />
                </SelectTrigger>
                <SelectContent>
                  {distritos.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5 border-t pt-3">
              <Label htmlFor="dir-maps">Ubicación de Google Maps</Label>
              <div className="flex gap-2">
                <Input
                  id="dir-maps"
                  value={linkPegado}
                  onChange={(e) => {
                    setLinkPegado(e.target.value);
                    setErrorLink(null);
                  }}
                  placeholder="Pega el link de Maps o «-12.046, -77.042»"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={aplicarLink}
                  disabled={!linkPegado.trim() || resolviendo}
                >
                  {resolviendo ? "…" : "Usar"}
                </Button>
              </div>
              {errorLink && <p className="text-xs text-destructive">{errorLink}</p>}
              {coords && (
                <p className="flex items-center gap-1 text-xs text-green-700">
                  <Check className="h-3.5 w-3.5" /> Ubicación: {formatCoordenadas(coords)}
                </p>
              )}
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button onClick={guardar} disabled={guardando}>
                {guardando ? "Guardando…" : "Guardar dirección"}
              </Button>
              <Button
                variant="outline"
                disabled={guardando}
                onClick={() => {
                  setForm({ ...VACIA, ...direccion });
                  setErrorLink(null);
                  setLinkPegado("");
                  setEditando(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
