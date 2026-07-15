export interface Historia {
  id: string;
  cliente_id: string;
  mascota_id: string | null;
  foto_url: string | null;
  texto: string | null;
  created_at: string;
  expires_at: string;
}
