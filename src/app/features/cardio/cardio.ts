import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { esFechaSesion } from '../entrenamientos/sesion';
import { GraficoEvolucion } from '../../shared/grafico-evolucion/grafico-evolucion';
import { ActividadCardio, fechaLocalHoy, numeroPositivo, tiposCardio } from './actividad-cardio';
import { evolucionCardio, resumirCardio } from './cardio-resumen';
import { CardioService } from './cardio.service';

@Component({
  selector: 'app-cardio',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, GraficoEvolucion],
  templateUrl: './cardio.html',
  styleUrl: './cardio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cardio {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly servicio = inject(CardioService);

  protected readonly tipos = tiposCardio;
  protected readonly estado = this.servicio.estado;
  protected readonly hoy = fechaLocalHoy;
  protected readonly editor = linkedSignal<string | null, { id?: string } | null>({
    source: this.servicio.usuarioId,
    computation: () => null,
  });
  protected readonly pendienteEliminar = linkedSignal({
    source: this.servicio.usuarioId,
    computation: (): string | null => null,
  });

  private readonly notificacion = signal<{ usuarioId: string; texto: string; error: boolean } | null>(null);
  protected readonly aviso = computed(() => {
    const aviso = this.notificacion();
    return aviso?.usuarioId === this.servicio.usuarioId() ? aviso : null;
  });

  protected readonly formulario = this.fb.group({
    tipo: [tiposCardio[0] as ActividadCardio['tipo'], Validators.required],
    fecha: [fechaLocalHoy(), [Validators.required, control =>
      esFechaSesion(control.value) && control.value <= fechaLocalHoy() ? null : { fechaInvalida: true },
    ]],
    duracionMin: new FormControl<number | null>(null, [
      Validators.required, control => numeroPositivo(control.value) ? null : { duracionInvalida: true },
    ]),
    distanciaKm: new FormControl<number | null>(null, [
      control => control.value === null || numeroPositivo(control.value) ? null : { distanciaInvalida: true },
    ]),
  });

  protected readonly filtros = this.fb.group({
    tipo: '',
    desde: '',
    hasta: '',
  }, {
    validators: control => {
      const { desde, hasta } = control.getRawValue();
      const fechasValidas = (!desde || esFechaSesion(desde)) && (!hasta || esFechaSesion(hasta));
      return fechasValidas && (!desde || !hasta || desde <= hasta) ? null : { rangoInvalido: true };
    },
  });
  private readonly valoresFiltros = toSignal(this.filtros.valueChanges, {
    initialValue: this.filtros.getRawValue(),
  });
  protected readonly rangoInvalido = computed(() => {
    this.valoresFiltros();
    return this.filtros.invalid;
  });
  protected readonly filtradas = computed(() => {
    const { tipo, desde, hasta } = this.valoresFiltros();
    if (this.rangoInvalido()) {
      return [];
    }
    return this.servicio.actividades().filter(actividad =>
      (!tipo || actividad.tipo === tipo) &&
      (!desde || actividad.fecha >= desde) &&
      (!hasta || actividad.fecha <= hasta),
    );
  });
  protected readonly resumen = computed(() => resumirCardio(this.filtradas()));
  protected readonly metrica = signal<'duracionMin' | 'distanciaKm'>('duracionMin');
  protected readonly puntos = computed(() => evolucionCardio(this.filtradas(), this.metrica()));

  protected abrir(id?: string): void {
    const actividad = this.servicio.actividades().find(item => item.id === id);
    this.formulario.reset({
      tipo: actividad?.tipo ?? tiposCardio[0],
      fecha: actividad?.fecha ?? fechaLocalHoy(),
      duracionMin: actividad?.duracionMin ?? null,
      distanciaKm: actividad?.distanciaKm ?? null,
    });
    this.notificacion.set(null);
    this.pendienteEliminar.set(null);
    this.editor.set({ id: actividad?.id });
  }

  protected guardar(): void {
    const editor = this.editor();
    if (!editor) {
      return;
    }
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { tipo, fecha, duracionMin, distanciaKm } = this.formulario.getRawValue();
    if (!numeroPositivo(duracionMin)) {
      return;
    }

    try {
      this.servicio.guardar({ tipo, fecha, duracionMin, distanciaKm }, editor.id);
    } catch {
      this.informar('No se pudo guardar la actividad en este navegador.', true);
      return;
    }
    this.editor.set(null);
    this.informar(editor.id ? 'Actividad actualizada.' : 'Actividad registrada.');
  }

  protected eliminar(id: string): void {
    if (this.pendienteEliminar() !== id) {
      return;
    }
    try {
      this.servicio.eliminar(id);
    } catch {
      this.informar('No se pudo eliminar la actividad en este navegador.', true);
      return;
    }
    if (this.editor()?.id === id) {
      this.editor.set(null);
    }
    this.pendienteEliminar.set(null);
    this.informar('Actividad eliminada.');
  }

  private informar(texto: string, error = false): void {
    const usuarioId = this.servicio.usuarioId();
    if (usuarioId) {
      this.notificacion.set({ usuarioId, texto, error });
    }
  }
}
