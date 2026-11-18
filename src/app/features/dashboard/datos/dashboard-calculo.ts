import {
  ActividadReciente,
  EntrenamientoHoy,
  Estadistica,
  MejoraEjercicio,
  Objetivo as ObjetivoResumen,
  PuntoRendimiento,
  Rango,
  RecordPersonal,
  Rendimiento,
  ResumenDashboard,
} from '../../../core/models/dashboard.model';
import { formatearCantidad, formatearNumero } from '../../../shared/utils/formato';
import { ActividadCardio } from '../../cardio/actividad-cardio';
import { catalogo } from '../../ejercicios/catalogo';
import { Rutina } from '../../entrenamientos/rutina';
import { SesionEntrenamiento } from '../../entrenamientos/sesion';
import { Objetivo } from '../../objetivos/objetivo';
import { evaluarObjetivo } from '../../objetivos/objetivos-calculo';
import { calcularRecords } from '../../records/records-calculo';

// Funciones PURAS: reciben los datos guardados del usuario y devuelven lo que
// muestra el panel. No leen localStorage ni la hora; por eso son fáciles de probar.

export interface DatosUsuario {
  readonly sesiones: readonly SesionEntrenamiento[];
  readonly rutinas: readonly Rutina[];
  readonly cardio: readonly ActividadCardio[];
  readonly objetivos: readonly Objetivo[];
}

/** Días que abarca cada rango y en cuántos tramos se divide el gráfico. */
const RANGOS: Record<Rango, { dias: number; tramos: number }> = {
  '7d': { dias: 7, tramos: 7 }, // 1 punto por día
  '30d': { dias: 30, tramos: 30 }, // 1 punto por día
  '3m': { dias: 91, tramos: 13 }, // 1 punto por semana
  '1a': { dias: 365, tramos: 12 }, // 1 punto por mes (aprox.)
};

const nombresEjercicios = new Map(catalogo.map(ejercicio => [ejercicio.id, ejercicio.nombre]));

export function calcularResumen(datos: DatosUsuario, rango: Rango, hoy: string): ResumenDashboard {
  const actual = periodo(rango, hoy, 0);
  const anterior = periodo(rango, hoy, 1);

  return {
    estadisticas: estadisticas(datos, actual, anterior),
    entrenamientoHoy: entrenamientoSugerido(datos, hoy),
    actividad: actividadReciente(datos),
    records: recordsRecientes(datos.sesiones),
    objetivos: objetivosActivos(datos, hoy),
  };
}

/**
 * Progreso general de fuerza (índice encadenado, 100 = punto de partida).
 *
 * 1. Para cada ejercicio con peso se estima el 1RM de cada serie (Epley) y se
 *    guarda la mejor marca alcanzada hasta cada día.
 * 2. Cada día que entrenas, el índice se multiplica por el promedio de cuánto
 *    mejoró la mejor marca de CADA ejercicio que ya conocías (1 si no cambió).
 * 3. Un ejercicio nuevo entra como referencia sin mover el índice, así que
 *    agregar ejercicios no lo hace bajar.
 *
 * Ej.: con 2 ejercicios, si el press de banca mejora un 10 % y la sentadilla
 * no cambia, el índice sube un 5 % (de 100 a 105).
 */
export function calcularRendimiento(sesiones: readonly SesionEntrenamiento[], rango: Rango, hoy: string): Rendimiento {
  const marcas = marcasPorDia(sesiones);
  const historial = historialIndiceFuerza(marcas.dias);
  const sinDatos: Rendimiento = { indice: 100, variacion: null, puntos: [], mejoras: [] };
  // Hace falta al menos un ejercicio con peso registrado en dos días distintos.
  if (!historial.some(dia => dia.comparados > 0)) {
    return sinDatos;
  }

  const { dias, tramos } = RANGOS[rango];
  const actual = periodo(rango, hoy, 0);
  // Índice vigente en una fecha: el del último día entrenado hasta esa fecha.
  const indiceEn = (fecha: string) => {
    let valor: number | null = null;
    for (const dia of historial) {
      if (dia.fecha > fecha) {
        break;
      }
      valor = dia.indice;
    }
    return valor;
  };

  // Un punto por tramo con el índice al final del tramo (si ya había datos).
  const puntos: PuntoRendimiento[] = [];
  for (let i = 0; i < tramos; i++) {
    const fin = sumarDias(actual.inicio, Math.floor(((i + 1) * dias) / tramos) - 1);
    const valor = indiceEn(fin);
    if (valor !== null) {
      puntos.push({ fecha: fin, valor: redondear(valor) });
    }
  }

  const indiceHoy = indiceEn(hoy) ?? 100;
  // Antes del periodo: el último valor previo, o 100 si empezaste dentro del periodo.
  const indiceAntes = indiceEn(sumarDias(actual.inicio, -1)) ?? 100;

  return {
    indice: redondear(indiceHoy),
    variacion: Math.round((indiceHoy / indiceAntes - 1) * 1000) / 10,
    puntos,
    mejoras: mayoresMejoras(marcas, actual),
  };
}

