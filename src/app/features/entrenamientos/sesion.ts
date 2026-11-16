export interface SerieRealizada {
  readonly repeticiones: number;
  readonly pesoKg: number | null;
}

export interface EjercicioRealizado {
  readonly ejercicioId: string;
  readonly nombre: string;
  readonly series: readonly SerieRealizada[];
}

export interface SesionEntrenamiento {
  readonly id: string;
  readonly rutinaId: string;
  readonly nombreRutina: string;
  readonly fecha: string;
  readonly ejercicios: readonly EjercicioRealizado[];
}

export function esFechaSesion(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const fecha = new Date(valor);
  return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}
