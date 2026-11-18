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
  readonly nombre: string;
  readonly enfoque: string;
  readonly duracionMin: number;
  readonly ejercicios: readonly EjercicioPlanificado[];
}

export interface ActividadReciente {
  readonly id: string;
  readonly tipo: 'fuerza' | 'cardio';
  readonly titulo: string;
  /** Fecha ISO (AAAA-MM-DD). */
  readonly fecha: string;
  readonly duracionMin: number;
  /** Resumen corto, p. ej. "8.420 kg" o "5,2 km". */
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

export interface Rendimiento {
  /** Índice actual de rendimiento (0-100). */
  readonly indice: number;
  /** Variación en % frente al inicio del periodo. */
  readonly variacion: number;
  readonly puntos: readonly PuntoRendimiento[];
}
