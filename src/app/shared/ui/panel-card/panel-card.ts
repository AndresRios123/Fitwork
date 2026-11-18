import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

// Molécula: tarjeta con título, enlace "Ver todo" y contenido proyectado.
@Component({
  selector: 'app-panel-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [attr.aria-labelledby]="idTitulo">
      <header>
        <h2 [id]="idTitulo">{{ titulo() }}</h2>
        @if (ruta()) {
          <a [routerLink]="ruta()">
            {{ textoEnlace() }} <i class="ph ph-arrow-right" aria-hidden="true"></i>
          </a>
        }
      </header>
      <ng-content />
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
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    h2 {
      margin: 0;
      font-size: var(--fs-base);
      font-weight: 800;
    }

    a {
      display: inline-flex;
      align-items: center;
      gap: .25rem;
      flex-shrink: 0;
      color: var(--color-primary);
      font-size: var(--fs-sm);
      font-weight: 700;
      text-decoration: none;
    }

    a:hover { text-decoration: underline; }

    a:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
      border-radius: var(--radius-sm);
    }
  `,
})
export class PanelCard {
  private static siguienteId = 0;

  readonly titulo = input.required<string>();
  readonly ruta = input<string | null>(null);
  readonly textoEnlace = input('Ver todo');

  protected readonly idTitulo = `panel-card-${PanelCard.siguienteId++}`;
}
