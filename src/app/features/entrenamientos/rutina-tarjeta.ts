import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { catalogo } from '../ejercicios/catalogo';
import { Rutina } from './rutina';

@Component({
  selector: 'app-rutina-tarjeta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article>
      <header>
        <h2>{{ rutina().nombre }}</h2>
        <button type="button" [attr.aria-label]="'Editar ' + rutina().nombre" (click)="editar.emit(rutina().id)">
          <i class="ph ph-pencil-simple" aria-hidden="true"></i> Editar
        </button>
      </header>
      <ul role="list">
        @for (ejercicio of rutina().ejercicios; track ejercicio.ejercicioId) {
          <li>
            <span>{{ nombres.get(ejercicio.ejercicioId) ?? 'Ejercicio no disponible' }}</span>
            <span>{{ ejercicio.series }} × {{ ejercicio.repeticiones }}</span>
          </li>
        }
      </ul>
    </article>
  `,
  styles: `
    article {
      padding: 1rem;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }

    header, li {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
    }

    h2 {
      margin: 0;
      overflow-wrap: anywhere;
      font-size: var(--fs-lg);
    }

    button {
      flex-shrink: 0;
      min-height: 2.5rem;
      padding: .375rem .75rem;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--gray-900);
      cursor: pointer;
      font: inherit;
    }

    button:hover {
      border-color: var(--color-primary);
    }

    button:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    ul {
      margin: .75rem 0 0;
      padding: 0;
      list-style: none;
    }

    li {
      padding: .5rem 0;
      border-top: 1px solid var(--gray-100);
      color: var(--gray-700);
      font-size: var(--fs-sm);
    }

    li span:last-child {
      flex-shrink: 0;
      font-weight: 700;
    }
  `,
})
export class RutinaTarjeta {
  readonly rutina = input.required<Rutina>();
  readonly editar = output<string>();

  protected readonly nombres = new Map(catalogo.map(ejercicio => [ejercicio.id, ejercicio.nombre]));
}
