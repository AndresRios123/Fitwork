import { Injectable } from '@angular/core';
import {
  ActividadReciente,
  Estadistica,
  Rango,
  Rendimiento,
  ResumenDashboard,
} from '../models/dashboard.model';
import { DashboardApi } from './dashboard-api';

// Backend SIMULADO del panel mientras no exista la API.
// Las fechas se calculan desde hoy para que los datos siempre se vean recientes.
//
// Para ver los otros estados en el navegador, en la consola:
//   localStorage.setItem('fitwork_dashboard_mock', 'vacio')  // o 'error'
//   localStorage.removeItem('fitwork_dashboard_mock')         // volver a normal
export const CLAVE_ESCENARIO_MOCK = 'fitwork_dashboard_mock';

const RETRASO_MS = 700;
const INDICE_ACTUAL = 112.4;

const ESTADISTICAS: Record<Rango, readonly Estadistica[]> = {
  '7d': [
    { tipo: 'entrenamientos', valor: 4, variacion: 33.3 },
    { tipo: 'volumen', valor: 9850, variacion: 12.4 },
    { tipo: 'cardio', valor: 95, variacion: 8 },
    { tipo: 'records', valor: 1, variacion: 0 },
  ],
  '30d': [
    { tipo: 'entrenamientos', valor: 18, variacion: 12.5 },
    { tipo: 'volumen', valor: 42380, variacion: 8.7 },
    { tipo: 'cardio', valor: 420, variacion: -4.2 },
    { tipo: 'records', valor: 5, variacion: 25 },
  ],
  '3m': [
    { tipo: 'entrenamientos', valor: 49, variacion: 6.5 },
    { tipo: 'volumen', valor: 118640, variacion: 10.2 },
    { tipo: 'cardio', valor: 1260, variacion: 3.1 },
    { tipo: 'records', valor: 12, variacion: 20 },
  ],
  '1a': [
    { tipo: 'entrenamientos', valor: 186, variacion: 18.3 },
    { tipo: 'volumen', valor: 452300, variacion: 22.6 },
    { tipo: 'cardio', valor: 4980, variacion: 9.4 },
    { tipo: 'records', valor: 37, variacion: 15.6 },
  ],
};

// Cuántos puntos tiene el gráfico, cada cuántos días y cuánto subió el índice.
const RENDIMIENTO: Record<Rango, { puntos: number; pasoDias: number; variacion: number }> = {
  '7d': { puntos: 7, pasoDias: 1, variacion: 2.1 },
  '30d': { puntos: 30, pasoDias: 1, variacion: 5.3 },
  '3m': { puntos: 13, pasoDias: 7, variacion: 9.8 },
  '1a': { puntos: 12, pasoDias: 30, variacion: 17.4 },
};

@Injectable()
export class MockDashboardApi extends DashboardApi {
  async obtenerResumen(rango: Rango, cancelar?: AbortSignal): Promise<ResumenDashboard> {
    await esperar(RETRASO_MS, cancelar);
    const escenario = leerEscenario();
    if (escenario === 'error') {
      throw new Error('No se pudo cargar el resumen del panel.');
    }
    if (escenario === 'vacio') {
      return {
        estadisticas: ESTADISTICAS[rango].map(({ tipo }) => ({ tipo, valor: 0, variacion: null })),
        entrenamientoHoy: null,
        actividad: [],
        records: [],
        objetivos: [],
      };
    }

    return {
      estadisticas: ESTADISTICAS[rango],
      entrenamientoHoy: {
        rutinaId: null,
        nombre: 'Tren superior',
        enfoque: 'Fuerza · Hipertrofia',
        duracionMin: 55,
        ejercicios: [
          { nombre: 'Press de banca', series: 4, repeticiones: 10 },
          { nombre: 'Remo con mancuerna', series: 4, repeticiones: 10 },
          { nombre: 'Press militar', series: 3, repeticiones: 12 },
          { nombre: 'Dominadas', series: 3, repeticiones: 8 },
        ],
      },
      actividad: actividadReciente(),
      records: [
        { id: 'r1', ejercicio: 'Peso muerto', valor: 140, unidad: 'kg', fecha: haceDias(3) },
        { id: 'r2', ejercicio: 'Sentadilla', valor: 115, unidad: 'kg', fecha: haceDias(9) },
        { id: 'r3', ejercicio: 'Press de banca', valor: 85, unidad: 'kg', fecha: haceDias(16) },
      ],
      objetivos: [
        { id: 'o1', titulo: 'Entrenar 20 veces este mes', actual: 18, meta: 20, unidad: 'sesiones' },
        { id: 'o2', titulo: 'Correr 50 km', actual: 32, meta: 50, unidad: 'km' },
        { id: 'o3', titulo: 'Sentadilla de 120 kg', actual: 115, meta: 120, unidad: 'kg' },
      ],
    };
  }

