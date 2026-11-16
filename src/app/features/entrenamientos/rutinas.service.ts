import { afterNextRender, Injectable, signal } from '@angular/core';
import { EjercicioRutina, Rutina } from './rutina';

const clave = 'fitwork_rutinas';

@Injectable({ providedIn: 'root' })
export class RutinasService {
  private readonly datos = signal<readonly Rutina[]>([]);
  private readonly error = signal<string | null>(null);

  readonly rutinas = this.datos.asReadonly();
  readonly errorLectura = this.error.asReadonly();

  constructor() {
    // El almacenamiento del navegador se lee después del render inicial.
    afterNextRender(() => {
      try {
        const guardado: unknown = JSON.parse(localStorage.getItem(clave) ?? '[]');
        if (!Array.isArray(guardado) || !guardado.every(esRutina)) {
          throw new Error('Formato de rutinas desconocido');
        }

        this.datos.set(guardado);
      } catch {
        this.error.set('No se pudieron leer las rutinas guardadas.');
      }
    });
  }

  guardar(datos: Omit<Rutina, 'id'>, id?: string): void {
    if (this.errorLectura()) {
      throw new Error('No se pueden guardar cambios mientras haya un error de lectura.');
    }

    const rutinas = this.rutinas();
    const actualizadas = id
      ? rutinas.map(rutina => rutina.id === id ? { ...datos, id } : rutina)
      : [...rutinas, { ...datos, id: crypto.randomUUID() }];

    localStorage.setItem(clave, JSON.stringify(actualizadas));
    this.datos.set(actualizadas);
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
