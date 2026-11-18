import { computed, inject, Injectable } from '@angular/core';
import { AlmacenamientoUsuario } from '../../core/services/almacenamiento-usuario';
import { esObjetivo, Objetivo } from './objetivo';

@Injectable({ providedIn: 'root' })
export class ObjetivosService {
  private readonly almacenamiento = inject(AlmacenamientoUsuario);
  private readonly coleccion = this.almacenamiento.coleccion('fitwork_objetivos', esObjetivo);

  readonly usuarioId = this.almacenamiento.usuarioId;
  readonly estado = this.coleccion.estado;
  readonly objetivos = computed(() => [...this.coleccion.datos()]
    .sort((a, b) => a.fin.localeCompare(b.fin) || a.nombre.localeCompare(b.nombre, 'es')));

  guardar(objetivo: Objetivo, editar = false): void {
    if (!esObjetivo(objetivo)) {
      throw new Error('El objetivo es inválido.');
    }
    this.coleccion.actualizar(objetivos => {
      if (!editar) {
        return [...objetivos, objetivo];
      }
      if (!objetivos.some(item => item.id === objetivo.id)) {
        throw new Error('El objetivo no existe en esta cuenta.');
      }
      return objetivos.map(item => item.id === objetivo.id ? objetivo : item);
    });
  }

  eliminar(id: string): void {
    this.coleccion.actualizar(objetivos => objetivos.filter(objetivo => objetivo.id !== id));
  }
}
