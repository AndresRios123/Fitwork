import { Pipe, PipeTransform } from '@angular/core';
import { formatearDuracion } from '../utils/formato';

// Uso en plantillas: {{ 95 | duracion }} -> "1 h 35 min"
@Pipe({ name: 'duracion' })
export class DuracionPipe implements PipeTransform {
  transform(minutos: number | null | undefined): string {
    return minutos == null ? '' : formatearDuracion(minutos);
  }
}
