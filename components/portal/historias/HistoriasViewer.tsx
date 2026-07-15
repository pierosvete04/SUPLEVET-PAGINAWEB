"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Historia } from "@/lib/data/portal/historias";
import type { PerfilComunidad } from "@/lib/data/portal/comunidad";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface HistoriaConAutor extends Historia {
  autor: PerfilComunidad | null;
}

interface HistoriasViewerProps {
  user: User;
}

export function HistoriasViewer({ user }: HistoriasViewerProps) {
  const [historias, setHistorias] = useState<HistoriaConAutor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierta, setAbierta] = useState<HistoriaConAutor | null>(null);
  const [nuevaAbierta, setNuevaAbierta] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [texto, setTexto] = useState("");
  const [publicando, setPublicando] = useState(false);

  async function cargar() {
    const supabase = createClient();
    const { data } = await supabase
      .from("stories")
      .select("*")
      .eq("activa", true)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    const lista = (data as Historia[]) ?? [];
    const clienteIds = [...new Set(lista.map((h) => h.cliente_id))];
    const { data: perfiles } = clienteIds.length
      ? await supabase.from("v_comunidad_perfiles").select("*").in("cliente_id", clienteIds)
      : { data: [] as PerfilComunidad[] };
    const perfilesPorId = new Map((perfiles ?? []).map((p) => [p.cliente_id, p]));

    setHistorias(lista.map((h) => ({ ...h, autor: perfilesPorId.get(h.cliente_id) ?? null })));
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  async function abrir(h: HistoriaConAutor) {
    setAbierta(h);
    const supabase = createClient();
    await supabase.from("story_views").insert({ story_id: h.id, viewer_id: user.id }).select().maybeSingle();
  }

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    if (!fotoFile) return;
    setPublicando(true);
    const supabase = createClient();
    const path = `${user.id}/historias/${Date.now()}-${fotoFile.name}`;
    const { error } = await supabase.storage.from("comunidad-fotos").upload(path, fotoFile);
    if (!error) {
      const { data } = supabase.storage.from("comunidad-fotos").getPublicUrl(path);
      await supabase.from("stories").insert({
        cliente_id: user.id,
        foto_url: data.publicUrl,
        texto: texto.trim() || null,
      });
    }
    setPublicando(false);
    setNuevaAbierta(false);
    setFotoFile(null);
    setTexto("");
    cargar();
  }

  if (cargando) {
    return <p className="font-body text-sm text-muted-foreground">Cargando…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => setNuevaAbierta(true)}
          className="flex h-28 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-[var(--radius-card)] border-2 border-dashed border-border bg-white text-muted-foreground"
        >
          <Plus className="h-6 w-6" strokeWidth={1.5} />
          <span className="font-body text-[10px] font-bold">Nueva historia</span>
        </button>

        {historias.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => abrir(h)}
            className="relative h-28 w-24 shrink-0 overflow-hidden rounded-[var(--radius-card)] border-2 border-primary"
          >
            {h.foto_url && <Image src={h.foto_url} alt="" fill className="object-cover" sizes="96px" />}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
              <p className="truncate font-body text-[9px] font-bold text-white">
                {h.autor?.nombre_display ?? "Cliente"}
              </p>
            </div>
          </button>
        ))}

        {historias.length === 0 && (
          <p className="flex flex-1 items-center font-body text-sm text-muted-foreground">
            Sin historias activas — publica la primera.
          </p>
        )}
      </div>

      {abierta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setAbierta(null)}
        >
          <button
            type="button"
            onClick={() => setAbierta(null)}
            className="absolute right-4 top-4 text-white/80 hover:text-white"
          >
            <X className="h-8 w-8" />
          </button>
          <div className="relative max-h-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            {abierta.foto_url && (
              <Image
                src={abierta.foto_url}
                alt=""
                width={480}
                height={854}
                className="max-h-[85vh] w-auto rounded-lg object-contain"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 rounded-b-lg bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="font-body text-sm font-bold text-white">{abierta.autor?.nombre_display}</p>
              {abierta.texto && <p className="mt-1 font-body text-xs text-white/90">{abierta.texto}</p>}
            </div>
          </div>
        </div>
      )}

      <Dialog open={nuevaAbierta} onOpenChange={setNuevaAbierta}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva historia</DialogTitle>
          </DialogHeader>
          <form onSubmit={publicar} className="flex flex-col gap-3">
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setFotoFile(e.target.files?.[0] ?? null)}
            />
            <Textarea
              placeholder="Texto (opcional)"
              rows={2}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <p className="font-body text-[11px] text-muted-foreground">Tu historia estará visible 24 horas.</p>
            <Button type="submit" disabled={publicando || !fotoFile}>
              {publicando ? "Publicando…" : "Publicar story"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
