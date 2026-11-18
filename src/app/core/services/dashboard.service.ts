import { inject, Injectable } from '@angular/core';
import { Rango, Rendimiento, ResumenDashboard } from '../models/dashboard.model';
import { DashboardApi } from './dashboard-api';

// Punto único por el que el panel pide sus datos. No sabe si vienen
// del mock o de un servidor: eso lo decide el proveedor de DashboardApi.
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(DashboardApi);

  obtenerResumen(rango: Rango, cancelar?: AbortSignal): Promise<ResumenDashboard> {
    return this.api.obtenerResumen(rango, cancelar);
  }

  obtenerRendimiento(rango: Rango, cancelar?: AbortSignal): Promise<Rendimiento> {
    return this.api.obtenerRendimiento(rango, cancelar);
  }
}
