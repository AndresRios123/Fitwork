import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RecordPersonal } from '../../../core/models/dashboard.model';
import { PanelCard } from '../../../shared/ui/panel-card/panel-card';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { formatearCantidad, formatearFechaCorta } from '../../../shared/utils/formato';

@Component({
  selector: 'app-recent-records',
  imports: [PanelCard, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './lista-panel.scss',
  template: `
    <app-panel-card titulo="Récords recientes" ruta="/records" [attr.aria-busy]="cargando()">
      @if (cargando()) {
        <div class="cargando">
          @for (fila of [1, 2, 3]; track fila) { <app-skeleton alto="2.5rem" /> }
        </div>
      } @else {
        <ul role="list">
          @for (record of records(); track record.id) {
            <li>
              <span class="icono"><i class="ph ph-trophy" aria-hidden="true"></i></span>
              <span class="texto">
                <strong>{{ record.ejercicio }}</strong>
                <span>{{ fecha(record.fecha) }}</span>
              </span>
              <span class="valor">{{ numero(record.valor) }} {{ record.unidad }}</span>
            </li>
          } @empty {
            <li class="vacio">
              <i class="ph ph-trophy" aria-hidden="true"></i>
              Todavía no tienes récords. ¡El primero está cerca!
            </li>
          }
        </ul>
      }
    </app-panel-card>
  `,
})
export class RecentRecords {
  readonly records = input<readonly RecordPersonal[]>([]);
  readonly cargando = input(false);

  protected readonly fecha = formatearFechaCorta;
  protected readonly numero = formatearCantidad;
}
