import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GraficoEvolucion } from '../../shared/grafico-evolucion/grafico-evolucion';
import { SesionesService } from '../entrenamientos/sesiones.service';
import { historialPorEjercicio } from './progreso-entrenamiento';

const metricas = [
  { id: 'series', etiqueta: 'Series completadas', unidad: 'series' },
  { id: 'repeticiones', etiqueta: 'Repeticiones totales', unidad: 'reps' },
  { id: 'pesoMaximo', etiqueta: 'Peso más alto del día', unidad: 'kg' },
] as const;

type Metrica = (typeof metricas)[number];

@Component({
  imports: [DatePipe, DecimalPipe, RouterLink, GraficoEvolucion],
  selector: 'app-progreso',
  styleUrl: './progreso.scss',
  templateUrl: './progreso.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Progreso {
  private readonly sesiones = inject(SesionesService);

  protected readonly estado = this.sesiones.estado;
  protected readonly metricas = metricas;
  protected readonly metrica = signal<Metrica>(metricas[0]);
  protected readonly ejercicios = computed(() => historialPorEjercicio(this.sesiones.sesiones()));

  private readonly ejercicioElegido = linkedSignal<string | null, string>({
    source: this.sesiones.usuarioId,
    computation: () => '',
  });

  protected readonly ejercicioActual = computed(() => {
    const ejercicios = this.ejercicios();
    return ejercicios.find(ejercicio => ejercicio.id === this.ejercicioElegido()) ?? ejercicios[0];
  });

  protected readonly puntos = computed(() => {
    const dias = this.ejercicioActual()?.dias ?? [];
    const { id } = this.metrica();
    return [...dias].reverse().flatMap(dia => {
      const valor = dia[id];
      return valor === null ? [] : [{ fecha: dia.fecha, valor }];
    });
  });

  protected seleccionarEjercicio(id: string): void {
    this.ejercicioElegido.set(id);
  }

  protected seleccionarMetrica(id: string): void {
    this.metrica.set(metricas.find(metrica => metrica.id === id) ?? metricas[0]);
  }
}