/**
 * Los 3 ejercicios cuyo 1RM estimado más subió en el periodo. Se compara la
 * mejor marca de hoy con la mejor de antes del periodo (o, si el ejercicio
 * empezó dentro del periodo, con su primer registro). Explica qué movió el índice.
 */
function mayoresMejoras({ dias, nombres }: MarcasPorDia, p: Periodo): MejoraEjercicio[] {
  const antes = new Map<string, number>();
  const primeroEnPeriodo = new Map<string, number>();
  const mejor = new Map<string, number>();

  for (const [fecha, marcas] of dias) {
    if (fecha > p.fin) {
      break;
    }
    for (const [id, marca] of marcas) {
      if (fecha < p.inicio) {
        antes.set(id, Math.max(antes.get(id) ?? 0, marca));
      } else if (!primeroEnPeriodo.has(id)) {
        primeroEnPeriodo.set(id, marca);
      }
      mejor.set(id, Math.max(mejor.get(id) ?? 0, marca));
    }
  }

  return [...mejor]
    .map(([id, marca]) => {
      const base = antes.get(id) ?? primeroEnPeriodo.get(id)!;
      return { ejercicioId: id, ejercicio: nombres.get(id) ?? id, variacion: redondear((marca / base - 1) * 100) };
    })
    .filter(mejora => mejora.variacion > 0)
    .sort((a, b) => b.variacion - a.variacion)
    .slice(0, 3);
}

/** 1RM estimado con la fórmula de Epley: peso × (1 + reps / 30). */
export function estimar1RM(pesoKg: number, repeticiones: number): number {
  return repeticiones <= 1 ? pesoKg : pesoKg * (1 + repeticiones / 30);
}

interface MarcasPorDia {
  /** [fecha, mejor 1RM de cada ejercicio ese día], de la fecha más vieja a la más nueva. */
  readonly dias: readonly (readonly [string, ReadonlyMap<string, number>])[];
  readonly nombres: ReadonlyMap<string, string>;
}

/** Mejor 1RM estimado de cada ejercicio por día (solo series con peso). */
function marcasPorDia(sesiones: readonly SesionEntrenamiento[]): MarcasPorDia {
  const porDia = new Map<string, Map<string, number>>();
  const nombres = new Map<string, string>();
  for (const sesion of sesiones) {
    for (const ejercicio of sesion.ejercicios) {
      for (const serie of ejercicio.series) {
        if (serie.pesoKg) {
          const dia = porDia.get(sesion.fecha) ?? new Map<string, number>();
          porDia.set(sesion.fecha, dia);
          const rm = estimar1RM(serie.pesoKg, serie.repeticiones);
          dia.set(ejercicio.ejercicioId, Math.max(dia.get(ejercicio.ejercicioId) ?? 0, rm));
          nombres.set(ejercicio.ejercicioId, ejercicio.nombre);
        }
      }
    }
  }
  return { dias: [...porDia].sort(([a], [b]) => a.localeCompare(b)), nombres };
}

