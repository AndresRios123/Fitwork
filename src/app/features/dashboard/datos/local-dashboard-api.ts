import { computed, inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { Rango, Rendimiento, ResumenDashboard } from '../../../core/models/dashboard.model';
import { DashboardApi } from '../../../core/services/dashboard-api';
import { CardioService } from '../../cardio/cardio.service';
import { fechaLocalHoy } from '../../cardio/actividad-cardio';
import { RutinasService } from '../../entrenamientos/rutinas.service';
import { SesionesService } from '../../entrenamientos/sesiones.service';
import { ObjetivosService } from '../../objetivos/objetivos.service';
import { calcularRendimiento, calcularResumen, DatosUsuario } from './dashboard-calculo';

// Fuente de datos REAL del panel: lo que el usuario guardó en Entrenamientos,
// Cardio y Objetivos (localStorage, separado por cuenta).
// Cumple el mismo contrato que tendrá la API: cuando exista el backend se
// registra HttpDashboardApi en app.config.ts y el panel no cambia.
@Injectable()
export class LocalDashboardApi extends DashboardApi {
  private readonly sesiones = inject(SesionesService);
  private readonly rutinas = inject(RutinasService);
  private readonly cardio = inject(CardioService);
  private readonly objetivos = inject(ObjetivosService);

  private readonly estados = computed(() => [
    this.sesiones.estado(),
    this.rutinas.estado(),
    this.cardio.estado(),
    this.objetivos.estado(),
  ]);

  // Los datos se leen después del primer render (en el navegador). Hasta
  // entonces el estado es "cargando"; esperamos a que deje de serlo.
  private readonly listos$ = toObservable(this.estados).pipe(filter(estados => !estados.includes('cargando')));

  async obtenerResumen(rango: Rango, cancelar?: AbortSignal): Promise<ResumenDashboard> {
    const datos = await this.leer(cancelar);
    return calcularResumen(datos, rango, fechaLocalHoy());
  }

  async obtenerRendimiento(rango: Rango, cancelar?: AbortSignal): Promise<Rendimiento> {
    const { sesiones } = await this.leer(cancelar);
    return calcularRendimiento(sesiones, rango, fechaLocalHoy());
  }

  private async leer(cancelar?: AbortSignal): Promise<DatosUsuario> {
    const estados = await firstValueFrom(this.listos$);
    cancelar?.throwIfAborted();
    if (estados.includes('error')) {
      throw new Error('No se pudieron leer tus datos guardados.');
    }
    return {
      sesiones: this.sesiones.sesiones(),
      rutinas: this.rutinas.rutinas(),
      cardio: this.cardio.actividades(),
      objetivos: this.objetivos.objetivos(),
    };
  }
}
