import { ActividadCardio } from '../../cardio/actividad-cardio';
import { Rutina } from '../../entrenamientos/rutina';
import { SesionEntrenamiento } from '../../entrenamientos/sesion';
import { Objetivo } from '../../objetivos/objetivo';
import { calcularRendimiento, calcularResumen, DatosUsuario, sumarDias } from './dashboard-calculo';

const HOY = '2026-11-17';

function sesion(id: string, fecha: string, rutinaId: string, series: { repeticiones: number; pesoKg: number | null }[]): SesionEntrenamiento {
  return {
    id,
    rutinaId,
    nombreRutina: rutinaId === 'pecho' ? 'Pecho' : 'Pierna',
    fecha,
    ejercicios: [{ ejercicioId: rutinaId === 'pecho' ? 'press-banca' : 'sentadilla-barra', nombre: rutinaId === 'pecho' ? 'Press de banca' : 'Sentadilla', series }],
  };
}

const rutinas: Rutina[] = [
  { id: 'pecho', nombre: 'Pecho', ejercicios: [{ ejercicioId: 'press-banca', series: 4, repeticiones: 10 }] },
  { id: 'pierna', nombre: 'Pierna', ejercicios: [{ ejercicioId: 'sentadilla-barra', series: 3, repeticiones: 8 }] },
];

const sesiones: SesionEntrenamiento[] = [
  // Periodo actual de 7 días: 2026-11-11 .. 2026-11-17
  sesion('s1', '2026-11-16', 'pecho', [{ repeticiones: 10, pesoKg: 60 }, { repeticiones: 8, pesoKg: 70 }]), // 1160 kg
  sesion('s2', '2026-11-12', 'pierna', [{ repeticiones: 5, pesoKg: 100 }]), // 500 kg
  // Periodo anterior: 2026-11-04 .. 2026-11-10
  sesion('s3', '2026-11-05', 'pecho', [{ repeticiones: 10, pesoKg: 50 }]), // 500 kg
];

const cardio: ActividadCardio[] = [
  { id: 'c1', tipo: 'Correr', fecha: '2026-11-15', duracionMin: 30, distanciaKm: 5.25 },
  { id: 'c2', tipo: 'Ciclismo', fecha: '2026-11-06', duracionMin: 60, distanciaKm: null },
];

const objetivos: Objetivo[] = [
  { id: 'o1', nombre: 'Entrenar 10 veces', tipo: 'sesiones', inicio: '2026-11-01', fin: '2026-11-30', meta: 10 },
  { id: 'o2', nombre: 'Meta vieja', tipo: 'sesiones', inicio: '2026-01-01', fin: '2026-01-31', meta: 5 },
];

const datos: DatosUsuario = { sesiones, rutinas, cardio, objetivos };

describe('calcularResumen', () => {
  const resumen = calcularResumen(datos, '7d', HOY);
  const stat = (tipo: string) => resumen.estadisticas.find(e => e.tipo === tipo)!;

  it('cuenta sesiones, volumen y cardio del periodo y los compara con el anterior', () => {
    expect(stat('entrenamientos')).toEqual({ tipo: 'entrenamientos', valor: 2, variacion: 100 });
    expect(stat('volumen')).toEqual({ tipo: 'volumen', valor: 1660, variacion: 232 });
    expect(stat('cardio')).toEqual({ tipo: 'cardio', valor: 30, variacion: -50 });
  });

  it('cuenta los récords vigentes logrados en el periodo', () => {
    // Press de banca (70 kg el 16) y sentadilla (100 kg el 12) se lograron esta semana.
    expect(stat('records').valor).toBe(2);
  });

  it('sugiere la rutina que hace más tiempo no se entrena', () => {
    expect(resumen.entrenamientoHoy).toMatchObject({
      rutinaId: 'pierna',
      nombre: 'Pierna',
      enfoque: 'Última vez: hace 5 días',
      ejercicios: [{ nombre: 'Sentadilla con barra', series: 3, repeticiones: 8 }],
    });
  });

  it('mezcla sesiones y cardio en la actividad reciente, de la más nueva a la más vieja', () => {
    expect(resumen.actividad.map(a => [a.titulo, a.detalle])).toEqual([
      ['Pecho', '1.160 kg'],
      ['Correr', '5,3 km'],
      ['Pierna', '500 kg'],
      ['Ciclismo', ''],
    ]);
  });

  it('lista los récords más recientes y los objetivos activos', () => {
    expect(resumen.records.map(r => [r.ejercicio, r.valor, r.unidad])).toEqual([
      ['Press de banca', 70, 'kg'],
      ['Sentadilla', 100, 'kg'],
    ]);
    // La meta vieja ya finalizó, por eso no aparece.
    expect(resumen.objetivos).toEqual([
      { id: 'o1', titulo: 'Entrenar 10 veces', actual: 3, meta: 10, unidad: 'sesiones' },
    ]);
  });

  it('devuelve todo vacío para una cuenta nueva', () => {
    const vacio = calcularResumen({ sesiones: [], rutinas: [], cardio: [], objetivos: [] }, '30d', HOY);
    expect(vacio.estadisticas.every(e => e.valor === 0 && e.variacion === null)).toBe(true);
    expect(vacio.entrenamientoHoy).toBeNull();
    expect(vacio.actividad).toEqual([]);
    expect(vacio.records).toEqual([]);
    expect(vacio.objetivos).toEqual([]);
  });
});

describe('calcularRendimiento', () => {
  it('suma el volumen por día y lo compara con el periodo anterior', () => {
    const rendimiento = calcularRendimiento(sesiones, '7d', HOY);
    expect(rendimiento.total).toBe(1660);
    expect(rendimiento.variacion).toBe(232);
    expect(rendimiento.puntos.map(p => p.valor)).toEqual([0, 500, 0, 0, 0, 1160, 0]);
    expect(rendimiento.puntos.at(-1)?.fecha).toBe(HOY);
  });

  it.each([['30d', 30], ['3m', 13], ['1a', 12]] as const)('el rango %s tiene %i puntos', (rango, cantidad) => {
    expect(calcularRendimiento(sesiones, rango, HOY).puntos).toHaveLength(cantidad);
  });

  it('no devuelve puntos si no hubo volumen', () => {
    expect(calcularRendimiento([], '30d', HOY)).toEqual({ total: 0, unidad: 'kg', variacion: null, puntos: [] });
  });
});

describe('sumarDias', () => {
  it('cruza meses y años sin desfases de zona horaria', () => {
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });
});