function historialIndiceFuerza(dias: MarcasPorDia['dias']) {
  const mejores = new Map<string, number>();
  let indice = 100;
  const historial: { fecha: string; indice: number; comparados: number }[] = [];

  for (const [fecha, marcas] of dias) {
    const conocidos = [...mejores.keys()];
    let comparados = 0;
    const cambio = conocidos.reduce((suma, id) => {
      const antes = mejores.get(id)!;
      const marca = marcas.get(id);
      if (marca !== undefined) {
        comparados++;
      }
      return suma + Math.max(antes, marca ?? 0) / antes;
    }, 0);
    if (conocidos.length) {
      indice *= cambio / conocidos.length;
    }
    for (const [id, marca] of marcas) {
      mejores.set(id, Math.max(mejores.get(id) ?? 0, marca));
    }
    historial.push({ fecha, indice, comparados });
  }
  return historial;
}

function redondear(valor: number): number {
  return Math.round(valor * 10) / 10;
}

// ---------- Estadísticas ----------

function estadisticas(datos: DatosUsuario, actual: Periodo, anterior: Periodo): Estadistica[] {
  const contar = (p: Periodo) => datos.sesiones.filter(s => dentro(s.fecha, p)).length;
  const cardio = (p: Periodo) => datos.cardio
    .filter(a => dentro(a.fecha, p))
    .reduce((total, a) => total + a.duracionMin, 0);
  const records = (p: Periodo) => recordsLogradosEn(datos.sesiones, p);

  return [
    { tipo: 'entrenamientos', valor: contar(actual), variacion: variacion(contar(actual), contar(anterior)) },
    {
      tipo: 'volumen',
      valor: volumenEntre(datos.sesiones, actual),
      variacion: variacion(volumenEntre(datos.sesiones, actual), volumenEntre(datos.sesiones, anterior)),
    },
    { tipo: 'cardio', valor: cardio(actual), variacion: variacion(cardio(actual), cardio(anterior)) },
    { tipo: 'records', valor: records(actual), variacion: variacion(records(actual), records(anterior)) },
  ];
}

/** Ejercicios cuyo récord vigente (al final del periodo) se logró dentro del periodo. */
function recordsLogradosEn(sesiones: readonly SesionEntrenamiento[], p: Periodo): number {
  return calcularRecords(sesiones.filter(s => s.fecha <= p.fin))
    .filter(record => dentro((record.mayorPeso ?? record.masRepeticiones).fecha, p))
    .length;
}

// ---------- Entrenamiento de hoy ----------

/** Sugiere la rutina que hace más tiempo no se entrena (primero las nunca hechas). */
function entrenamientoSugerido({ rutinas, sesiones }: DatosUsuario, hoy: string): EntrenamientoHoy | null {
  if (!rutinas.length) {
    return null;
  }

  const ultimaVez = new Map<string, string>();
  for (const sesion of sesiones) {
    const anterior = ultimaVez.get(sesion.rutinaId);
    if (!anterior || sesion.fecha > anterior) {
      ultimaVez.set(sesion.rutinaId, sesion.fecha);
    }
  }

  const rutina = [...rutinas].sort((a, b) =>
    (ultimaVez.get(a.id) ?? '').localeCompare(ultimaVez.get(b.id) ?? ''))[0];
  const series = rutina.ejercicios.reduce((total, e) => total + e.series, 0);

  return {
    rutinaId: rutina.id,
    nombre: rutina.nombre,
    enfoque: textoUltimaVez(ultimaVez.get(rutina.id), hoy),
    // Estimación: ~2,5 min por serie (incluye descanso), redondeado a 5 min.
    duracionMin: Math.max(10, Math.round((series * 2.5) / 5) * 5),
    ejercicios: rutina.ejercicios.map(e => ({
      nombre: nombresEjercicios.get(e.ejercicioId) ?? 'Ejercicio no disponible',
      series: e.series,
      repeticiones: e.repeticiones,
    })),
  };
}

function textoUltimaVez(fecha: string | undefined, hoy: string): string {
  if (!fecha) {
    return 'Aún no la has realizado';
  }
  const dias = diasEntre(fecha, hoy);
  if (dias <= 0) {
    return 'Ya la hiciste hoy';
  }
  return dias === 1 ? 'Última vez: ayer' : `Última vez: hace ${dias} días`;
}

// ---------- Listas ----------

