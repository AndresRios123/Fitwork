import { CLAVE_ESCENARIO_MOCK, MockDashboardApi } from './mock-dashboard-api';

describe('MockDashboardApi', () => {
  const api = new MockDashboardApi();

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    localStorage.removeItem(CLAVE_ESCENARIO_MOCK);
  });

  async function esperarRespuesta<T>(promesa: Promise<T>): Promise<T> {
    await vi.runAllTimersAsync();
    return promesa;
  }

  it('devuelve las 4 estadísticas y un rendimiento que termina en 84,2', async () => {
    const resumen = await esperarRespuesta(api.obtenerResumen('30d'));
    expect(resumen.estadisticas.map(e => e.tipo)).toEqual(['entrenamientos', 'volumen', 'cardio', 'records']);

    const rendimiento = await esperarRespuesta(api.obtenerRendimiento('30d'));
    expect(rendimiento.indice).toBe(84.2);
    expect(rendimiento.puntos).toHaveLength(30);
    expect(rendimiento.puntos.at(-1)?.valor).toBe(84.2);
  });

  it.each([['7d', 7], ['3m', 13], ['1a', 12]] as const)('el rango %s tiene %i puntos', async (rango, puntos) => {
    const rendimiento = await esperarRespuesta(api.obtenerRendimiento(rango));
    expect(rendimiento.puntos).toHaveLength(puntos);
  });

  it('permite simular los escenarios vacío y error', async () => {
    localStorage.setItem(CLAVE_ESCENARIO_MOCK, 'vacio');
    const vacio = await esperarRespuesta(api.obtenerResumen('7d'));
    expect(vacio.actividad).toEqual([]);
    expect(vacio.entrenamientoHoy).toBeNull();

    localStorage.setItem(CLAVE_ESCENARIO_MOCK, 'error');
    const fallo = api.obtenerResumen('7d');
    const resultado = expect(fallo).rejects.toThrow('No se pudo cargar');
    await vi.runAllTimersAsync();
    await resultado;
  });

  it('se cancela si se aborta la petición', async () => {
    const control = new AbortController();
    const promesa = api.obtenerResumen('7d', control.signal);
    control.abort(new Error('cancelado'));
    await expect(promesa).rejects.toThrow('cancelado');
  });
});
