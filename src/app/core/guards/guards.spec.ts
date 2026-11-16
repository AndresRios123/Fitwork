import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

describe('Guards de autenticación', () => {
  // AuthService falso: solo necesitamos saber si hay sesión o no
  const sesionActiva = signal(false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { estaAutenticado: sesionActiva } }],
    });
  });

  // Los guards usan inject(), así que deben ejecutarse "dentro" de Angular
  function ejecutar(guard: typeof authGuard) {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  // Convierte la respuesta del guard en texto: true o la URL a la que redirige
  function destino(resultado: unknown): string | boolean {
    return resultado instanceof UrlTree ? resultado.toString() : (resultado as boolean);
  }

  describe('authGuard (páginas privadas)', () => {
    it('deja pasar si hay sesión', () => {
      sesionActiva.set(true);
      expect(destino(ejecutar(authGuard))).toBe(true);
    });

    it('manda al login si no hay sesión', () => {
      sesionActiva.set(false);
      expect(destino(ejecutar(authGuard))).toBe('/login');
    });
  });

  describe('guestGuard (login y register)', () => {
    it('deja pasar si no hay sesión', () => {
      sesionActiva.set(false);
      expect(destino(ejecutar(guestGuard))).toBe(true);
    });

    it('manda al panel si ya hay sesión', () => {
      sesionActiva.set(true);
      expect(destino(ejecutar(guestGuard))).toBe('/panel');
    });
  });
});