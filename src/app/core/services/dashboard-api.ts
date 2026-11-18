import { Rango, Rendimiento, ResumenDashboard } from '../models/dashboard.model';

// "Contrato" que debe cumplir cualquier fuente de datos del panel.
// Hoy lo cumple MockDashboardApi; con backend se crea HttpDashboardApi
// y solo se cambia una línea en app.config.ts.
export abstract class DashboardApi {
  abstract obtenerResumen(rango: Rango, cancelar?: AbortSignal): Promise<ResumenDashboard>;
  abstract obtenerRendimiento(rango: Rango, cancelar?: AbortSignal): Promise<Rendimiento>;
}
