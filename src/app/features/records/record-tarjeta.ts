import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RecordEjercicio } from './records-calculo';

@Component({
  selector: 'app-record-tarjeta',
  imports: [DatePipe, DecimalPipe],
  template: `
    <article>
      <h2><i class="ph ph-trophy" aria-hidden="true"></i> {{ record().nombre }}</h2>
      <section aria-label="Mayor peso registrado">
        <h3>Mayor peso registrado</h3>
        @if (record().mayorPeso; as marca) {
          <p class="valor">{{ marca.pesoKg | number:'1.0-2' }} <span>kg</span></p>
          <p>{{ marca.repeticiones | number }} repeticiones en esa serie</p>
          <p class="fecha"><time [attr.datetime]="marca.fecha">{{ marca.fecha | date:'dd/MM/yyyy' }}</time> · {{ marca.rutina }}</p>
        } @else {
          <p>Agrega peso a una serie en Entrenamientos para registrar esta marca.</p>
        }
      </section>
      <section aria-label="Más repeticiones en una serie">
        <h3>Más repeticiones en una serie</h3>
        @let marca = record().masRepeticiones;
        <p class="valor">{{ marca.repeticiones | number }} <span>reps</span></p>
        @if (marca.pesoKg !== null) {
          <p>Con {{ marca.pesoKg | number:'1.0-2' }} kg registrados</p>
        } @else {
          <p>Peso sin registrar</p>
        }
        <p class="fecha"><time [attr.datetime]="marca.fecha">{{ marca.fecha | date:'dd/MM/yyyy' }}</time> · {{ marca.rutina }}</p>
      </section>
    </article>
  `,
  styles: `
    :host { display: block; height: 100%; }
    article {
      height: 100%;
      padding: 1rem;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    h2 { margin: 0; font-size: var(--fs-lg); }
    h2 i { color: var(--color-primary); margin-right: .25rem; }
    section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-100); }
    h3 { margin: 0; font-size: var(--fs-sm); color: var(--gray-700); }
    p { margin: .375rem 0 0; color: var(--gray-700); font-size: var(--fs-sm); overflow-wrap: anywhere; }
    .valor { font-size: var(--fs-xl); font-weight: 800; color: var(--gray-900); }
    .valor span { font-size: var(--fs-sm); font-weight: 600; }
    .fecha { margin-top: .625rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordTarjeta {
  readonly record = input.required<RecordEjercicio>();
}
