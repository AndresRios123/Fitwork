import { ActividadCardio } from '../cardio/actividad-cardio';
import { SesionEntrenamiento } from '../entrenamientos/sesion';
import { calcularRecords } from '../records/records-calculo';
import { Objetivo } from './objetivo';

const formato = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

export function evaluarObjetivo(
  objetivo: Objetivo,
  sesiones: readonly SesionEntrenamiento[],
  cardio: readonly ActividadCardio[],
  hoy: string,
) {
  const limite = objetivo.fin < hoy ? objetivo.fin : hoy;
  const enPeriodo = (fecha: string) => fecha >= objetivo.inicio && fecha <= limite;
  const sesionesDelPeriodo = sesiones.filter(sesion => enPeriodo(sesion.fecha));
  let actual = 0;

  switch (objetivo.tipo) {
    case 'sesiones':
      actual = sesionesDelPeriodo.length;
      break;
    case 'distancia':
      actual = cardio.filter(actividad => actividad.tipo === objetivo.actividad && enPeriodo(actividad.fecha))
        .reduce((total, actividad) => total + (actividad.distanciaKm ?? 0), 0);
      break;
    case 'peso':
      actual = calcularRecords(sesionesDelPeriodo).find(record => record.ejercicioId === objetivo.ejercicioId)
        ?.mayorPeso?.pesoKg ?? 0;
      break;
  }

  const restante = Math.max(0, objetivo.meta - actual);
  const unidad = unidades[objetivo.tipo];
  const estado = restante === 0 ? 'Cumplido' : hoy < objetivo.inicio ? 'Programado' :
    hoy > objetivo.fin ? 'Finalizado' : 'En curso';
  const porcentaje = Math.min(100, actual / objetivo.meta * 100);
  const sugerencia = recomendar(objetivo, restante, hoy, estado);

  return { actual, restante, unidad, estado, porcentaje, sugerencia };
}

const unidades = { sesiones: 'sesiones', distancia: 'km', peso: 'kg' } as const;

function recomendar(objetivo: Objetivo, restante: number, hoy: string, estado: string): string {
  if (estado === 'Cumplido') {
    return 'Alcanzaste tu meta con los registros de este periodo. Puedes crear un nuevo objetivo.';
  }
  if (estado === 'Programado') {
    return 'El seguimiento comienza en la fecha de inicio. Se contarán los registros dentro del periodo elegido.';
  }
  if (estado === 'Finalizado') {
    return `El periodo terminó. Faltaron ${formato.format(restante)} ${unidades[objetivo.tipo]}. Puedes editar el plazo o crear otra meta.`;
  }
  if (objetivo.tipo === 'peso') {
    return `Te faltan ${formato.format(restante)} kg para la marca elegida. Revisa el peso y las repeticiones de tus últimas series en Progreso.`;
  }

  const dias = Math.round((Date.parse(objetivo.fin) - Date.parse(hoy)) / 86400000) + 1;
  const ritmo = restante / dias * 7;
  if (objetivo.tipo === 'sesiones') {
    return `Te faltan ${restante} ${restante === 1 ? 'sesión' : 'sesiones'} y quedan ${dias} ${dias === 1 ? 'día' : 'días'}, incluido hoy. Para alcanzar tu meta necesitas un promedio de ${formato.format(ritmo)} sesiones por semana en ese plazo.`;
  }
  return `Te faltan ${formato.format(restante)} km de ${objetivo.actividad.toLowerCase()} y quedan ${dias} días, incluido hoy. El promedio necesario en ese plazo es ${formato.format(ritmo)} km por semana. Registra la distancia de cada actividad.`;
}
