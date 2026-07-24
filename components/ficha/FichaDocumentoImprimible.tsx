import Image from "next/image";
import { calcularEdad, formatFecha, formatFechaCumple } from "@/lib/portal/formato";
import {
  parseDetalleEventoSalud,
  TIPOS_CONDICION_MEDICA,
  TIPOS_SALUD,
  type CondicionMedica,
  type Familiar,
  type TipoEventoSalud,
} from "@/lib/data/portal/mascotas";
import { siteConfig } from "@/lib/site-config";
import { LinkQrCode } from "@/components/shared/LinkQrCode";

interface MascotaFichaData {
  id: string;
  nombre: string;
  especie: "perro" | "gato" | "otro";
  especie_otro: string | null;
  raza: string | null;
  fecha_nacimiento: string | null;
  peso_kg: number;
  genero: "macho" | "hembra" | null;
  condiciones_medicas: CondicionMedica[];
  descripcion: string | null;
  foto_url: string | null;
  color_primario?: string | null;
  color_secundario?: string | null;
  familiares?: Familiar[] | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
}

interface EventoFichaData {
  id: string;
  tipo: TipoEventoSalud;
  titulo: string;
  detalle: string | null;
  fecha: string;
}

const ORDEN_TIPOS: TipoEventoSalud[] = ["vacuna", "desparasitacion", "consulta", "medicamento", "bano", "otro"];

