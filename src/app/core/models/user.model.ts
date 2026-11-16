// Datos públicos de un usuario. Nunca incluye la contraseña.
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  nivel: string;
  avatar?: string; // URL de la foto (opcional; si no hay, se muestran las iniciales)
}