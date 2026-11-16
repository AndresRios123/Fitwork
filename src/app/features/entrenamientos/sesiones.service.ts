import { afterNextRender, Injectable, signal } from '@angular/core';
import { EjercicioRealizado, esFechaSesion, SerieRealizada, SesionEntrenamiento } from './sesion';

const clave = 'fitwork_sesiones';

@Injectable({ providedIn: 'root' })
export class SesionesService {
  private readonly datos = signal<readonly SesionEntrenamiento[]>([]);
  private readonly estadoLectura = signal<'cargando' | 'listo' | 'error'>('cargando');

  readonly sesiones = this.datos.asReadonly();
  readonly estado = this.estadoLectura.asReadonly();

  constructor() {
    afterNextRender(() => {
      try {
        this.datos.set(leerSesiones());
        this.estadoLectura.set('listo');
      } catch {
        this.estadoLectura.set('error');
      }
    });
  }

  registrar(datos: Omit<SesionEntrenamiento, 'id'>): void {
    if (this.estado() !== 'listo') {
      throw new Error('El historial de sesiones no está disponible.');
    }

    const nuevas = [{ ...datos, id: crypto.randomUUID() }, ...leerSesiones()]
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    localStorage.setItem(clave, JSON.stringify(nuevas));
    this.datos.set(nuevas);
  }
}

function leerSesiones(): SesionEntrenamiento[] {
  const datos: unknown = JSON.parse(localStorage.getItem(clave) ?? '[]');
  if (!Array.isArray(datos) || !datos.every(esSesion)) {
    throw new Error('Formato de sesiones desconocido.');
  }
  return datos.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function esSesion(valor: unknown): valor is SesionEntrenamiento {
  if (!valor || typeof valor !== 'object') {
    return false;
  }
  const { id, rutinaId, nombreRutina, fecha, ejercicios } = valor as Partial<SesionEntrenamiento>;
  return typeof id === 'string' && typeof rutinaId === 'string' && typeof nombreRutina === 'string' &&
    esFechaSesion(fecha) && Array.isArray(ejercicios) && ejercicios.length > 0 &&
    ejercicios.every(esEjercicio);
}

function esEjercicio(valor: unknown): valor is EjercicioRealizado {
  if (!valor || typeof valor !== 'object') {
    return false;
  }
  const { ejercicioId, nombre, series } = valor as Partial<EjercicioRealizado>;
  return typeof ejercicioId === 'string' && typeof nombre === 'string' &&
    Array.isArray(series) && series.length > 0 && series.every(esSerie);
}

function esSerie(valor: unknown): valor is SerieRealizada {
  if (!valor || typeof valor !== 'object') {
    return false;
  }
  const { repeticiones, pesoKg } = valor as Partial<SerieRealizada>;
  return typeof repeticiones === 'number' && Number.isSafeInteger(repeticiones) && repeticiones > 0 &&
    (pesoKg === null || (typeof pesoKg === 'number' && Number.isFinite(pesoKg) && pesoKg >= 0));
}
