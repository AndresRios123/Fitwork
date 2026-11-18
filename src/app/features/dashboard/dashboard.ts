import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  linkedSignal,
  resource,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Rango } from '../../core/models/dashboard.model';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardHeader } from './components/dashboard-header';
import { GoalsSummary } from './components/goals-summary';
import { PerformanceChart } from './components/performance-chart';
import { RecentActivity } from './components/recent-activity';
import { RecentRecords } from './components/recent-records';
import { StatsRow } from './components/stats-row';
import { TodayWorkout } from './components/today-workout';

// Contenedor (smart) del panel: es el ÚNICO que inyecta servicios.
// Los hijos solo reciben datos por input() y avisan por output()/model().
@Component({
  selector: 'app-dashboard',
  imports: [DashboardHeader, StatsRow, PerformanceChart, TodayWorkout, RecentActivity, RecentRecords, GoalsSummary],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly servicio = inject(DashboardService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Filtro de fechas del encabezado. */
  protected readonly rango = signal<Rango>('30d');

  /** Pestañas del gráfico: siguen al filtro, pero se pueden cambiar por separado. */
  protected readonly rangoGrafico = linkedSignal(() => this.rango());

  /** Hora actual para el saludo; se refresca cada minuto. */
  protected readonly ahora = signal(new Date());

  protected readonly nombre = computed(() => (this.auth.currentUser()?.nombre ?? '').trim().split(/\s+/)[0]);

  // resource(): vuelve a cargar solo cuando cambia "params" y cancela
  // la petición anterior si el usuario cambia de rango antes de que termine.
  protected readonly resumen = resource({
    params: () => this.rango(),
    loader: ({ params, abortSignal }) => this.servicio.obtenerResumen(params, abortSignal),
  });

  protected readonly rendimiento = resource({
    params: () => this.rangoGrafico(),
    loader: ({ params, abortSignal }) => this.servicio.obtenerRendimiento(params, abortSignal),
  });

  constructor() {
    const reloj = setInterval(() => this.ahora.set(new Date()), 60_000);
    // Limpieza al destruir el componente (equivale a ngOnDestroy).
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));
  }

  /** Abre Entrenamientos con la rutina lista para registrar (?rutina=id). */
  protected comenzarEntrenamiento(rutinaId: string | null): void {
    this.router.navigate(['/entrenamientos'], rutinaId ? { queryParams: { rutina: rutinaId } } : {});
  }
}
