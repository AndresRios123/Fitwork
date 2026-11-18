import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { DatosPerfil } from '../models/user.model';
import { AuthApi, DatosRegistro, RespuestaAuth } from './auth-api';

const CLAVE_SESION = 'fitwork_sesion';

// Servicio único (providedIn: 'root') que sabe quién inició sesión.
// Cualquier componente lo usa con: inject(AuthService)
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);
  // localStorage solo existe en el navegador (no en el servidor de SSR)
  private readonly enNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  // Sesión actual (token + usuario). Al arrancar se lee de localStorage.
  private readonly sesion = signal<RespuestaAuth | null>(this.leerSesion());

  // Lo que el resto de la app puede leer (no modificar):
  readonly currentUser = computed(() => this.sesion()?.usuario ?? null);
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly estaAutenticado = computed(() => this.sesion() !== null);

  async login(email: string, password: string): Promise<void> {
    this.guardarSesion(await this.api.login(email, password));
  }

  async register(datos: DatosRegistro): Promise<void> {
    this.guardarSesion(await this.api.register(datos));
  }

  /** Guarda el perfil y actualiza al usuario actual (topbar, saludo, etc. se enteran solos). */
  async actualizarPerfil(datos: DatosPerfil): Promise<void> {
    const sesion = this.sesion();
    if (!sesion) {
      throw new Error('Necesitas iniciar sesión para guardar tu perfil.');
    }
    const usuario = await this.api.actualizarPerfil(sesion.usuario.id, datos);
    this.guardarSesion({ ...sesion, usuario });
  }

  logout(): void {
    if (this.enNavegador) {
      localStorage.removeItem(CLAVE_SESION);
    }
    this.sesion.set(null);
    this.router.navigate(['/login']);
  }

  private guardarSesion(sesion: RespuestaAuth): void {
    if (this.enNavegador) {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    }
    this.sesion.set(sesion);
  }

  private leerSesion(): RespuestaAuth | null {
    if (!this.enNavegador) {
      return null;
    }
    try {
      return JSON.parse(localStorage.getItem(CLAVE_SESION) ?? 'null');
    } catch {
      // Si alguien dañó el dato a mano, se borra en vez de romper la app
      localStorage.removeItem(CLAVE_SESION);
      return null;
    }
  }
}