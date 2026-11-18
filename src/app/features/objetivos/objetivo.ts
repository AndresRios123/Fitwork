import { numeroPositivo, tiposCardio, TipoCardio } from '../cardio/actividad-cardio';
import { esFechaSesion } from '../entrenamientos/sesion';

interface MetaBase {
  readonly id: string;
  readonly nombre: string;
  readonly inicio: string;
  readonly fin: string;
  readonly meta: number;
}

export type Objetivo = MetaBase & (
  { readonly tipo: 'sesiones' } |
  { readonly tipo: 'distancia'; readonly actividad: TipoCardio } |
  { readonly tipo: 'peso'; readonly ejercicioId: string }
);

export function esObjetivo(valor: unknown): valor is Objetivo {
  if (!valor || typeof valor !== 'object') {
    return false;
  }
  const datos = valor as Record<string, unknown>;
  const { id, nombre, inicio, fin, meta, tipo } = datos;
  const baseValida = typeof id === 'string' && typeof nombre === 'string' &&
    nombre.trim().length > 0 && nombre.length <= 80 && esFechaSesion(inicio) &&
    esFechaSesion(fin) && inicio <= fin && numeroPositivo(meta);
  if (!baseValida) {
    return false;
  }
  switch (tipo) {
    case 'sesiones':
      return Number.isSafeInteger(meta);
    case 'distancia':
      return tiposCardio.some(actividad => actividad === datos['actividad']);
    case 'peso':
      return typeof datos['ejercicioId'] === 'string' && datos['ejercicioId'].length > 0;
    default:
      return false;
  }
}