export function FichaDocumentoImprimible({
  mascota,
  eventos,
}: {
  mascota: MascotaFichaData;
  eventos: EventoFichaData[];
}) {
  const grupos = ORDEN_TIPOS.map((tipo) => ({
    tipo,
    eventos: eventos
      .filter((e) => e.tipo === tipo)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
  })).filter((g) => g.eventos.length > 0);

  const totalRegistros = eventos.length;
  const especieLabel =
    mascota.especie === "perro" ? "Perro" : mascota.especie === "gato" ? "Gato" : mascota.especie_otro || "Otro";
  const generoLabel = mascota.genero === "macho" ? "Macho" : mascota.genero === "hembra" ? "Hembra" : "—";
  const ahora = new Date();
  const colorAcento = mascota.color_primario || undefined;
  // El documento impreso siempre tiene fondo blanco, así que el acento de
  // texto no puede ser el color_primario tal cual (suele ser un pastel claro
  // pensado para fondo oscuro/portada — ilegible sobre blanco). Se oscurece
  // mezclándolo con negro para garantizar contraste sin importar qué tan
  // claro sea el color elegido.
  const colorAcentoTexto = colorAcento ? `color-mix(in srgb, ${colorAcento} 40%, black)` : undefined;
  const enlaceFicha = `${siteConfig.siteUrl}/ficha/${mascota.id}`;
  const limpiarUrl = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const redesTexto = [
    mascota.instagram_url && `Instagram: ${limpiarUrl(mascota.instagram_url)}`,
    mascota.tiktok_url && `TikTok: ${limpiarUrl(mascota.tiktok_url)}`,
    mascota.facebook_url && `Facebook: ${limpiarUrl(mascota.facebook_url)}`,
  ].filter((r): r is string => Boolean(r));

  return (
    <div className="ficha-doc hidden print:block">
      <header className="ficha-doc-header" style={colorAcento ? { borderBottomColor: colorAcento } : undefined}>
        <div className="ficha-doc-brand">
          <Image src="/logos/icon-only/icon-outline-celeste.png" alt="" width={30} height={30} />
          <div>
            <p className="ficha-doc-brand-name">Suplevet</p>
            <p className="ficha-doc-brand-tag">Nutrición y cuidado para tus mascotas</p>
          </div>
        </div>
        <div className="ficha-doc-doc-info">
          <p className="ficha-doc-doc-title" style={colorAcentoTexto ? { color: colorAcentoTexto } : undefined}>
            Ficha Clínica Veterinaria
          </p>
          <p>
            Doc. N.º {mascota.id.slice(0, 8).toUpperCase()} · Generada el{" "}
            {ahora.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })} a las{" "}
            {ahora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </header>

      <section
        className="ficha-doc-patient"
        style={colorAcento ? { background: `color-mix(in srgb, ${colorAcento} 14%, white)` } : undefined}
      >
        <div className="ficha-doc-patient-photo">
          {mascota.foto_url ? (
            <Image
              src={mascota.foto_url}
              alt={mascota.nombre}
              width={64}
              height={64}
              className="h-full w-full object-cover"
              priority
            />
          ) : (
            <Image src="/logos/icon-only/icon-outline-white.png" alt="" width={28} height={28} />
          )}
        </div>
        <div className="ficha-doc-patient-main">
          <p className="ficha-doc-patient-name" style={colorAcentoTexto ? { color: colorAcentoTexto } : undefined}>
            {mascota.nombre}
          </p>
          <p className="ficha-doc-patient-sub">
            {[mascota.raza, mascota.fecha_nacimiento ? calcularEdad(mascota.fecha_nacimiento) : null, generoLabel !== "—" ? generoLabel : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <dl className="ficha-doc-patient-fields">
          <div>
            <dt>Especie</dt>
            <dd>{especieLabel}</dd>
          </div>
          <div>
            <dt>Peso</dt>
            <dd>{mascota.peso_kg} kg</dd>
          </div>
          <div>
            <dt>Nacimiento</dt>
            <dd>{mascota.fecha_nacimiento ? formatFechaCumple(mascota.fecha_nacimiento) : "—"}</dd>
          </div>
          <div>
            <dt>Sexo</dt>
            <dd>{generoLabel}</dd>
          </div>
          {mascota.familiares?.map((familiar, i) => (
            <div key={i}>
              <dt>{familiar.relacion}</dt>
              <dd>{familiar.nombre}</dd>
            </div>
          ))}
        </dl>
      </section>

      {(mascota.condiciones_medicas.length > 0 || mascota.descripcion) && (
        <section className="ficha-doc-alert">
          {mascota.condiciones_medicas.length > 0 && (
            <div className="ficha-doc-alert-condiciones">
              <strong>Condiciones médicas / alergias</strong>
              <ul>
                {mascota.condiciones_medicas.map((c, i) => (
                  <li key={i}>
                    <span className="ficha-doc-alert-tipo">{TIPOS_CONDICION_MEDICA[c.tipo] ?? "Otro"}</span>
                    {c.descripcion}
                    {c.fecha ? ` (${formatFecha(c.fecha)})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {mascota.descripcion && (
            <p>
              <strong>Notas generales:</strong> {mascota.descripcion}
            </p>
          )}
        </section>
      )}

      <section className="ficha-doc-summary">
        {ORDEN_TIPOS.map((tipo) => {
          const cantidad = eventos.filter((e) => e.tipo === tipo).length;
          return (
            <div key={tipo} className={`ficha-doc-summary-tile ${cantidad === 0 ? "is-empty" : ""}`}>
              <span className="ficha-doc-summary-count">{cantidad}</span>
              <span className="ficha-doc-summary-label">{TIPOS_SALUD[tipo].label}</span>
            </div>
          );
        })}
      </section>

      <section className="ficha-doc-historial">
        <h2>Historial médico completo</h2>
        {totalRegistros === 0 ? (
          <p className="ficha-doc-vacio">Aún no se han registrado eventos de salud para esta mascota.</p>
        ) : (
          grupos.map((grupo) => (
            <div key={grupo.tipo} className="ficha-doc-grupo">
              <h3>
                <span>{TIPOS_SALUD[grupo.tipo].emoji}</span> {TIPOS_SALUD[grupo.tipo].label}
                <span className="ficha-doc-grupo-count">
                  {grupo.eventos.length} {grupo.eventos.length === 1 ? "registro" : "registros"}
                </span>
              </h3>
              <table className="ficha-doc-table">
                <thead>
                  <tr>
                    <th className="w-[13%]">Fecha</th>
                    <th className="w-[27%]">Detalle</th>
                    <th className="w-[20%]">Veterinario</th>
                    <th className="w-[18%]">Próximo control</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.eventos.map((evento) => {
                    const detalle = parseDetalleEventoSalud(evento.detalle);
                    const vencido = detalle.proxima_fecha && new Date(detalle.proxima_fecha) < ahora;
                    return (
                      <tr key={evento.id}>
                        <td>{formatFecha(evento.fecha)}</td>
                        <td>
                          <span className="ficha-doc-table-titulo">{evento.titulo}</span>
                          {detalle.producto && <span className="ficha-doc-table-sub">{detalle.producto}</span>}
                        </td>
                        <td>{detalle.veterinario || "—"}</td>
                        <td>
                          {detalle.proxima_fecha ? (
                            <span className={`ficha-doc-badge ${vencido ? "is-vencido" : "is-vigente"}`}>
                              {formatFecha(detalle.proxima_fecha)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="ficha-doc-table-notas">{detalle.notas || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>

      <footer className="ficha-doc-footer">
        <div className="ficha-doc-footer-main">
          <p>
            Este documento es un resumen informativo generado por el cliente desde su cuenta Suplevet y no reemplaza
            la historia clínica oficial de su veterinaria. Verifique los datos con el médico tratante.
          </p>
          {redesTexto.length > 0 && <p>{redesTexto.join("   ·   ")}</p>}
          <p>
            {siteConfig.siteUrl.replace("https://", "")} · {siteConfig.correoContacto} · WhatsApp +
            {siteConfig.whatsappB2C}
          </p>
        </div>
        <div className="ficha-doc-footer-qr">
          <LinkQrCode link={enlaceFicha} size={62} />
          <p>Escanea para ver la ficha online</p>
        </div>
      </footer>
    </div>
  );
}
