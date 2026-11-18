export interface EjercicioRutina {
  readonly ejercicioId: string;
  readonly series: number;
  readonly repeticiones: number;
}

export interface Rutina {
  readonly id: string;
  readonly nombre: string;
  readonly ejercicios: readonly EjercicioRutina[];
}
