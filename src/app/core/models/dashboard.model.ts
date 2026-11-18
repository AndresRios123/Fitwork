// Datos que muestra el panel principal. Son el "contrato" con la API:
// hoy los entrega MockDashboardApi y mañana el backend real.

export type Rango = '7d' | '30d' | '3m' | '1a';

export const RANGOS: readonly { readonly valor: Rango; readonly etiqueta: string; readonly corta: string }[] = [
  { valor: '7d', etiqueta: 'Últimos 7 días', corta: '7 días' },
  { valor: '30d', etiqueta: 'Últimos 30 días', corta: '30 días' },
  { valor: '3m', etiqueta: 'Últimos 3 meses', corta: '3 meses' },
  { valor: '1a', etiqueta: 'Último año', corta: '1 año' },
];

export type TipoEstadistica = 'entrenamientos' | 'volumen' | 'cardio' | 'records';

export interface Estadistica {
  readonly tipo: TipoEstadistica;
  /** Entrenamientos y récords: cantidad. Volumen: kg. Cardio: minutos. */
  readonly valor: number;
  /** Variación en % frente al periodo anterior. null si no hay con qué comparar. */
  readonly variacion: number | null;
}

export interface EjercicioPlanificado {
  readonly nombre: string;
  readonly series: number;
  readonly repeticiones: number;
}

export interface EntrenamientoHoy {
  /** Rutina sugerida; se usa para abrirla al pulsar "Comenzar". */
  readonly rutinaId: string | null;
  readonly nombre: string;
  /** Texto corto bajo el nombre, p. ej. "Última vez hace 5 días". */
  readonly enfoque: string;
  /** Duración aproximada en minutos. */
  readonly duracionMin: number;
  readonly ejercicios: readonly EjercicioPlanificado[];
}

export interface ActividadReciente {
  readonly id: string;
  readonly tipo: 'fuerza' | 'cardio';
  readonly titulo: string;
  /** Fecha ISO (AAAA-MM-DD). */
  readonly fecha: string;
  /** null cuando no se registró (las sesiones de fuerza no guardan duración). */
  readonly duracionMin: number | null;
  /** Resumen corto, p. ej. "8.420 kg" o "5,2 km". Puede ir vacío. */
  readonly detalle: string;
}

export interface RecordPersonal {
  readonly id: string;
  readonly ejercicio: string;
  readonly valor: number;
  readonly unidad: string;
  readonly fecha: string;
}

export interface Objetivo {
  readonly id: string;
  readonly titulo: string;
  readonly actual: number;
  readonly meta: number;
  readonly unidad: string;
}

export interface ResumenDashboard {
  readonly estadisticas: readonly Estadistica[];
  readonly entrenamientoHoy: EntrenamientoHoy | null;
  readonly actividad: readonly ActividadReciente[];
  readonly records: readonly RecordPersonal[];
  readonly objetivos: readonly Objetivo[];
}

export interface PuntoRendimiento {
  readonly fecha: string;
  readonly valor: number;
}

/** Progreso general de fuerza: índice donde 100 = punto de partida del usuario. */
export interface Rendimiento {
  /** Índice actual (p. ej. 112,4 = un 12,4 % más fuerte que al empezar). */
  readonly indice: number;
  /** Cuánto cambió el índice dentro del periodo, en %. null si no hay datos. */
  readonly variacion: number | null;
  /** Índice al final de cada día, semana o mes del rango. Vacío si no hay datos suficientes. */
  readonly puntos: readonly PuntoRendimiento[];
  /** Ejercicios que más mejoraron en el periodo (máx. 3); explican la subida del índice. */
  readonly mejoras: readonly MejoraEjercicio[];
}

export interface MejoraEjercicio {
  readonly ejercicioId: string;
  readonly ejercicio: string;
  /** Mejora del 1RM estimado en el periodo, en %. */
  readonly variacion: number;
}
