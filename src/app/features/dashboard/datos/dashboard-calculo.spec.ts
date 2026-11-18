import { ActividadCardio } from '../../cardio/actividad-cardio';
import { Rutina } from '../../entrenamientos/rutina';
import { SesionEntrenamiento } from '../../entrenamientos/sesion';
import { Objetivo } from '../../objetivos/objetivo';
import { calcularRendimiento, calcularResumen, DatosUsuario, estimar1RM, sumarDias } from './dashboard-calculo';

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

describe('calcularRendimiento (progreso de fuerza)', () => {
  // Press de banca: 1RM 66,7 kg (05/11) -> 88,7 kg (16/11) = +33 %.
  // Sentadilla: solo un día, no cambia. Índice = 100 × (1,33 + 1) / 2 = 116,5.
  it('sube en proporción al promedio de mejora de los ejercicios conocidos', () => {
    const rendimiento = calcularRendimiento(sesiones, '7d', HOY);
    expect(rendimiento.indice).toBe(116.5);
    expect(rendimiento.variacion).toBe(16.5);
    expect(rendimiento.puntos.map(p => p.valor)).toEqual([100, 100, 100, 100, 100, 116.5, 116.5]);
    expect(rendimiento.puntos.at(-1)?.fecha).toBe(HOY);
  });

  it('lista los ejercicios que más mejoraron en el periodo', () => {
    // Press de banca: 66,7 kg antes del periodo -> 88,7 kg ahora. La sentadilla
    // empezó dentro del periodo con un solo registro: no cuenta como mejora.
    expect(calcularRendimiento(sesiones, '7d', HOY).mejoras).toEqual([
      { ejercicioId: 'press-banca', ejercicio: 'Press de banca', variacion: 33 },
    ]);
    // En 1 año, la base del press es su primer registro (05/11): misma mejora.
    expect(calcularRendimiento(sesiones, '1a', HOY).mejoras.map(m => m.variacion)).toEqual([33]);
  });

  it('no muestra mejoras si en el periodo no se superó ninguna marca', () => {
    const sinMejora = [...sesiones, sesion('s5', HOY, 'pecho', [{ repeticiones: 5, pesoKg: 40 }])];
    expect(calcularRendimiento(sinMejora, '7d', '2026-11-25').mejoras).toEqual([]);
  });

  it.each(['30d', '3m', '1a'] as const)('en el rango %s termina hoy con el mismo índice', rango => {
    const rendimiento = calcularRendimiento(sesiones, rango, HOY);
    expect(rendimiento.puntos.at(-1)).toEqual({ fecha: HOY, valor: 116.5 });
    // No hay puntos antes de la primera sesión registrada.
    expect(rendimiento.puntos[0].fecha >= '2026-11-05').toBe(true);
  });

  it('un ejercicio nuevo no hace bajar el índice', () => {
    // Hoy aparece un ejercicio que nunca se había registrado (curl, 20 kg).
    const nuevo: SesionEntrenamiento = {
      ...sesion('s4', HOY, 'pierna', []),
      ejercicios: [{ ejercicioId: 'curl-biceps', nombre: 'Curl', series: [{ repeticiones: 10, pesoKg: 20 }] }],
    };
    expect(calcularRendimiento([...sesiones, nuevo], '7d', HOY).indice).toBe(116.5);
  });

  it('ignora las series sin peso y no muestra puntos sin datos suficientes', () => {
    expect(calcularRendimiento([], '30d', HOY)).toEqual({ indice: 100, variacion: null, puntos: [], mejoras: [] });
    // Un solo día con peso no permite comparar.
    expect(calcularRendimiento([sesiones[0]], '30d', HOY).puntos).toEqual([]);
    const sinPeso = sesion('x', HOY, 'pecho', [{ repeticiones: 12, pesoKg: null }]);
    expect(calcularRendimiento([sinPeso, sesiones[0]], '30d', HOY).puntos).toEqual([]);
  });

  it('estima el 1RM con la fórmula de Epley', () => {
    expect(estimar1RM(60, 10)).toBe(80);
    expect(estimar1RM(100, 1)).toBe(100);
  });
});

describe('sumarDias', () => {
  it('cruza meses y años sin desfases de zona horaria', () => {
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });
});
