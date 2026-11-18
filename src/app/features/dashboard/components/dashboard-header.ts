import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { Rango, RANGOS } from '../../../core/models/dashboard.model';

/** Saludo según la hora local: 5-11 días, 12-18 tardes, resto noches. */
export function saludoPara(fecha: Date): string {
  const hora = fecha.getHours();
  if (hora >= 5 && hora < 12) {
    return 'Buenos días';
  }
  return hora >= 12 && hora < 19 ? 'Buenas tardes' : 'Buenas noches';
}

@Component({
  selector: 'app-dashboard-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <div>
        <h1>{{ saludo() }}{{ nombre() ? ', ' + nombre() : '' }}</h1>
        <p>Este es el resumen de tu actividad.</p>
      </div>
      <label>
        <i class="ph ph-calendar-blank" aria-hidden="true"></i>
        <span class="visualmente-oculto">Periodo</span>
        <!-- model(): [(rango)] en el padre. set() avisa al padre del cambio. -->
        <select [value]="rango()" (change)="cambiar($event)">
          @for (opcion of rangos; track opcion.valor) {
            <option [value]="opcion.valor" [selected]="opcion.valor === rango()">{{ opcion.etiqueta }}</option>
          }
        </select>
      </label>
    </header>
  `,
  styles: `
    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    h1 {
      margin: 0 0 .25rem;
      font-size: clamp(1.5rem, 2.5vw, 2rem);
      line-height: 1.2;
    }

    p {
      margin: 0;
      color: var(--gray-500);
    }

    label {
      position: relative;
      display: flex;
      align-items: center;
    }

    label i {
      position: absolute;
      left: .75rem;
      color: var(--gray-500);
      pointer-events: none;
    }

    select {
      min-height: 2.75rem;
      padding: .5rem .75rem .5rem 2.25rem;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--gray-900);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }

    select:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .visualmente-oculto {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
})
export class DashboardHeader {
  readonly nombre = input('');
  readonly ahora = input.required<Date>();
  readonly rango = model.required<Rango>();

  protected readonly rangos = RANGOS;
  protected readonly saludo = computed(() => saludoPara(this.ahora()));

  protected cambiar(evento: Event): void {
    this.rango.set((evento.target as HTMLSelectElement).value as Rango);
  }
}
