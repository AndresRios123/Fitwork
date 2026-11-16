import { signal } from '@angular/core';
import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EjercicioRealizado } from '../entrenamientos/sesion';
import { SesionesService } from '../entrenamientos/sesiones.service';
import { Progreso } from './progreso';

describe('Progreso de entrenamiento', () => {
  const usuario = signal({ id: 'ana' });
  const claveSesiones = 'fitwork_sesiones:ana';

  beforeEach(() => {
    usuario.set({ id: 'ana' });
    localStorage.removeItem(claveSesiones);
    TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [provideRouter([]), { provide: AuthService, useValue: { currentUser: usuario } }],
    });
  });

  afterEach(() => {
    localStorage.removeItem(claveSesiones);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('agrupa las series de cada ejercicio por fecha y conserva el detalle de las sesiones', async () => {
    const fixture = TestBed.createComponent(Progreso);
    await fixture.whenStable();
    const pagina: HTMLElement = fixture.nativeElement;
    const servicio = TestBed.inject(SesionesService);
    expect(pagina.textContent).toContain('Aún no hay progreso para mostrar');

    function registrar(fecha: string, nombreRutina: string, ejercicios: EjercicioRealizado[]) {
      servicio.registrar({ rutinaId: 'rutina-1', nombreRutina, fecha, ejercicios });
    }

    const flexiones = {
      ejercicioId: 'flexiones', nombre: 'Flexiones',
      series: [{ repeticiones: 12, pesoKg: null }],
    };
    registrar('2024-10-01', 'Primera sesión', [{
      ejercicioId: 'press-banca', nombre: 'Press de banca',
      series: [{ repeticiones: 8, pesoKg: 40 }],
    }, flexiones]);
    registrar('2024-10-03', 'Primera sesión del día', [{
      ejercicioId: 'press-banca', nombre: 'Press de banca',
      series: [{ repeticiones: 10, pesoKg: 42.5 }, { repeticiones: 8, pesoKg: null }],
    }, flexiones]);
    registrar('2024-10-03', 'Segunda sesión del día', [{
      ejercicioId: 'press-banca', nombre: 'Press de banca',
      series: [{ repeticiones: 6, pesoKg: 45 }],
    }]);
    await fixture.whenStable();

    async function seleccionar(indice: number, valor: string) {
      const selector = pagina.querySelectorAll('select')[indice];
      selector.value = valor;
      selector.dispatchEvent(new Event('change'));
      await fixture.whenStable();
    }

    await seleccionar(0, 'press-banca');
    const dias = [...pagina.querySelectorAll('details')];
    expect(dias).toHaveLength(2);
    expect(dias[0].querySelector('summary')?.textContent).toContain('2 sesiones · 3 series · 24 reps');
    expect(dias[0].querySelector('summary')?.textContent).toContain('Máx. 45 kg');
    expect(dias[0].textContent).toContain('Primera sesión del día');
    expect(dias[0].textContent).toContain('Segunda sesión del día');
    expect(dias[0].textContent).toContain('10 repeticiones');
    expect(dias[1].querySelector('time')?.dateTime).toBe('2024-10-01');

    await seleccionar(1, 'pesoMaximo');
    const moveTo = vi.fn();
    const arc = vi.fn();
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.spyOn(HTMLCanvasElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
    vi.spyOn(HTMLCanvasElement.prototype, 'clientHeight', 'get').mockReturnValue(240);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      scale: vi.fn(), measureText: () => ({ width: 36 }), beginPath: vi.fn(),
      moveTo, lineTo: vi.fn(), stroke: vi.fn(), fillText: vi.fn(), arc, fill: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const [grafico] = await fixture.getDeferBlocks();
    await grafico.render(DeferBlockState.Complete);
    expect(pagina.querySelector('canvas')).not.toBeNull();
    expect(arc).toHaveBeenCalledTimes(2);

    await seleccionar(0, 'flexiones');
    expect(pagina.querySelector('canvas')).toBeNull();
    expect(pagina.textContent).toContain('Necesitas peso registrado');
    expect(pagina.textContent).not.toContain('45 kg');

    usuario.set({ id: 'beto' });
    await fixture.whenStable();
    expect(pagina.querySelector('details')).toBeNull();
    expect(pagina.textContent).toContain('Aún no hay progreso para mostrar');
  });
});
