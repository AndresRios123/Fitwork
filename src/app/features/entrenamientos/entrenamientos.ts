import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catalogo } from '../ejercicios/catalogo';
import { RegistroSesiones } from './registro-sesiones';
import { EjercicioRutina } from './rutina';
import { RutinaTarjeta } from './rutina-tarjeta';
import { RutinasService } from './rutinas.service';

const enteroPositivo = [Validators.required, Validators.pattern(/^[1-9]\d*$/), Validators.max(Number.MAX_SAFE_INTEGER)];

@Component({
  imports: [ReactiveFormsModule, RutinaTarjeta, RegistroSesiones],
  selector: 'app-entrenamientos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './entrenamientos.scss',
  templateUrl: './entrenamientos.html',
})
export class Entrenamientos {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly servicio = inject(RutinasService);

  protected readonly estado = this.servicio.estado;
  protected readonly rutinas = this.servicio.rutinas;
  protected readonly errorLectura = this.servicio.errorLectura;
  protected readonly catalogo = catalogo;
  protected readonly editor = linkedSignal<string | null, { id?: string } | null>({
    source: this.servicio.usuarioId,
    computation: () => null,
  });
  protected readonly editando = computed(() => !!this.editor()?.id);
  protected readonly mensaje = signal('');
  protected readonly error = signal('');

  protected readonly ejercicios = this.fb.array([this.crearFila()]);
  protected readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(80)]],
    ejercicios: this.ejercicios,
  });

  protected abrirEditor(id?: string): void {
    const rutina = this.rutinas().find(item => item.id === id);

    this.mensaje.set('');
    this.error.set('');
    this.formulario.reset({ nombre: rutina?.nombre ?? '' });
    this.ejercicios.clear();
    for (const ejercicio of rutina?.ejercicios ?? []) {
      this.ejercicios.push(this.crearFila(ejercicio));
    }
    if (!this.ejercicios.length) {
      this.agregarEjercicio();
    }
    this.editor.set({ id: rutina?.id });
  }

  protected cerrarEditor(): void {
    this.editor.set(null);
    this.error.set('');
  }

  protected agregarEjercicio(): void {
    this.ejercicios.push(this.crearFila());
  }

  protected quitarEjercicio(indice: number): void {
    if (this.ejercicios.length > 1) {
      this.ejercicios.removeAt(indice);
    }
  }

  protected guardar(): void {
    const editor = this.editor();
    if (!editor) {
      return;
    }

    this.error.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { nombre, ejercicios } = this.formulario.getRawValue();
    const ids = ejercicios.map(ejercicio => ejercicio.ejercicioId);
    if (new Set(ids).size !== ids.length) {
      this.error.set('Selecciona un ejercicio distinto en cada fila.');
      return;
    }
    if (ids.some(id => !catalogo.some(ejercicio => ejercicio.id === id))) {
      this.error.set('Selecciona ejercicios que estén disponibles en el catálogo.');
      return;
    }

    try {
      this.servicio.guardar({ nombre: nombre.trim(), ejercicios }, editor.id);
    } catch {
      this.error.set('No se pudo guardar la rutina en este navegador. Inténtalo de nuevo.');
      return;
    }

    this.cerrarEditor();
    this.mensaje.set(editor.id ? 'Rutina actualizada.' : 'Rutina creada.');
  }

  private crearFila(ejercicio?: EjercicioRutina) {
    return this.fb.group({
      ejercicioId: [ejercicio?.ejercicioId ?? '', Validators.required],
      series: [ejercicio?.series ?? 3, enteroPositivo],
      repeticiones: [ejercicio?.repeticiones ?? 10, enteroPositivo],
    });
  }
}