  async obtenerRendimiento(rango: Rango, cancelar?: AbortSignal): Promise<Rendimiento> {
    await esperar(RETRASO_MS, cancelar);
    const escenario = leerEscenario();
    if (escenario === 'error') {
      throw new Error('No se pudo cargar el rendimiento.');
    }

    const { puntos, pasoDias, variacion } = RENDIMIENTO[rango];
    if (escenario === 'vacio') {
      return { indice: 100, variacion: null, puntos: [], mejoras: [] };
    }

    // Índice que sube poco a poco hasta INDICE_ACTUAL, sin bajar nunca
    // (el índice real solo sube cuando superas una marca).
    const inicio = INDICE_ACTUAL / (1 + variacion / 100);
    let anterior = inicio;
    const lista = Array.from({ length: puntos }, (_, i) => {
      const avance = i / (puntos - 1);
      const escalon = i === puntos - 1 ? 0 : Math.max(0, Math.sin(i * 1.3)) * 0.6;
      anterior = Math.max(anterior, inicio + (INDICE_ACTUAL - inicio) * avance - escalon);
      return { fecha: haceDias((puntos - 1 - i) * pasoDias), valor: Math.round(anterior * 10) / 10 };
    });
    return {
      indice: INDICE_ACTUAL,
      variacion,
      puntos: lista,
      mejoras: [
        { ejercicioId: 'press-banca', ejercicio: 'Press de banca', variacion: redondear(variacion * 1.6) },
        { ejercicioId: 'sentadilla-barra', ejercicio: 'Sentadilla con barra', variacion: redondear(variacion * 0.9) },
      ],
    };
  }
}

function actividadReciente(): ActividadReciente[] {
  return [
    { id: 'a1', tipo: 'fuerza', titulo: 'Tren inferior', fecha: haceDias(1), duracionMin: 62, detalle: '8.420 kg' },
    { id: 'a2', tipo: 'cardio', titulo: 'Carrera continua', fecha: haceDias(2), duracionMin: 34, detalle: '5,2 km' },
    { id: 'a3', tipo: 'fuerza', titulo: 'Tren superior', fecha: haceDias(4), duracionMin: 55, detalle: '6.150 kg' },
    { id: 'a4', tipo: 'cardio', titulo: 'Bicicleta', fecha: haceDias(5), duracionMin: 45, detalle: '18 km' },
  ];
}

function leerEscenario(): string | null {
  try {
    return localStorage.getItem(CLAVE_ESCENARIO_MOCK);
  } catch {
    return null;
  }
}

/** Fecha local (no UTC) de hace `dias` días, en formato AAAA-MM-DD. */
function haceDias(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function redondear(valor: number): number {
  return Math.round(valor * 10) / 10;
}

function esperar(ms: number, cancelar?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (cancelar?.aborted) {
      reject(cancelar.reason);
      return;
    }
    const id = setTimeout(resolve, ms);
    cancelar?.addEventListener('abort', () => {
      clearTimeout(id);
      reject(cancelar.reason);
    }, { once: true });
  });
}
