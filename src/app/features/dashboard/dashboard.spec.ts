import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Rango, Rendimiento, ResumenDashboard } from '../../core/models/dashboard.model';
import { AuthService } from '../../core/services/auth.service';
import { DashboardApi } from '../../core/services/dashboard-api';
import { saludoPara } from './components/dashboard-header';
import { Dashboard } from './dashboard';

const RESUMEN: ResumenDashboard = {
  estadisticas: [
    { tipo: 'entrenamientos', valor: 18, variacion: 12.5 },
    { tipo: 'volumen', valor: 42380, variacion: 8.7 },
    { tipo: 'cardio', valor: 95, variacion: -4.2 },
    { tipo: 'records', valor: 5, variacion: null },
  ],
  entrenamientoHoy: {
    rutinaId: 'rutina-1',
    nombre: 'Tren superior',
    enfoque: 'Fuerza',
    duracionMin: 55,
    ejercicios: [
      { nombre: 'Press de banca', series: 4, repeticiones: 10 },
      { nombre: 'Dominadas', series: 3, repeticiones: 8 },
    ],
  },
  actividad: [{ id: 'a1', tipo: 'cardio', titulo: 'Carrera continua', fecha: '2026-11-15', duracionMin: 34, detalle: '5,2 km' }],
  records: [{ id: 'r1', ejercicio: 'Peso muerto', valor: 140, unidad: 'kg', fecha: '2026-11-14' }],
  objetivos: [{ id: 'o1', titulo: 'Correr 50 km', actual: 32, meta: 50, unidad: 'km' }],
};

const RENDIMIENTO: Rendimiento = {
  indice: 112.4,
  variacion: 5.3,
  puntos: [{ fecha: '2026-11-16', valor: 106.7 }, { fecha: '2026-11-17', valor: 112.4 }],
  mejoras: [{ ejercicioId: 'press-banca', ejercicio: 'Press de banca', variacion: 12.5 }],
};

const VACIO: ResumenDashboard = { ...RESUMEN, entrenamientoHoy: null, actividad: [], records: [], objetivos: [] };

describe('saludoPara', () => {
  it.each([
    [6, 'Buenos días'],
    [11, 'Buenos días'],
    [12, 'Buenas tardes'],
    [18, 'Buenas tardes'],
    [19, 'Buenas noches'],
    [2, 'Buenas noches'],
  ])('a las %i h dice "%s"', (hora, saludo) => {
    expect(saludoPara(new Date(2026, 10, 17, hora, 30))).toBe(saludo);
  });
});

