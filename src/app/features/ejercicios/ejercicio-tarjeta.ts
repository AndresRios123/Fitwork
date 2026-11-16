import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Ejercicio } from './ejercicio';

@Component({
  selector: 'app-ejercicio-tarjeta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cabecera">
      <span class="icono"><i class="ph ph-barbell" aria-hidden="true"></i></span>
      <span class="grupo">{{ ejercicio().grupo }}</span>
    </div>
    <h2>{{ ejercicio().nombre }}</h2>
    <p>{{ ejercicio().descripcion }}</p>
    <footer>{{ ejercicio().equipo }}</footer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 1.125rem;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }

    .cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .5rem;
      margin-bottom: .875rem;
    }

    .icono {
      display: grid;
      width: 2.5rem;
      height: 2.5rem;
      place-items: center;
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--color-primary) 15%, var(--color-surface));
      color: var(--gray-900);
      font-size: 1.25rem;
    }

    .grupo {
      border-radius: 999px;
      background: var(--gray-100);
      padding: .25rem .65rem;
      color: var(--gray-700);
      font-size: .75rem;
      font-weight: 700;
    }

    h2 {
      margin: 0 0 .375rem;
      font-size: var(--fs-base);
      line-height: 1.4;
    }

    p {
      margin: 0 0 1rem;
      color: var(--gray-700);
      font-size: var(--fs-sm);
      line-height: 1.55;
    }

    footer {
      margin-top: auto;
      padding-top: .75rem;
      border-top: 1px solid var(--gray-100);
      color: var(--gray-700);
      font-size: var(--fs-sm);
      font-weight: 700;
    }
  `,
})
export class EjercicioTarjeta {
  readonly ejercicio = input.required<Ejercicio>();
}
