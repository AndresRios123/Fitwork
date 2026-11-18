import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Objetivo } from '../../../core/models/dashboard.model';
import { PanelCard } from '../../../shared/ui/panel-card/panel-card';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { formatearNumero } from '../../../shared/utils/formato';

@Component({
  selector: 'app-goals-summary',
  imports: [PanelCard, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './lista-panel.scss',
  template: `
    <app-panel-card titulo="Objetivos" ruta="/objetivos" [attr.aria-busy]="cargando()">
      @if (cargando()) {
        <div class="cargando">
          @for (fila of [1, 2, 3]; track fila) { <app-skeleton alto="2.5rem" /> }
        </div>
      } @else {
        <ul role="list">
          @for (objetivo of progreso(); track objetivo.id) {
            <li class="objetivo">
              <span class="fila">
                <strong>{{ objetivo.titulo }}</strong>
                <span class="valor">{{ objetivo.porcentaje }} %</span>
              </span>
              <span class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100"
                    [attr.aria-valuenow]="objetivo.porcentaje" [attr.aria-label]="objetivo.titulo">
                <span [style.width.%]="objetivo.porcentaje"></span>
              </span>
              <span class="detalle">{{ objetivo.texto }}</span>
            </li>
          } @empty {
            <li class="vacio">
              <i class="ph ph-target" aria-hidden="true"></i>
              Define tu primer objetivo para seguir tu avance.
            </li>
          }
        </ul>
      }
    </app-panel-card>
  `,
  styles: `
    .objetivo {
      display: grid;
      gap: .375rem;
    }

    .fila {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      font-size: var(--fs-sm);
    }

    .barra {
      display: block;
      height: .5rem;
      overflow: hidden;
      border-radius: 999px;
      background: var(--gray-100);
    }

    .barra span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--color-primary);
    }

    .detalle {
      color: var(--gray-500);
      font-size: .8125rem;
    }
  `,
})
export class GoalsSummary {
  readonly objetivos = input<readonly Objetivo[]>([]);
  readonly cargando = input(false);

  protected readonly progreso = computed(() => this.objetivos().map(objetivo => ({
    ...objetivo,
    porcentaje: objetivo.meta > 0 ? Math.min(100, Math.round((objetivo.actual / objetivo.meta) * 100)) : 0,
    texto: `${formatearNumero(objetivo.actual)} de ${formatearNumero(objetivo.meta)} ${objetivo.unidad}`,
  })));
}
