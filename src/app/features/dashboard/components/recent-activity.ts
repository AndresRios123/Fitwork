import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActividadReciente } from '../../../core/models/dashboard.model';
import { DuracionPipe } from '../../../shared/pipes/duracion.pipe';
import { PanelCard } from '../../../shared/ui/panel-card/panel-card';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { formatearFechaCorta } from '../../../shared/utils/formato';

@Component({
  selector: 'app-recent-activity',
  imports: [PanelCard, Skeleton, DuracionPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './lista-panel.scss',
  template: `
    <app-panel-card titulo="Actividad reciente" ruta="/entrenamientos" [attr.aria-busy]="cargando()">
      @if (cargando()) {
        <div class="cargando">
          @for (fila of [1, 2, 3]; track fila) { <app-skeleton alto="2.5rem" /> }
        </div>
      } @else {
        <ul role="list">
          @for (item of actividad(); track item.id) {
            <li>
              <span class="icono">
                <i class="ph" [class]="item.tipo === 'cardio' ? 'ph-person-simple-run' : 'ph-barbell'" aria-hidden="true"></i>
              </span>
              <span class="texto">
                <strong>{{ item.titulo }}</strong>
                <span>{{ fecha(item.fecha) }}@if (item.duracionMin) { · {{ item.duracionMin | duracion }}}</span>
              </span>
              <span class="valor">{{ item.detalle }}</span>
            </li>
          } @empty {
            <li class="vacio">
              <i class="ph ph-clock-counter-clockwise" aria-hidden="true"></i>
              Aún no registras actividad en este periodo.
            </li>
          }
        </ul>
      }
    </app-panel-card>
  `,
})
export class RecentActivity {
  readonly actividad = input<readonly ActividadReciente[]>([]);
  readonly cargando = input(false);

  protected readonly fecha = formatearFechaCorta;
}
