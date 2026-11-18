import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Componentes con un formulario que se puede abandonar sin guardar. */
export interface ConCambiosPendientes {
  tieneCambiosSinGuardar(): boolean;
}

// Pregunta antes de salir de una página con cambios sin guardar.
// Si el usuario cerró sesión, no pregunta (la sesión ya terminó).
export const cambiosSinGuardarGuard: CanDeactivateFn<ConCambiosPendientes> = componente => {
  if (!inject(AuthService).estaAutenticado() || !componente.tieneCambiosSinGuardar()) {
    return true;
  }
  return window.confirm('Tienes cambios sin guardar en tu perfil. ¿Quieres salir sin guardarlos?');
};
