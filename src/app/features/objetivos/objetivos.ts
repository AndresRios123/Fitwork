import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { fechaLocalHoy, numeroPositivo, tiposCardio, TipoCardio } from '../cardio/actividad-cardio';
import { CardioService } from '../cardio/cardio.service';
import { catalogo } from '../ejercicios/catalogo';
import { esFechaSesion } from '../entrenamientos/sesion';
import { SesionesService } from '../entrenamientos/sesiones.service';
import { Objetivo } from './objetivo';
import { evaluarObjetivo } from './objetivos-calculo';
import { ObjetivosService } from './objetivos.service';

@Component({
  selector: 'app-objetivos',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './objetivos.html',
  styleUrl: './objetivos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Objetivos {
  private readonly servicio = inject(ObjetivosService);
  private readonly sesiones = inject(SesionesService);
  private readonly cardio = inject(CardioService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly tiposCardio = tiposCardio;
  protected readonly ejercicios = catalogo;
  protected readonly estado = this.servicio.estado;
  protected readonly editor = linkedSignal<string | null, { id?: string } | null>({
    source: this.servicio.usuarioId, computation: () => null,
  });
  protected readonly pendienteEliminar = linkedSignal({
    source: this.servicio.usuarioId, computation: (): string | null => null,
  });
  protected readonly notificacion = linkedSignal({
    source: this.servicio.usuarioId, computation: () => '',
  });

  protected readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(80)]],
    tipo: ['sesiones' as Objetivo['tipo']],
    inicio: [fechaLocalHoy()],
    fin: [fechaLocalHoy()],
    meta: new FormControl<number | null>(null, [
      Validators.required, control => numeroPositivo(control.value) ? null : { metaInvalida: true },
    ]),
    actividad: [tiposCardio[1] as TipoCardio],
    ejercicioId: [''],
  }, {
    validators: control => {
      const { inicio, fin, meta, tipo, ejercicioId } = control.getRawValue();
      const fechasValidas = esFechaSesion(inicio) && esFechaSesion(fin) && inicio <= fin;
      const unidadValida = tipo !== 'sesiones' || Number.isSafeInteger(meta);
      const ejercicioValido = tipo !== 'peso' || catalogo.some(ejercicio => ejercicio.id === ejercicioId);
      return fechasValidas && unidadValida && ejercicioValido ? null : { objetivoInvalido: true };
    },
  });

  private readonly valores = toSignal(this.formulario.valueChanges, { initialValue: this.formulario.getRawValue() });
  protected readonly tipo = computed(() => this.valores().tipo ?? 'sesiones');

  protected readonly tarjetas = computed(() => this.servicio.objetivos().map(objetivo => {
    const fuente = objetivo.tipo === 'distancia' ? this.cardio.estado() : this.sesiones.estado();
    const resultado = evaluarObjetivo(objetivo, this.sesiones.sesiones(), this.cardio.actividades(), fechaLocalHoy());
    const detalle = objetivo.tipo === 'peso' ?
      catalogo.find(ejercicio => ejercicio.id === objetivo.ejercicioId)?.nombre ?? 'Ejercicio no disponible' :
      objetivo.tipo === 'distancia' ? objetivo.actividad : 'Sesiones de entrenamiento';
    return { objetivo, fuente, resultado, detalle };
  }));

  protected abrir(id?: string): void {
    const objetivo = this.servicio.objetivos().find(item => item.id === id);
    this.formulario.reset({
      nombre: objetivo?.nombre ?? '',
      tipo: objetivo?.tipo ?? 'sesiones',
      inicio: objetivo?.inicio ?? fechaLocalHoy(),
      fin: objetivo?.fin ?? fechaLocalHoy(),
      meta: objetivo?.meta ?? null,
      actividad: objetivo?.tipo === 'distancia' ? objetivo.actividad : tiposCardio[1],
      ejercicioId: objetivo?.tipo === 'peso' ? objetivo.ejercicioId : '',
    });
    this.editor.set({ id: objetivo?.id });
    this.pendienteEliminar.set(null);
    this.notificacion.set('');
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
    const { nombre, tipo, inicio, fin, meta, actividad, ejercicioId } = this.formulario.getRawValue();
    if (!numeroPositivo(meta)) {
      return;
    }
    const base = { id: editor.id ?? crypto.randomUUID(), nombre: nombre.trim(), inicio, fin, meta };
    let objetivo: Objetivo;
    switch (tipo) {
      case 'distancia':
        objetivo = { ...base, tipo, actividad };
        break;
      case 'peso':
        objetivo = { ...base, tipo, ejercicioId };
        break;
      default:
        objetivo = { ...base, tipo: 'sesiones' };
    }
    try {
      this.servicio.guardar(objetivo, !!editor.id);
    } catch {
      this.notificacion.set('No se pudo guardar el objetivo en este navegador.');
      return;
    }
    this.editor.set(null);
    this.notificacion.set(editor.id ? 'Objetivo actualizado.' : 'Objetivo creado.');
  }

  protected eliminar(id: string): void {
    if (this.pendienteEliminar() !== id) {
      return;
    }
    try {
      this.servicio.eliminar(id);
    } catch {
      this.notificacion.set('No se pudo eliminar el objetivo.');
      return;
    }
    if (this.editor()?.id === id) {
      this.editor.set(null);
    }
    this.pendienteEliminar.set(null);
    this.notificacion.set('Objetivo eliminado.');
  }
}
