import { computed, inject, Injectable } from '@angular/core';
import { AlmacenamientoUsuario } from '../../core/services/almacenamiento-usuario';
import { EjercicioRutina, Rutina } from './rutina';

@Injectable({ providedIn: 'root' })
export class RutinasService {
  private readonly almacenamiento = inject(AlmacenamientoUsuario);
  private readonly coleccion = this.almacenamiento.coleccion('fitwork_rutinas', esRutina);

  readonly usuarioId = this.almacenamiento.usuarioId;
  readonly estado = this.coleccion.estado;
  readonly rutinas = this.coleccion.datos;
  readonly errorLectura = computed(() => this.estado() === 'error'
    ? 'No se pudieron leer las rutinas guardadas.'
    : null);

  guardar(datos: Omit<Rutina, 'id'>, id?: string): void {
    this.coleccion.actualizar(rutinas => {
      if (!id) {
        return [...rutinas, { ...datos, id: crypto.randomUUID() }];
      }
      if (!rutinas.some(rutina => rutina.id === id)) {
        throw new Error('No se encontró la rutina en la cuenta activa.');
      }
      return rutinas.map(rutina => rutina.id === id ? { ...datos, id } : rutina);
    });
  }
}

function esRutina(valor: unknown): valor is Rutina {
  if (!valor || typeof valor !== 'object') {
    return false;
  }

  const { id, nombre, ejercicios } = valor as Partial<Rutina>;
  return typeof id === 'string' && typeof nombre === 'string' &&
    Array.isArray(ejercicios) && ejercicios.length > 0 && ejercicios.every(esEjercicioRutina);
}

function esEjercicioRutina(valor: unknown): valor is EjercicioRutina {
  if (!valor || typeof valor !== 'object') {
    return false;
  }

  const { ejercicioId, series, repeticiones } = valor as Partial<EjercicioRutina>;
  return typeof ejercicioId === 'string' && enteroPositivo(series) && enteroPositivo(repeticiones);
}

function enteroPositivo(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isSafeInteger(valor) && valor > 0;
}
