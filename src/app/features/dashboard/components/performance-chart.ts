import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { Rango, RANGOS, Rendimiento } from '../../../core/models/dashboard.model';
import { LineChartPlaceholder } from '../../../shared/ui/line-chart-placeholder/line-chart-placeholder';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { formatearNumero, formatearVariacion } from '../../../shared/utils/formato';

@Component({
  selector: 'app-performance-chart',
  imports: [LineChartPlaceholder, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="titulo-rendimiento" [attr.aria-busy]="cargando()">
      <header>
        <div>
          <h2 id="titulo-rendimiento">Rendimiento</h2>
          @if (cargando()) {
            <app-skeleton ancho="8rem" alto="2.25rem" />
          } @else if (rendimiento()?.puntos?.length) {
            @let datos = rendimiento()!;
            <p class="indice">
              <strong>{{ indice() }}</strong>
              <span class="badge" [class.baja]="datos.variacion < 0">{{ variacion() }}</span>
            </p>
            <p class="ayuda">Índice de rendimiento</p>
          }
        </div>
        <div class="pestanas" role="group" aria-label="Periodo del gráfico">
          @for (opcion of rangos; track opcion.valor) {
            <button type="button" [attr.aria-pressed]="opcion.valor === rango()" (click)="rango.set(opcion.valor)">
              {{ opcion.corta }}
            </button>
          }
        </div>
      </header>

      @if (error()) {
        <div class="estado" role="alert">
          <i class="ph ph-warning-circle" aria-hidden="true"></i>
          <p>No se pudo cargar el rendimiento.</p>
          <button type="button" class="reintentar" (click)="reintentar.emit()">Reintentar</button>
        </div>
      } @else if (cargando()) {
        <app-skeleton alto="14rem" redondeo="var(--radius-md)" />
      } @else {
        <!-- El gráfico se descarga en un archivo aparte cuando el navegador está libre. -->
        @defer (on idle) {
          <app-line-chart-placeholder [puntos]="rendimiento()?.puntos ?? []" />
        } @placeholder {
          <app-skeleton alto="14rem" redondeo="var(--radius-md)" />
        } @loading (minimum 200ms) {
          <app-skeleton alto="14rem" redondeo="var(--radius-md)" />
        } @error {
          <p class="estado">No se pudo mostrar el gráfico.</p>
        }
      }
    </section>
  `,
  styles: `
    :host { display: block; }

    section {
      height: 100%;
      padding: 1.25rem;
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }

    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    h2 {
      margin: 0 0 .5rem;
      font-size: var(--fs-base);
      font-weight: 800;
    }

    p { margin: 0; }

    .indice {
      display: flex;
      align-items: center;
      gap: .625rem;
    }

    .indice strong {
      font-size: 2rem;
      font-weight: 800;
      line-height: 1;
    }

    .badge {
      padding: .25rem .5rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--color-success) 15%, transparent);
      color: var(--color-success-text);
      font-size: .75rem;
      font-weight: 800;
    }

    .badge.baja {
      background: color-mix(in srgb, var(--color-danger) 12%, transparent);
      color: var(--color-danger);
    }

    .ayuda {
      margin-top: .25rem;
      color: var(--gray-500);
      font-size: .8125rem;
    }

    .pestanas {
      display: flex;
      gap: .25rem;
      padding: .25rem;
      border-radius: var(--radius-sm);
      background: var(--gray-100);
    }

    button {
      min-height: 2.25rem;
      padding: .375rem .625rem;
      border: 0;
      white-space: nowrap;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--gray-700);
      font: inherit;
      font-size: var(--fs-sm);
      font-weight: 700;
      cursor: pointer;
    }

    button[aria-pressed='true'] {
      background: var(--color-surface);
      color: var(--color-primary);
      box-shadow: var(--shadow-sm);
    }

    button:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .estado {
      display: grid;
      place-items: center;
      align-content: center;
      gap: .5rem;
      min-height: 14rem;
      color: var(--gray-500);
      text-align: center;
    }

    .estado i { font-size: 2rem; color: var(--color-danger); }

    .reintentar {
      border: 1px solid var(--gray-300);
      background: var(--color-surface);
      color: var(--gray-900);
    }
  `,
})
export class PerformanceChart {
  readonly rendimiento = input<Rendimiento | null>(null);
  readonly cargando = input(false);
  readonly error = input(false);
  readonly rango = model.required<Rango>();
  readonly reintentar = output<void>();

  protected readonly rangos = RANGOS;
  protected readonly indice = computed(() => formatearNumero(this.rendimiento()?.indice ?? 0, 1));
  protected readonly variacion = computed(() => formatearVariacion(this.rendimiento()?.variacion ?? 0));
}
