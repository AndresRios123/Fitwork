import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Estadistica, TipoEstadistica } from '../../../core/models/dashboard.model';
import { StatCard } from '../../../shared/ui/stat-card/stat-card';
import { formatearDuracion, formatearNumero } from '../../../shared/utils/formato';

const TARJETAS: readonly { tipo: TipoEstadistica; etiqueta: string; icono: string; formato: (valor: number) => string }[] = [
  { tipo: 'entrenamientos', etiqueta: 'Entrenamientos', icono: 'ph-barbell', formato: valor => formatearNumero(valor) },
  { tipo: 'volumen', etiqueta: 'Volumen total', icono: 'ph-chart-bar', formato: valor => `${formatearNumero(valor)} kg` },
  { tipo: 'cardio', etiqueta: 'Tiempo de cardio', icono: 'ph-heartbeat', formato: formatearDuracion },
  { tipo: 'records', etiqueta: 'Récords personales', icono: 'ph-trophy', formato: valor => formatearNumero(valor) },
];

@Component({
  selector: 'app-stats-row',
  imports: [StatCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (tarjeta of tarjetas(); track tarjeta.tipo) {
      <app-stat-card
        [icono]="tarjeta.icono"
        [etiqueta]="tarjeta.etiqueta"
        [valor]="tarjeta.valor"
        [variacion]="tarjeta.variacion"
        [cargando]="cargando()"
      />
    }
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1.25rem;
    }

    @container dashboard (max-width: 56rem) {
      :host { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    @container dashboard (max-width: 26rem) {
      :host { grid-template-columns: minmax(0, 1fr); }
    }
  `,
})
export class StatsRow {
  readonly estadisticas = input<readonly Estadistica[]>([]);
  readonly cargando = input(false);

  // Siempre se muestran las 4 tarjetas en el mismo orden, aunque falte algún dato.
  protected readonly tarjetas = computed(() => TARJETAS.map(tarjeta => {
    const dato = this.estadisticas().find(estadistica => estadistica.tipo === tarjeta.tipo);
    return {
      ...tarjeta,
      valor: tarjeta.formato(dato?.valor ?? 0),
      variacion: dato?.variacion ?? null,
    };
  }));
}
