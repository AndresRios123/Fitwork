import { computed, inject, Injectable } from '@angular/core';
import { AlmacenamientoUsuario } from '../../core/services/almacenamiento-usuario';
import { ActividadCardio, esActividadCardio } from './actividad-cardio';

@Injectable({ providedIn: 'root' })
export class CardioService {
  private readonly almacenamiento = inject(AlmacenamientoUsuario);
  private readonly coleccion = this.almacenamiento.coleccion('fitwork_cardio', esActividadCardio);

  readonly usuarioId = this.almacenamiento.usuarioId;
  readonly estado = this.coleccion.estado;
  readonly actividades = computed(() => [...this.coleccion.datos()]
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.id.localeCompare(b.id)));

  guardar(datos: Omit<ActividadCardio, 'id'>, id?: string): void {
    const actividad = { ...datos, id: id ?? crypto.randomUUID() };
    if (!esActividadCardio(actividad)) {
      throw new Error('Los datos de la actividad son inválidos.');
    }

    this.coleccion.actualizar(actividades => {
      if (!id) {
        return [...actividades, actividad];
      }
      if (!actividades.some(item => item.id === id)) {
        throw new Error('La actividad no existe en esta cuenta.');
      }
      return actividades.map(item => item.id === id ? actividad : item);
    });
  }

  eliminar(id: string): void {
    this.coleccion.actualizar(actividades => actividades.filter(item => item.id !== id));
  }
}
