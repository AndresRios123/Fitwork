import { afterNextRender, computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';

type EstadoColeccion = 'cargando' | 'sin-cuenta' | 'listo' | 'error';

@Injectable({ providedIn: 'root' })
export class AlmacenamientoUsuario {
  private readonly auth = inject(AuthService);
  private readonly navegadorListo = signal(false);

  readonly usuarioId = computed(() => this.auth.currentUser()?.id || null);

  constructor() {
    afterNextRender(() => this.navegadorListo.set(true));
  }

  coleccion<T>(prefijo: string, validar: (valor: unknown) => valor is T) {
    const revision = signal(0);
    const clave = computed(() => {
      const id = this.usuarioId();
      return id ? `${prefijo}:${id}` : null;
    });

    const leer = (claveUsuario: string): T[] => {
      const datos: unknown = JSON.parse(localStorage.getItem(claveUsuario) ?? '[]');
      if (!Array.isArray(datos) || !datos.every(validar)) {
        throw new Error('Formato de almacenamiento desconocido.');
      }
      return datos;
    };

    const contenido = computed<{ estado: EstadoColeccion; datos: readonly T[] }>(() => {
      if (!this.navegadorListo()) {
        return { estado: 'cargando', datos: [] };
      }
      const claveUsuario = clave();
      if (!claveUsuario) {
        return { estado: 'sin-cuenta', datos: [] };
      }

      revision();
      try {
        return { estado: 'listo', datos: leer(claveUsuario) };
      } catch {
        return { estado: 'error', datos: [] };
      }
    });

    return {
      estado: computed(() => contenido().estado),
      datos: computed(() => contenido().datos),
      actualizar: (cambiar: (datos: readonly T[]) => readonly T[]) => {
        const claveUsuario = clave();
        if (!this.navegadorListo() || !claveUsuario) {
          throw new Error('Se necesita una sesión activa para guardar los datos.');
        }

        const nuevos = cambiar(leer(claveUsuario));
        localStorage.setItem(claveUsuario, JSON.stringify(nuevos));
        revision.update(valor => valor + 1);
      },
    };
  }
}
