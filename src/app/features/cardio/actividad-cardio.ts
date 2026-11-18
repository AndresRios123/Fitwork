import { esFechaSesion } from '../entrenamientos/sesion';

export const tiposCardio = ['Caminar', 'Correr', 'Ciclismo', 'Natación', 'Otro'] as const;
export type TipoCardio = (typeof tiposCardio)[number];

export interface ActividadCardio {
  readonly id: string;
  readonly tipo: TipoCardio;
  readonly fecha: string;
  readonly duracionMin: number;
  readonly distanciaKm: number | null;
}

export function numeroPositivo(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0;
}

export function esActividadCardio(valor: unknown): valor is ActividadCardio {
  if (!valor || typeof valor !== 'object') {
    return false;
  }
  const { id, tipo, fecha, duracionMin, distanciaKm } = valor as Partial<ActividadCardio>;
  return typeof id === 'string' && tiposCardio.some(item => item === tipo) &&
    esFechaSesion(fecha) && numeroPositivo(duracionMin) &&
    (distanciaKm === null || numeroPositivo(distanciaKm));
}

export function fechaLocalHoy(): string {
  const hoy = new Date();
  return [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, '0'),
    String(hoy.getDate()).padStart(2, '0'),
  ].join('-');
}
