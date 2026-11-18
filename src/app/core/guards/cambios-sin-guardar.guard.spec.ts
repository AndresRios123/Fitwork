import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { cambiosSinGuardarGuard, ConCambiosPendientes } from './cambios-sin-guardar.guard';

describe('cambiosSinGuardarGuard', () => {
  let autenticado: boolean;

  beforeEach(() => {
    autenticado = true;
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { estaAutenticado: () => autenticado } }],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  function salir(cambios: boolean) {
    const componente: ConCambiosPendientes = { tieneCambiosSinGuardar: () => cambios };
    return TestBed.runInInjectionContext(() =>
      cambiosSinGuardarGuard(componente, {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot, {} as RouterStateSnapshot));
  }

  it('deja salir sin preguntar si no hay cambios', () => {
    const confirmar = vi.spyOn(window, 'confirm');
    expect(salir(false)).toBe(true);
    expect(confirmar).not.toHaveBeenCalled();
  });

  it('pregunta si hay cambios y respeta la respuesta', () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(salir(true)).toBe(false);
    expect(salir(true)).toBe(true);
  });

  it('no pregunta si el usuario cerró sesión', () => {
    autenticado = false;
    const confirmar = vi.spyOn(window, 'confirm');
    expect(salir(true)).toBe(true);
    expect(confirmar).not.toHaveBeenCalled();
  });
});
