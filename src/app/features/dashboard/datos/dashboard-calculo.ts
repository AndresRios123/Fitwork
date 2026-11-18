import {
  ActividadReciente,
  EntrenamientoHoy,
  Estadistica,
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

export function calcularRendimiento(sesiones: readonly SesionEntrenamiento[], rango: Rango, hoy: string): Rendimiento {
  const { dias, tramos } = RANGOS[rango];
  const actual = periodo(rango, hoy, 0);
  const total = volumenEntre(sesiones, actual);
  const previo = volumenEntre(sesiones, periodo(rango, hoy, 1));

  // Divide el periodo en tramos casi iguales; cada punto es el volumen de su tramo.
  const puntos: PuntoRendimiento[] = Array.from({ length: tramos }, (_, i) => {
    const tramo = {
      inicio: sumarDias(actual.inicio, Math.floor((i * dias) / tramos)),
      fin: sumarDias(actual.inicio, Math.floor(((i + 1) * dias) / tramos) - 1),
    };
    return { fecha: tramo.fin, valor: volumenEntre(sesiones, tramo) };
  });

  return {
    total,
    unidad: 'kg',
    variacion: variacion(total, previo),
    puntos: total > 0 ? puntos : [],
  };
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
      detalle: volumen > 0 ? `${formatearNumero(volumen)} kg` : `${series} series`,
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
