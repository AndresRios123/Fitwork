import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SesionesService } from '../entrenamientos/sesiones.service';
import { calcularRecords } from './records-calculo';
import { RecordTarjeta } from './record-tarjeta';

@Component({
  imports: [ReactiveFormsModule, RouterLink, RecordTarjeta],
  selector: 'app-records',
  styleUrl: './records.scss',
  templateUrl: './records.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Records {
  private readonly sesiones = inject(SesionesService);

  protected readonly estado = this.sesiones.estado;
  protected readonly busqueda = new FormControl('', { nonNullable: true });
  private readonly consulta = toSignal(this.busqueda.valueChanges, { initialValue: '' });

  protected readonly records = computed(() => calcularRecords(this.sesiones.sesiones()));
  protected readonly resultados = computed(() => {
    const consulta = normalizar(this.consulta().trim());
    return this.records().filter(record => normalizar(record.nombre).includes(consulta));
  });
}

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}
