import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catalogo } from '../ejercicios/catalogo';
import { Rutina } from './rutina';
import { esFechaSesion } from './sesion';
import { RutinasService } from './rutinas.service';
import { SesionesService } from './sesiones.service';

type FilaSerie = FormGroup<{
  repeticiones: FormControl<number>;
  pesoKg: FormControl<number | null>;
}>;

@Component({
  selector: 'app-registro-sesiones',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './registro-sesiones.html',
  styleUrl: './registro-sesiones.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroSesiones {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly rutinasService = inject(RutinasService);
  private readonly sesionesService = inject(SesionesService);
  private readonly nombres = new Map(catalogo.map(ejercicio => [ejercicio.id, ejercicio.nombre]));

  protected readonly rutinas = this.rutinasService.rutinas;
  protected readonly errorRutinas = this.rutinasService.errorLectura;
  protected readonly sesiones = this.sesionesService.sesiones;
  protected readonly estado = this.sesionesService.estado;
  protected readonly abierto = signal(false);
  protected readonly rutina = signal<Rutina | null>(null);
  protected readonly error = signal('');
  protected readonly mensaje = signal('');
  protected readonly seriesPorEjercicio = signal<readonly FormArray<FilaSerie>[]>([]);
  protected readonly fecha = this.fb.control('', [
    Validators.required,
    control => esFechaSesion(control.value) ? null : { fechaInvalida: true },
  ]);

  protected abrir(): void {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    this.fecha.reset(`${hoy.getFullYear()}-${mes}-${dia}`);
    this.seleccionarRutina('');
    this.mensaje.set('');
    this.abierto.set(true);
  }

  protected seleccionarRutina(id: string): void {
    const rutina = this.rutinas().find(item => item.id === id) ?? null;
    this.rutina.set(rutina);
    this.error.set('');
    // Las series planificadas se muestran como referencia. Solo se guardan las registradas.
    this.seriesPorEjercicio.set(rutina?.ejercicios.map(() => this.fb.array<FilaSerie>([])) ?? []);
  }

  protected nombreEjercicio(id: string): string {
    return this.nombres.get(id) ?? 'Ejercicio no disponible';
  }

  protected agregarSerie(indice: number): void {
    const ejercicio = this.rutina()?.ejercicios[indice];
    if (!ejercicio) {
      return;
    }
    this.seriesPorEjercicio()[indice].push(this.fb.group({
      repeticiones: [ejercicio.repeticiones, [
        Validators.required, Validators.pattern(/^[1-9]\d*$/), Validators.max(Number.MAX_SAFE_INTEGER),
      ]],
      pesoKg: new FormControl<number | null>(null, [
        Validators.min(0), control => control.value === null || Number.isFinite(control.value)
          ? null : { pesoInvalido: true },
      ]),
    }));
    this.error.set('');
  }

  protected quitarSerie(ejercicio: number, serie: number): void {
    this.seriesPorEjercicio()[ejercicio].removeAt(serie);
    this.error.set('');
  }

  protected guardar(): void {
    this.error.set('');
    const rutina = this.rutina();
    if (!rutina) {
      this.error.set('Selecciona la rutina que entrenaste.');
      return;
    }

    const seriesPorEjercicio = this.seriesPorEjercicio();
    if (this.fecha.invalid || seriesPorEjercicio.some(series => series.invalid)) {
      this.fecha.markAsTouched();
      seriesPorEjercicio.forEach(series => series.markAllAsTouched());
      this.error.set('Revisa la fecha, las repeticiones y el peso de las series ingresadas.');
      return;
    }

    const ejercicios = rutina.ejercicios.flatMap((ejercicio, indice) => {
      const series = seriesPorEjercicio[indice].getRawValue();
      return series.length ? [{
        ejercicioId: ejercicio.ejercicioId,
        nombre: this.nombreEjercicio(ejercicio.ejercicioId),
        series,
      }] : [];
    });
    if (!ejercicios.length) {
      this.error.set('Agrega al menos una serie realizada.');
      return;
    }

    try {
      this.sesionesService.registrar({
        fecha: this.fecha.value,
        rutinaId: rutina.id,
        nombreRutina: rutina.nombre,
        ejercicios,
      });
    } catch {
      this.error.set('No se pudo guardar la sesión en este navegador.');
      return;
    }
    this.abierto.set(false);
    this.mensaje.set('Sesión guardada.');
  }
}
