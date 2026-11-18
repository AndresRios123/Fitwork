// Datos públicos de un usuario. Nunca incluye la contraseña.
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  nivel: string;
  avatar?: string; // URL de la foto (opcional; si no hay, se muestran las iniciales)
  pesoKg?: number | null; // Siempre en kg, aunque luego se muestre en lb
  estaturaCm?: number | null;
  edad?: number | null;
}

export const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'] as const;

/** Lo que el usuario puede cambiar desde su perfil (el correo no se edita aquí). */
export interface DatosPerfil {
  nombre: string;
  nivel: string;
  avatar: string | null; // null = quitar la foto
  pesoKg: number | null;
  estaturaCm: number | null;
  edad: number | null;
}
