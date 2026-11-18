import { ActividadCardio } from './actividad-cardio';

export function resumirCardio(actividades: readonly ActividadCardio[]) {
  let minutos = 0;
  let distancia = 0;
  let conDistancia = 0;

  for (const actividad of actividades) {
    minutos += actividad.duracionMin;
    if (actividad.distanciaKm !== null) {
      distancia += actividad.distanciaKm;
      conDistancia++;
    }
  }
  return { cantidad: actividades.length, minutos, distancia, conDistancia };
}

export function evolucionCardio(
  actividades: readonly ActividadCardio[],
  metrica: 'duracionMin' | 'distanciaKm',
) {
  const fechas = new Map<string, number>();
  for (const actividad of actividades) {
    const valor = actividad[metrica];
    if (valor !== null) {
      fechas.set(actividad.fecha, (fechas.get(actividad.fecha) ?? 0) + valor);
    }
  }
  return [...fechas].sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, valor]) => ({ fecha, valor }));
}
