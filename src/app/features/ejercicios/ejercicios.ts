import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { catalogo } from './catalogo';
import { equipos, gruposMusculares } from './ejercicio';
import { EjercicioTarjeta } from './ejercicio-tarjeta';

@Component({
  imports: [ReactiveFormsModule, EjercicioTarjeta],
  selector: 'app-ejercicios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './ejercicios.scss',
  templateUrl: './ejercicios.html',
})
export class Ejercicios {
  protected readonly grupos = gruposMusculares;
  protected readonly equipos = equipos;
  protected readonly filtros = inject(NonNullableFormBuilder).group({
    busqueda: '',
    grupo: '',
    equipo: '',
  });

  private readonly valores = toSignal(this.filtros.valueChanges, {
    initialValue: this.filtros.getRawValue(),
  });

  protected readonly hayFiltros = computed(() => {
    const { busqueda, grupo, equipo } = this.valores();
    return Boolean(busqueda || grupo || equipo);
  });

  protected readonly resultados = computed(() => {
    const { busqueda = '', grupo, equipo } = this.valores();
    const consulta = normalizar(busqueda.trim());

    return catalogo.filter(ejercicio =>
      normalizar(ejercicio.nombre).includes(consulta) &&
      (!grupo || ejercicio.grupo === grupo) &&
      (!equipo || ejercicio.equipo === equipo),
    );
  });
}

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}