function actividadReciente({ sesiones, cardio }: DatosUsuario): ActividadReciente[] {
  const fuerza = sesiones.map((sesion): ActividadReciente => {
    const volumen = volumenSesion(sesion);
    const series = sesion.ejercicios.reduce((total, e) => total + e.series.length, 0);
    return {
      id: sesion.id,
      tipo: 'fuerza',
      titulo: sesion.nombreRutina,
      fecha: sesion.fecha,
      duracionMin: null,
      detalle: volumen > 0 ? `${formatearNumero(volumen)} kg` : `${series} ${series === 1 ? 'serie' : 'series'}`,
    };
  });
  const aerobica = cardio.map((actividad): ActividadReciente => ({
    id: actividad.id,
    tipo: 'cardio',
    titulo: actividad.tipo,
    fecha: actividad.fecha,
    duracionMin: actividad.duracionMin,
    detalle: actividad.distanciaKm ? `${formatearCantidad(actividad.distanciaKm)} km` : '',
  }));

  return [...fuerza, ...aerobica]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 4);
}

function recordsRecientes(sesiones: readonly SesionEntrenamiento[]): RecordPersonal[] {
  return calcularRecords(sesiones)
    .map(record => record.mayorPeso
      ? { id: record.ejercicioId, ejercicio: record.nombre, valor: record.mayorPeso.pesoKg!, unidad: 'kg', fecha: record.mayorPeso.fecha }
      : { id: record.ejercicioId, ejercicio: record.nombre, valor: record.masRepeticiones.repeticiones, unidad: 'reps', fecha: record.masRepeticiones.fecha })
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 3);
}

/** Primero los objetivos en curso, luego los programados y los cumplidos. Máximo 3. */
function objetivosActivos({ objetivos, sesiones, cardio }: DatosUsuario, hoy: string): ObjetivoResumen[] {
  const orden: Record<string, number> = { 'En curso': 0, Programado: 1, Cumplido: 2 };
  return objetivos
    .map(objetivo => ({ objetivo, evaluacion: evaluarObjetivo(objetivo, sesiones, cardio, hoy) }))
    .filter(({ evaluacion }) => evaluacion.estado in orden)
    .sort((a, b) => orden[a.evaluacion.estado] - orden[b.evaluacion.estado])
    .slice(0, 3)
    .map(({ objetivo, evaluacion }) => ({
      id: objetivo.id,
      titulo: objetivo.nombre,
      actual: evaluacion.actual,
      meta: objetivo.meta,
      unidad: evaluacion.unidad,
    }));
}

// ---------- Utilidades de fechas y volumen ----------

interface Periodo {
  readonly inicio: string;
  readonly fin: string;
}

/** desplazamiento 0 = periodo actual (termina hoy); 1 = el periodo anterior. */
function periodo(rango: Rango, hoy: string, desplazamiento: number): Periodo {
  const { dias } = RANGOS[rango];
  const fin = sumarDias(hoy, -dias * desplazamiento);
  return { inicio: sumarDias(fin, -(dias - 1)), fin };
}

function dentro(fecha: string, { inicio, fin }: Periodo): boolean {
  return fecha >= inicio && fecha <= fin;
}

function volumenSesion(sesion: SesionEntrenamiento): number {
  return sesion.ejercicios.reduce((total, ejercicio) =>
    total + ejercicio.series.reduce((suma, serie) => suma + serie.repeticiones * (serie.pesoKg ?? 0), 0), 0);
}

function volumenEntre(sesiones: readonly SesionEntrenamiento[], p: Periodo): number {
  return Math.round(sesiones.filter(s => dentro(s.fecha, p)).reduce((total, s) => total + volumenSesion(s), 0));
}

/** % de cambio. null si antes no había nada con qué comparar. */
function variacion(actual: number, anterior: number): number | null {
  if (anterior === 0) {
    return null;
  }
  return Math.round(((actual - anterior) / anterior) * 1000) / 10;
}

/** Suma días a una fecha AAAA-MM-DD usando la hora local (sin saltos por UTC). */
export function sumarDias(iso: string, dias: number): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia + dias);
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    String(fecha.getDate()).padStart(2, '0'),
  ].join('-');
}

function diasEntre(desde: string, hasta: string): number {
  const aFecha = (iso: string) => {
    const [anio, mes, dia] = iso.split('-').map(Number);
    return Date.UTC(anio, mes - 1, dia);
  };
  return Math.round((aFecha(hasta) - aFecha(desde)) / 86_400_000);
}
