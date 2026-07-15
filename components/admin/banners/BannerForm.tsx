"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Banner } from "@/lib/banners";

interface BannerFormProps {
  banner: Banner | null;
  onClose: () => void;
  onSaved: () => void;
}

const VACIO: Omit<Banner, "id"> = {
  imagen: "",
  imagen_mobile: null,
  enlace: null,
  pagina: "ambas",
  orden: 0,
  activo: true,
};

async function subirA(bucketPath: string, file: File): Promise<string | null> {
  const supabase = createClient();
  const path = `${bucketPath}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("banners-fotos").upload(path, file);
  if (error) return null;
  return supabase.storage.from("banners-fotos").getPublicUrl(path).data.publicUrl;
}

export function BannerForm({ banner, onClose, onSaved }: BannerFormProps) {
  const [form, setForm] = useState<Omit<Banner, "id">>(banner ?? VACIO);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImagen(file: File) {
    setSubiendo(true);
    const url = await subirA("desktop", file);
    if (url) setForm((f) => ({ ...f, imagen: url }));
    setSubiendo(false);
  }

  async function handleImagenMobile(file: File) {
    setSubiendo(true);
    const url = await subirA("mobile", file);
    if (url) setForm((f) => ({ ...f, imagen_mobile: url }));
    setSubiendo(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imagen) {
      setError("La imagen de escritorio es obligatoria.");
      return;
    }
    setGuardando(true);
    setError(null);

    const supabase = createClient();
    const { error: saveError } = banner
      ? await supabase.from("banners").update(form).eq("id", banner.id)
      : await supabase.from("banners").insert(form);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={banner ? "Editar banner" : "Nuevo banner"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="b-imagen">Imagen (escritorio — recomendado 1600×530px, 3:1)</Label>
          <Input
            id="b-imagen"
            type="file"
            accept="image/*"
            disabled={subiendo}
            onChange={(e) => e.target.files?.[0] && handleImagen(e.target.files[0])}
          />
          <p className="text-xs text-muted-foreground">
            Usa una imagen de borde a borde (sin márgenes blancos alrededor del diseño): el banner
            se muestra tal cual, sin recortar ni rellenar espacio.
          </p>
          {form.imagen && (
            <div className="relative h-20 w-full max-w-sm overflow-hidden rounded-md border">
              <Image src={form.imagen} alt="" fill className="object-cover" sizes="320px" />
            </div>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="b-imagen-mobile">Imagen mobile (opcional — recomendado 800×900px, 16:9)</Label>
          <Input
            id="b-imagen-mobile"
            type="file"
            accept="image/*"
            disabled={subiendo}
            onChange={(e) => e.target.files?.[0] && handleImagenMobile(e.target.files[0])}
          />
          {form.imagen_mobile && (
            <div className="relative h-20 w-32 overflow-hidden rounded-md border">
              <Image src={form.imagen_mobile} alt="" fill className="object-cover" sizes="128px" />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Si no subes una imagen mobile, se usa la de escritorio en todos los tamaños de pantalla.
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="b-enlace">Enlace al hacer clic (opcional)</Label>
          <Input
            id="b-enlace"
            placeholder="/productos/suplevet-150g"
            value={form.enlace ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, enlace: e.target.value || null }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>Página donde se muestra</Label>
            <Select
              value={form.pagina}
              onValueChange={(v) => setForm((f) => ({ ...f, pagina: v as Banner["pagina"] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ambas">Productos y Ofertas</SelectItem>
                <SelectItem value="productos">Solo Productos</SelectItem>
                <SelectItem value="ofertas">Solo Ofertas</SelectItem>
                <SelectItem value="home">Nuevas presentaciones (Home)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="b-orden">Orden</Label>
            <Input
              id="b-orden"
              type="number"
              value={form.orden}
              onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.activo}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, activo: checked === true }))}
          />
          Activo (visible en la tienda)
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={guardando || subiendo} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
