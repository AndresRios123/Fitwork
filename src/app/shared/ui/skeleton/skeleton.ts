import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Átomo: bloque gris animado que ocupa el lugar del contenido mientras carga.
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width]': 'ancho()',
    '[style.height]': 'alto()',
    '[style.border-radius]': 'redondeo()',
  },
  template: '',
  styles: `
    :host {
      display: block;
      background: linear-gradient(90deg, var(--gray-100) 25%, #e9eaee 37%, var(--gray-100) 63%);
      background-size: 400% 100%;
      animation: brillo 1.4s ease infinite;
    }

    @keyframes brillo {
      from { background-position: 100% 50%; }
      to { background-position: 0 50%; }
    }

    @media (prefers-reduced-motion: reduce) {
      :host { animation: none; }
    }
  `,
})
export class Skeleton {
  readonly ancho = input('100%');
  readonly alto = input('1rem');
  readonly redondeo = input('var(--radius-sm)');
}
