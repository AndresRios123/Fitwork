import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatearVariacion } from '../../utils/formato';
import { Skeleton } from '../skeleton/skeleton';

// Átomo: tarjeta con un número destacado, su etiqueta y la variación.
@Component({
  selector: 'app-stat-card',
  imports: [Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article>
      <span class="icono"><i class="ph" [class]="icono()" aria-hidden="true"></i></span>
      <p class="etiqueta">{{ etiqueta() }}</p>
      @if (cargando()) {
        <app-skeleton ancho="60%" alto="1.75rem" />
        <app-skeleton ancho="40%" alto=".875rem" />
      } @else {
        <p class="valor">{{ valor() }}</p>
        @if (variacion() !== null) {
          <p class="variacion" [class]="tendencia()">
            <i class="ph" [class]="iconoTendencia()" aria-hidden="true"></i>
            {{ textoVariacion() }} <span>vs. periodo anterior</span>
          </p>
        } @else {
          <p class="variacion">Sin datos previos</p>
        }
      }
    </article>
  `,
  styles: `
    :host { display: block; }

    article {
      display: grid;
      gap: .5rem;
      height: 100%;
      padding: 1.25rem;
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }

    .icono {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--color-primary) 12%, transparent);
      color: var(--color-primary);
      font-size: 1.25rem;
    }

    p { margin: 0; }

    .etiqueta {
      color: var(--gray-500);
      font-size: var(--fs-sm);
      font-weight: 600;
    }

    .valor {
      font-size: var(--fs-xl);
      font-weight: 800;
      line-height: 1.1;
      overflow-wrap: anywhere;
    }

    .variacion {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: .25rem;
      color: var(--gray-500);
      font-size: .8125rem;
      font-weight: 700;
    }

    .variacion span { font-weight: 500; color: var(--gray-500); }
    .sube { color: var(--color-success-text); }
    .baja { color: var(--color-danger); }
  `,
})
export class StatCard {
  readonly icono = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly valor = input('');
  readonly variacion = input<number | null>(null);
  readonly cargando = input(false);

  protected readonly tendencia = computed(() => {
    const variacion = this.variacion() ?? 0;
    return variacion > 0 ? 'sube' : variacion < 0 ? 'baja' : 'igual';
  });

  protected readonly iconoTendencia = computed(() => ({
    sube: 'ph-trend-up',
    baja: 'ph-trend-down',
    igual: 'ph-minus',
  })[this.tendencia()]);

  protected readonly textoVariacion = computed(() => formatearVariacion(this.variacion() ?? 0));
}
