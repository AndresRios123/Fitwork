import { SerieRealizada, SesionEntrenamiento } from '../entrenamientos/sesion';

interface Participacion {
  readonly rutina: string;
  readonly series: readonly SerieRealizada[];
}

interface DiaEntrenamiento {
  readonly fecha: string;
  readonly sesiones: readonly Participacion[];
  readonly series: number;
  readonly repeticiones: number;
  readonly pesoMaximo: number | null;
}

interface ProgresoEjercicio {
  readonly id: string;
  readonly nombre: string;
  readonly dias: readonly DiaEntrenamiento[];
}

export function historialPorEjercicio(sesiones: readonly SesionEntrenamiento[]): ProgresoEjercicio[] {
  const ejercicios = new Map<string, { nombre: string; fechas: Map<string, Participacion[]> }>();

  for (const sesion of sesiones) {
    for (const ejercicio of sesion.ejercicios) {
      const historial = ejercicios.get(ejercicio.ejercicioId) ?? { nombre: ejercicio.nombre, fechas: new Map() };
      ejercicios.set(ejercicio.ejercicioId, historial);

      const participaciones = historial.fechas.get(sesion.fecha) ?? [];
      participaciones.push({ rutina: sesion.nombreRutina, series: ejercicio.series });
      historial.fechas.set(sesion.fecha, participaciones);
    }
  }

  return Array.from(ejercicios, ([id, { nombre, fechas }]) => ({
    id,
    nombre,
    dias: Array.from(fechas, ([fecha, sesionesDelDia]) => resumirDia(fecha, sesionesDelDia))
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
  })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function resumirDia(fecha: string, sesiones: readonly Participacion[]): DiaEntrenamiento {
  let series = 0;
  let repeticiones = 0;
  let pesoMaximo: number | null = null;

  for (const sesion of sesiones) {
    series += sesion.series.length;
    for (const serie of sesion.series) {
      repeticiones += serie.repeticiones;
      if (serie.pesoKg !== null) {
        pesoMaximo = Math.max(pesoMaximo ?? serie.pesoKg, serie.pesoKg);
      }
    }
  }
  return { fecha, sesiones, series, repeticiones, pesoMaximo };
}
