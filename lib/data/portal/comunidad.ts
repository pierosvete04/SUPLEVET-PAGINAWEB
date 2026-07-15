export interface Post {
  id: string;
  cliente_id: string;
  mascota_id: string | null;
  texto: string;
  foto_urls: string[];
  created_at: string;
}

export interface PerfilComunidad {
  cliente_id: string;
  nombre_display: string;
  foto_url: string | null;
}
