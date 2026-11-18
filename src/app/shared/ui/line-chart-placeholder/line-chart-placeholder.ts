import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatearFechaCorta, formatearNumero } from '../../utils/formato';

export interface PuntoGrafico {
  readonly fecha: string;
  readonly valor: number;
}

const ANCHO = 600;
const ALTO = 220;
const MARGEN = 12;

// PROVISIONAL: gráfico de área en SVG mientras llega el `line-chart` de B.
// Recibe los mismos datos (`puntos`) para que el cambio sea solo de selector.
@Component({
  selector: 'app-line-chart-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (geometria(); as g) {
      <svg [attr.viewBox]="'0 0 ' + ancho + ' ' + alto" preserveAspectRatio="none"
           role="img" [attr.aria-label]="descripcion()">
        <defs>
          <linearGradient [id]="idRelleno" x1="0" x2="0" y1="0" y2="1">
            <stop class="inicio" offset="0%" />
            <stop class="fin" offset="100%" />
          </linearGradient>
        </defs>
        @for (y of g.guias; track $index) {
          <line class="guia" x1="0" [attr.x2]="ancho" [attr.y1]="y" [attr.y2]="y" />
        }
        <path [attr.d]="g.area" [attr.fill]="'url(#' + idRelleno + ')'" />
        <path class="linea" [attr.d]="g.linea" />
      </svg>
      <div class="eje" aria-hidden="true">
        @for (etiqueta of g.etiquetas; track $index) {
          <span>{{ etiqueta }}</span>
        }
      </div>
    } @else {
      <p class="sin-datos">Aún no hay datos suficientes para el gráfico.</p>
    }
  `,
  styles: `
    :host { display: block; }

    svg {
      display: block;
      width: 100%;
      height: 14rem;
      overflow: visible;
    }

    /* var() no funciona en atributos SVG, por eso el degradado va en CSS */
    stop { stop-color: var(--color-primary); }
    .inicio { stop-opacity: .35; }
    .fin { stop-opacity: 0; }

    .guia {
      stroke: var(--gray-100);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }

    .linea {
      fill: none;
      stroke: var(--color-primary);
      stroke-width: 3;
      stroke-linejoin: round;
      stroke-linecap: round;
      vector-effect: non-scaling-stroke;
    }

    .eje {
      display: flex;
      justify-content: space-between;
      margin-top: .5rem;
      color: var(--gray-500);
      font-size: .75rem;
    }

    .sin-datos {
      display: grid;
      place-items: center;
      min-height: 14rem;
      margin: 0;
      color: var(--gray-500);
      font-size: var(--fs-sm);
    }
  `,
})
export class LineChartPlaceholder {
  private static siguienteId = 0;

  readonly puntos = input.required<readonly PuntoGrafico[]>();

  protected readonly ancho = ANCHO;
  protected readonly alto = ALTO;
  protected readonly idRelleno = `relleno-grafico-${LineChartPlaceholder.siguienteId++}`;

  protected readonly geometria = computed(() => {
    const puntos = this.puntos();
    if (puntos.length < 2) {
      return null;
    }

    const valores = puntos.map(punto => punto.valor);
    // Holgura arriba y abajo para que la curva no toque los bordes.
    const holgura = (Math.max(...valores) - Math.min(...valores) || 1) * 0.25;
    const minimo = Math.min(...valores) - holgura;
    const rango = Math.max(...valores) + holgura - minimo;
    const coordenadas = puntos.map((punto, i) => [
      (i / (puntos.length - 1)) * ANCHO,
      MARGEN + (1 - (punto.valor - minimo) / rango) * (ALTO - MARGEN * 2),
    ]);

    const linea = coordenadas.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const medio = Math.floor((puntos.length - 1) / 2);

    return {
      linea,
      area: `${linea} L${ANCHO},${ALTO} L0,${ALTO} Z`,
      guias: [0.25, 0.5, 0.75].map(f => f * ALTO),
      etiquetas: [puntos[0], puntos[medio], puntos.at(-1)!].map(punto => formatearFechaCorta(punto.fecha)),
    };
  });

  protected readonly descripcion = computed(() => {
    const puntos = this.puntos();
    if (puntos.length < 2) {
      return '';
    }
    const primero = puntos[0];
    const ultimo = puntos.at(-1)!;
    return `Evolución del rendimiento: de ${formatearNumero(primero.valor, 1)} el ` +
      `${formatearFechaCorta(primero.fecha)} a ${formatearNumero(ultimo.valor, 1)} el ${formatearFechaCorta(ultimo.fecha)}.`;
  });
}
