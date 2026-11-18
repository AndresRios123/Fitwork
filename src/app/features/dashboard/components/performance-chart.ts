import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Rango, RANGOS, Rendimiento } from '../../../core/models/dashboard.model';
import { LineChartPlaceholder } from '../../../shared/ui/line-chart-placeholder/line-chart-placeholder';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { formatearNumero, formatearVariacion } from '../../../shared/utils/formato';

@Component({
  selector: 'app-performance-chart',
  imports: [LineChartPlaceholder, Skeleton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="titulo-rendimiento" [attr.aria-busy]="cargando()">
      <header>
        <div>
          <h2 id="titulo-rendimiento">Progreso de fuerza</h2>
          @if (cargando()) {
            <app-skeleton ancho="8rem" alto="2.25rem" />
          } @else if (rendimiento()?.puntos?.length) {
            @let datos = rendimiento()!;
            <p class="indice">
              <strong>{{ indice() }}</strong>
              @if (datos.variacion !== null) {
                <span class="badge" [class.baja]="datos.variacion < 0" [class.igual]="datos.variacion === 0">
                  {{ variacion() }}
                </span>
              }
            </p>
            <p class="ayuda">
              100 = tu punto de partida · fuerza estimada (1RM)
              <abbr [title]="explicacion" aria-label="Cómo se calcula">
                <i class="ph ph-info" aria-hidden="true"></i>
              </abbr>
            </p>
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
      } @else if (!rendimiento()?.puntos?.length) {
        <div class="estado">
          <i class="ph ph-chart-line-up vacio" aria-hidden="true"></i>
          <p>Registra un mismo ejercicio con peso en dos días distintos<br>para ver cómo evoluciona tu fuerza.</p>
        </div>
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

        <!-- Qué ejercicios movieron el índice + enlace al detalle por ejercicio -->
        <footer>
          <div class="mejoras">
            @if (mejoras().length) {
              <span class="etiqueta-mejoras">Mayores mejoras</span>
              <ul role="list">
                @for (mejora of mejoras(); track mejora.ejercicioId) {
                  <li><span>{{ mejora.ejercicio }}</span> <strong>{{ mejora.texto }}</strong></li>
                }
              </ul>
            } @else {
              <span class="etiqueta-mejoras">Sin nuevas marcas en este periodo</span>
            }
          </div>
          <a routerLink="/progreso">Ver por ejercicio <i class="ph ph-arrow-right" aria-hidden="true"></i></a>
        </footer>
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
    .estado i.vacio { color: var(--gray-300); }

    footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: .75rem 1rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--gray-100);
    }

    .mejoras {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: .5rem;
      min-width: 0;
    }

    .etiqueta-mejoras {
      color: var(--gray-500);
      font-size: .8125rem;
      font-weight: 600;
    }

    .mejoras ul {
      display: flex;
      flex-wrap: wrap;
      gap: .5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .mejoras li {
      display: inline-flex;
      gap: .375rem;
      padding: .25rem .625rem;
      border-radius: 999px;
      background: var(--gray-100);
      font-size: .8125rem;
    }

    .mejoras li strong { color: var(--color-success-text); }

    footer a {
      display: inline-flex;
      align-items: center;
      gap: .25rem;
      color: var(--color-primary);
      font-size: var(--fs-sm);
      font-weight: 700;
      text-decoration: none;
    }

    footer a:hover { text-decoration: underline; }

    footer a:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
      border-radius: var(--radius-sm);
    }

    .badge.igual {
      background: var(--gray-100);
      color: var(--gray-700);
    }

    abbr {
      display: inline-flex;
      vertical-align: middle;
      margin-left: .125rem;
      color: var(--gray-500);
      cursor: help;
      text-decoration: none;
    }

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
  protected readonly mejoras = computed(() => (this.rendimiento()?.mejoras ?? [])
    .map(mejora => ({ ...mejora, texto: formatearVariacion(mejora.variacion) })));
  protected readonly indice = computed(() => formatearNumero(this.rendimiento()?.indice ?? 100, 1));
  protected readonly explicacion =
    'Para cada ejercicio con peso se estima tu 1RM (peso × (1 + reps / 30)). ' +
    'Cada vez que superas tu mejor marca, el índice sube en proporción al promedio ' +
    'de mejora de tus ejercicios. 100 es tu punto de partida.';
  protected readonly variacion = computed(() => formatearVariacion(this.rendimiento()?.variacion ?? 0));
}
