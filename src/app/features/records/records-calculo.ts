import { SerieRealizada, SesionEntrenamiento } from '../entrenamientos/sesion';

export interface MarcaPersonal extends SerieRealizada {
  readonly fecha: string;
  readonly rutina: string;
}

export interface RecordEjercicio {
  readonly ejercicioId: string;
  readonly nombre: string;
  readonly mayorPeso: MarcaPersonal | null;
  readonly masRepeticiones: MarcaPersonal;
}

export function calcularRecords(sesiones: readonly SesionEntrenamiento[]): RecordEjercicio[] {
  const records = new Map<string, RecordEjercicio>();
  // En caso de empate se conserva la primera fecha en que se alcanzó la marca.
  const ordenadas = [...sesiones].sort((a, b) =>
    a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id),
  );

  for (const sesion of ordenadas) {
    for (const ejercicio of sesion.ejercicios) {
      for (const serie of ejercicio.series) {
        const marca: MarcaPersonal = { ...serie, fecha: sesion.fecha, rutina: sesion.nombreRutina };
        const anterior = records.get(ejercicio.ejercicioId);
        const mayorPeso = anterior?.mayorPeso ?? null;
        const superaPeso = marca.pesoKg !== null &&
          (mayorPeso === null || marca.pesoKg > mayorPeso.pesoKg!);
        const superaRepeticiones = !anterior || marca.repeticiones > anterior.masRepeticiones.repeticiones;

        records.set(ejercicio.ejercicioId, {
          ejercicioId: ejercicio.ejercicioId,
          nombre: anterior?.nombre ?? ejercicio.nombre,
          mayorPeso: superaPeso ? marca : mayorPeso,
          masRepeticiones: superaRepeticiones ? marca : anterior.masRepeticiones,
        });
      }
    }
  }

  return [...records.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
