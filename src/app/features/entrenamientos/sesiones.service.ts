import { computed, inject, Injectable } from '@angular/core';
import { AlmacenamientoUsuario } from '../../core/services/almacenamiento-usuario';
import { EjercicioRealizado, esFechaSesion, SerieRealizada, SesionEntrenamiento } from './sesion';

@Injectable({ providedIn: 'root' })
export class SesionesService {
  private readonly almacenamiento = inject(AlmacenamientoUsuario);
  private readonly coleccion = this.almacenamiento.coleccion('fitwork_sesiones', esSesion);

  readonly usuarioId = this.almacenamiento.usuarioId;
  readonly estado = this.coleccion.estado;
  readonly sesiones = computed(() => [...this.coleccion.datos()]
    .sort((a, b) => b.fecha.localeCompare(a.fecha)));

  registrar(datos: Omit<SesionEntrenamiento, 'id'>): void {
    this.coleccion.actualizar(sesiones => [{ ...datos, id: crypto.randomUUID() }, ...sesiones]);
  }
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
