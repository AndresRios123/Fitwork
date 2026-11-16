import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthApi } from '../../core/services/auth-api';
import { AuthService } from '../../core/services/auth.service';
import { Entrenamientos } from './entrenamientos';
import { RutinasService } from './rutinas.service';
import { SesionesService } from './sesiones.service';

describe('Datos de entrenamiento por usuario', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  function configurarAuth() {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: AuthApi,
          useValue: {
            login: async (id: string) => ({
              token: 'token-' + id,
              usuario: { id, nombre: id, email: id + '@example.com', nivel: 'Principiante' },
            }),
          },
        },
      ],
    });
  }

  function guardarEntrenamiento(nombre: string) {
    const rutinas = TestBed.inject(RutinasService);
    const sesiones = TestBed.inject(SesionesService);
    rutinas.guardar({
      nombre,
      ejercicios: [{ ejercicioId: 'press-banca', series: 3, repeticiones: 10 }],
    });
    sesiones.registrar({
      rutinaId: rutinas.rutinas()[0].id,
      nombreRutina: nombre,
      fecha: '2026-11-16',
      ejercicios: [{
        ejercicioId: 'press-banca',
        nombre: 'Press de banca',
        series: [{ repeticiones: 8, pesoKg: 40 }],
      }],
    });
  }

  it('separa dos cuentas, bloquea guardados sin sesión y restaura la cuenta al recargar', async () => {
    const legado = JSON.stringify([{ id: 'anterior' }]);
    localStorage.setItem('fitwork_rutinas', legado);
    localStorage.setItem('fitwork_sesiones', legado);
    configurarAuth();

    const auth = TestBed.inject(AuthService);
    await auth.login('ana', 'prueba');
    const fixture = TestBed.createComponent(Entrenamientos);
    await fixture.whenStable();

    const rutinas = TestBed.inject(RutinasService);
    const sesiones = TestBed.inject(SesionesService);
    expect(rutinas.rutinas()).toEqual([]);
    expect(sesiones.sesiones()).toEqual([]);
    guardarEntrenamiento('Rutina de Ana');
    const rutinaAna = rutinas.rutinas()[0];
    const sesionAna = sesiones.sesiones()[0];
    await fixture.whenStable();

    const pagina: HTMLElement = fixture.nativeElement;
    pagina.querySelector<HTMLButtonElement>('app-rutina-tarjeta button')!.click();
    await fixture.whenStable();
    expect(pagina.querySelector('.editor')).not.toBeNull();

    auth.logout();
    expect(rutinas.rutinas()).toEqual([]);
    expect(sesiones.sesiones()).toEqual([]);
    expect(() => rutinas.guardar(rutinaAna)).toThrow();
    expect(() => sesiones.registrar(sesionAna)).toThrow();
    await fixture.whenStable();
    expect(pagina.querySelector('.editor')).toBeNull();

    await auth.login('beto', 'prueba');
    expect(rutinas.rutinas()).toEqual([]);
    expect(sesiones.sesiones()).toEqual([]);
    expect(() => rutinas.guardar(rutinaAna, rutinaAna.id)).toThrow();
    guardarEntrenamiento('Rutina de Beto');
    expect(rutinas.rutinas().map(item => item.nombre)).toEqual(['Rutina de Beto']);
    expect(sesiones.sesiones().map(item => item.nombreRutina)).toEqual(['Rutina de Beto']);
    await fixture.whenStable();
    expect(pagina.textContent).not.toContain('Rutina de Ana');

    await auth.login('ana', 'prueba');
    expect(rutinas.rutinas()).toEqual([rutinaAna]);
    expect(sesiones.sesiones()).toEqual([sesionAna]);

    fixture.destroy();
    TestBed.resetTestingModule();
    configurarAuth();
    const recarga = TestBed.createComponent(Entrenamientos);
    await recarga.whenStable();
    expect(TestBed.inject(AuthService).currentUser()?.id).toBe('ana');
    expect(TestBed.inject(RutinasService).rutinas()).toEqual([rutinaAna]);
    expect(TestBed.inject(SesionesService).sesiones()).toEqual([sesionAna]);
    expect(localStorage.getItem('fitwork_rutinas')).toBe(legado);
    expect(localStorage.getItem('fitwork_sesiones')).toBe(legado);
  });
});
