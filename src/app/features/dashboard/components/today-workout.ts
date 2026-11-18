import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { EntrenamientoHoy } from '../../../core/models/dashboard.model';
import { DuracionPipe } from '../../../shared/pipes/duracion.pipe';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';

@Component({
  selector: 'app-today-workout',
  imports: [DuracionPipe, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="titulo-hoy" [attr.aria-busy]="cargando()">
      <p class="etiqueta"><i class="ph ph-lightning" aria-hidden="true"></i> Entrenamiento de hoy</p>

      @if (cargando()) {
        <app-skeleton ancho="70%" alto="1.75rem" />
        <app-skeleton ancho="45%" />
        <app-skeleton alto="7rem" redondeo="var(--radius-md)" />
      } @else if (entrenamiento(); as hoy) {
        <h2 id="titulo-hoy">{{ hoy.nombre }}</h2>
        <p class="enfoque">{{ hoy.enfoque }}</p>

        <dl>
          <div><dt>Ejercicios</dt><dd>{{ hoy.ejercicios.length }}</dd></div>
          <div><dt>Series</dt><dd>{{ totalSeries() }}</dd></div>
          <div><dt>Duración</dt><dd>{{ hoy.duracionMin | duracion }}</dd></div>
        </dl>

        <ul role="list">
          @for (ejercicio of hoy.ejercicios; track ejercicio.nombre) {
            <li><span>{{ ejercicio.nombre }}</span><span>{{ ejercicio.series }} × {{ ejercicio.repeticiones }}</span></li>
          }
        </ul>

        <button type="button" (click)="comenzar.emit()">
          <i class="ph ph-play" aria-hidden="true"></i> Comenzar entrenamiento
        </button>
      } @else {
        <h2 id="titulo-hoy">Día de descanso</h2>
        <p class="enfoque">No tienes un entrenamiento programado para hoy.</p>
        <button type="button" (click)="comenzar.emit()">
          <i class="ph ph-plus" aria-hidden="true"></i> Planificar entrenamiento
        </button>
      }
    </section>
  `,
  styles: `
    :host { display: block; }

    section {
      display: flex;
      flex-direction: column;
      gap: .75rem;
      height: 100%;
      padding: 1.25rem;
      border-radius: var(--radius-md);
      background: var(--color-sidebar);
      color: #fff;
      box-shadow: var(--shadow-md);
    }

    section app-skeleton { opacity: .15; }

    p, h2, dl, dd, ul { margin: 0; }

    .etiqueta {
      display: flex;
      align-items: center;
      gap: .375rem;
      color: var(--color-primary);
      font-size: .75rem;
      font-weight: 800;
      letter-spacing: .06em;
      text-transform: uppercase;
    }

    h2 {
      font-size: var(--fs-lg);
      font-weight: 800;
    }

    .enfoque { color: #a1a1aa; font-size: var(--fs-sm); }

    dl {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: .5rem;
    }

    dl div {
      padding: .625rem;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, .06);
    }

    dt { color: #a1a1aa; font-size: .75rem; }
    dd { font-weight: 800; }

    ul {
      flex: 1;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: .5rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, .08);
      font-size: var(--fs-sm);
    }

    li span:last-child { color: #a1a1aa; font-weight: 700; flex-shrink: 0; }

    button {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      gap: .5rem;
      min-height: 2.75rem;
      margin-top: auto;
      border: 0;
      border-radius: var(--radius-sm);
      background: var(--color-primary);
      color: #fff;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }

    button:hover { filter: brightness(1.08); }

    button:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }
  `,
})
export class TodayWorkout {
  readonly entrenamiento = input<EntrenamientoHoy | null>(null);
  readonly cargando = input(false);
  readonly comenzar = output<void>();

  protected readonly totalSeries = computed(() =>
    (this.entrenamiento()?.ejercicios ?? []).reduce((total, ejercicio) => total + ejercicio.series, 0),
  );
}