describe('Dashboard', () => {
  let api: {
    obtenerResumen: ReturnType<typeof vi.fn<(rango: Rango) => Promise<ResumenDashboard>>>;
    obtenerRendimiento: ReturnType<typeof vi.fn<(rango: Rango) => Promise<Rendimiento>>>;
  };

  beforeEach(() => {
    api = {
      obtenerResumen: vi.fn().mockResolvedValue(RESUMEN),
      obtenerRendimiento: vi.fn().mockResolvedValue(RENDIMIENTO),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: DashboardApi, useValue: api },
        { provide: AuthService, useValue: { currentUser: () => ({ id: 'u1', nombre: 'Andrés Ríos' }) } },
      ],
    });
  });

  async function crear() {
    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();
    return { fixture, pagina: fixture.nativeElement as HTMLElement };
  }

  it('muestra skeletons mientras carga y luego los datos', async () => {
    let resolver!: (valor: ResumenDashboard) => void;
    api.obtenerResumen.mockReturnValue(new Promise(resolve => (resolver = resolve)));
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();
    const pagina: HTMLElement = fixture.nativeElement;

    expect(pagina.querySelectorAll('app-stat-card app-skeleton').length).toBeGreaterThan(0);
    expect(pagina.textContent).not.toContain('42.380 kg');

    resolver(RESUMEN);
    await fixture.whenStable();

    expect(pagina.querySelector('h1')?.textContent).toContain('Andrés');
    expect(pagina.querySelector('h1')?.textContent).not.toContain('Ríos');
    expect(pagina.querySelectorAll('app-stat-card')).toHaveLength(4);
    expect(pagina.textContent).toContain('42.380 kg');
    expect(pagina.textContent).toContain('1 h 35 min');
    const grafico = pagina.querySelector('app-performance-chart')!;
    expect(grafico.textContent).toContain('112,4');
    expect(grafico.querySelector('.mejoras')?.textContent).toContain('Press de banca');
    expect(grafico.querySelector('.mejoras')?.textContent).toContain('+12,5 %');
    expect(grafico.querySelector('footer a')?.getAttribute('href')).toBe('/progreso');
    expect(pagina.querySelector('app-today-workout')?.textContent).toContain('Tren superior');
    expect(pagina.querySelector('app-today-workout')?.textContent).toContain('7'); // 4 + 3 series
    expect(pagina.querySelectorAll('app-stat-card app-skeleton')).toHaveLength(0);
  });

  it('pide de nuevo los datos al cambiar el filtro de fechas', async () => {
    const { fixture, pagina } = await crear();
    expect(api.obtenerResumen).toHaveBeenLastCalledWith('30d', expect.any(AbortSignal));

    const selector = pagina.querySelector<HTMLSelectElement>('app-dashboard-header select')!;
    selector.value = '7d';
    selector.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(api.obtenerResumen).toHaveBeenLastCalledWith('7d', expect.any(AbortSignal));
    // El gráfico sigue al filtro (linkedSignal)...
    expect(api.obtenerRendimiento).toHaveBeenLastCalledWith('7d', expect.any(AbortSignal));

    // ...pero sus pestañas se pueden cambiar sin recargar el resumen.
    const llamadasResumen = api.obtenerResumen.mock.calls.length;
    Array.from(pagina.querySelectorAll<HTMLButtonElement>('app-performance-chart button'))
      .find(boton => boton.textContent.trim() === '1 año')!.click();
    await fixture.whenStable();

    expect(api.obtenerRendimiento).toHaveBeenLastCalledWith('1a', expect.any(AbortSignal));
    expect(api.obtenerResumen.mock.calls.length).toBe(llamadasResumen);
  });

  it('muestra el error y permite reintentar', async () => {
    api.obtenerResumen.mockRejectedValueOnce(new Error('caído'));
    const { fixture, pagina } = await crear();

    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain('No pudimos cargar tu resumen');
    expect(pagina.querySelector('app-stats-row')).toBeNull();

    Array.from(pagina.querySelectorAll('button')).find(boton => boton.textContent.trim() === 'Reintentar')!.click();
    await fixture.whenStable();

    expect(pagina.querySelector('[role="alert"]')).toBeNull();
    expect(pagina.textContent).toContain('42.380 kg');
  });

  it('muestra mensajes de vacío cuando no hay datos', async () => {
    api.obtenerResumen.mockResolvedValue(VACIO);
    const { pagina } = await crear();

    expect(pagina.textContent).toContain('Sin rutinas todavía');
    expect(pagina.textContent).toContain('Aún no registras actividad');
    expect(pagina.textContent).toContain('Todavía no tienes récords');
    expect(pagina.textContent).toContain('Define tu primer objetivo');
  });

  it('explica cómo ver la evolución cuando aún no hay datos de fuerza', async () => {
    api.obtenerRendimiento.mockResolvedValue({ indice: 100, variacion: null, puntos: [], mejoras: [] });
    const { pagina } = await crear();

    const grafico = pagina.querySelector('app-performance-chart')!;
    expect(grafico.textContent).toContain('dos días distintos');
    expect(grafico.querySelector('.indice')).toBeNull();
  });

  it('enlaza "Ver todo" a cada página y "Comenzar" abre la rutina sugerida', async () => {
    const { pagina } = await crear();
    const enlaces = Array.from(pagina.querySelectorAll<HTMLAnchorElement>('app-panel-card a'))
      .map(enlace => enlace.getAttribute('href'));
    expect(enlaces).toEqual(['/entrenamientos', '/records', '/objetivos']);

    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    Array.from(pagina.querySelectorAll('app-today-workout button'))
      .find(boton => boton.textContent.includes('Comenzar entrenamiento'))!
      .dispatchEvent(new Event('click'));
    expect(navegar).toHaveBeenCalledWith(['/entrenamientos'], { queryParams: { rutina: 'rutina-1' } });
  });
});
