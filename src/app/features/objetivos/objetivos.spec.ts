import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ActividadCardio } from '../cardio/actividad-cardio';
import { CardioService } from '../cardio/cardio.service';
import { SesionEntrenamiento } from '../entrenamientos/sesion';
import { SesionesService } from '../entrenamientos/sesiones.service';
import { Objetivo } from './objetivo';
import { Objetivos } from './objetivos';
import { evaluarObjetivo } from './objetivos-calculo';
import { ObjetivosService } from './objetivos.service';

const sesion = (fecha: string, pesoKg = 40): SesionEntrenamiento => ({
  id: fecha, fecha, rutinaId: 'rutina', nombreRutina: 'Pecho',
  ejercicios: [{ ejercicioId: 'press-banca', nombre: 'Press de banca', series: [{ repeticiones: 8, pesoKg }] }],
});

const base = { id: 'meta', nombre: 'Mi meta', inicio: '2026-01-01', fin: '2026-01-14', meta: 4 };

describe('Cálculos de objetivos', () => {
  it('cuenta las sesiones del periodo hasta hoy y calcula el promedio pendiente', () => {
    const objetivo: Objetivo = { ...base, tipo: 'sesiones' };
    const datos = ['2025-12-31', '2026-01-01', '2026-01-07', '2026-01-10', '2026-01-15'].map(fecha => sesion(fecha));
    const resultado = evaluarObjetivo(objetivo, datos, [], '2026-01-08');
    expect(resultado).toMatchObject({ actual: 2, restante: 2, estado: 'En curso', porcentaje: 50 });
    expect(resultado.sugerencia).toContain('2 sesiones por semana');
    expect(evaluarObjetivo(objetivo, datos, [], '2025-12-31').estado).toBe('Programado');
    expect(evaluarObjetivo(objetivo, datos, [], '2026-01-15')).toMatchObject({
      estado: 'Finalizado', actual: 3, restante: 1,
    });
    expect(evaluarObjetivo({ ...objetivo, meta: 2 }, datos, [], '2026-01-08')).toMatchObject({
      estado: 'Cumplido', porcentaje: 100,
    });
  });

  it('filtra distancia por actividad y calcula la marca de peso dentro del periodo', () => {
    const actividades: ActividadCardio[] = [
      { id: '1', tipo: 'Correr', fecha: '2026-01-01', duracionMin: 30, distanciaKm: 5 },
      { id: '2', tipo: 'Ciclismo', fecha: '2026-01-01', duracionMin: 30, distanciaKm: 20 },
      { id: '3', tipo: 'Correr', fecha: '2026-01-02', duracionMin: 10, distanciaKm: null },
      { id: '4', tipo: 'Correr', fecha: '2026-01-15', duracionMin: 30, distanciaKm: 5 },
    ];
    expect(evaluarObjetivo({ ...base, tipo: 'distancia', actividad: 'Correr', meta: 20 }, [], actividades, '2026-01-14'))
      .toMatchObject({ actual: 5, restante: 15, estado: 'En curso' });
    expect(evaluarObjetivo({ ...base, tipo: 'peso', ejercicioId: 'press-banca', meta: 50 }, [
      sesion('2025-12-30', 60), sesion('2026-01-02', 45), sesion('2026-01-03', 40),
    ], [], '2026-01-08')).toMatchObject({ actual: 45, restante: 5 });
  });
});

describe('Objetivos por cuenta', () => {
  const usuario = signal<{ id: string } | null>({ id: 'ana-metas' });
  const claves = ['fitwork_objetivos:ana-metas', 'fitwork_objetivos:beto-metas',
    'fitwork_sesiones:ana-metas', 'fitwork_cardio:ana-metas'];

  function configurar() {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { currentUser: usuario } }],
    });
  }

  beforeEach(() => {
    usuario.set({ id: 'ana-metas' });
    claves.forEach(clave => localStorage.removeItem(clave));
    configurar();
  });
  afterEach(() => claves.forEach(clave => localStorage.removeItem(clave)));

  it('crea, actualiza y elimina una meta, con avance automático y persistencia por cuenta', async () => {
    const fixture = TestBed.createComponent(Objetivos);
    await fixture.whenStable();
    const pagina: HTMLElement = fixture.nativeElement;

    function boton(texto: string): HTMLButtonElement {
      const encontrado = [...pagina.querySelectorAll('button')].find(item => item.textContent.trim() === texto);
      if (!encontrado) { throw new Error('Falta el botón ' + texto); }
      return encontrado;
    }
    async function cambiar(nombre: string, valor: string, evento = 'input') {
      const campo = pagina.querySelector<HTMLInputElement | HTMLSelectElement>(`[formControlName="${nombre}"]`)!;
      campo.value = valor;
      campo.dispatchEvent(new Event(evento, { bubbles: true }));
      await fixture.whenStable();
    }
    async function guardar() {
      pagina.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await fixture.whenStable();
    }

    boton('Crear objetivo').click();
    await fixture.whenStable();
    await guardar();
    expect(pagina.textContent).toContain('Completa el nombre');
    expect(TestBed.inject(ObjetivosService).objetivos()).toHaveLength(0);

    await cambiar('nombre', 'Completar dos sesiones');
    await cambiar('inicio', '2026-01-01');
    await cambiar('fin', '2099-01-01');
    await cambiar('meta', '2.5');
    await guardar();
    expect(TestBed.inject(ObjetivosService).objetivos()).toHaveLength(0);
    await cambiar('meta', '2');
    await guardar();
    expect(pagina.querySelector('progress')?.value).toBe(0);

    TestBed.inject(SesionesService).registrar(sesion('2026-01-02'));
    await fixture.whenStable();
    expect(pagina.querySelector('progress')?.value).toBe(50);
    expect(pagina.textContent).toContain('Te faltan 1 sesión');

    boton('Editar').click();
    await fixture.whenStable();
    await cambiar('meta', '1');
    await guardar();
    expect(pagina.textContent).toContain('Cumplido');

    usuario.set({ id: 'beto-metas' });
    await fixture.whenStable();
    expect(pagina.querySelector('progress')).toBeNull();
    expect(pagina.textContent).not.toContain('Completar dos sesiones');
    usuario.set({ id: 'ana-metas' });
    await fixture.whenStable();
    expect(pagina.querySelector('progress')?.value).toBe(100);

    fixture.destroy();
    TestBed.resetTestingModule();
    configurar();
    const recarga = TestBed.createComponent(Objetivos);
    await recarga.whenStable();
    const recargada: HTMLElement = recarga.nativeElement;
    expect(recargada.querySelector('progress')?.value).toBe(100);
    const botones = () => [...recargada.querySelectorAll('button')];
    botones().find(item => item.textContent.trim() === 'Eliminar')!.click();
    await recarga.whenStable();
    botones().find(item => item.textContent.trim() === 'Confirmar eliminación')!.click();
    await recarga.whenStable();
    expect(TestBed.inject(ObjetivosService).objetivos()).toHaveLength(0);
  });

  it('actualiza las metas de cardio y peso y muestra los fallos de lectura', async () => {
    const fixture = TestBed.createComponent(Objetivos);
    await fixture.whenStable();
    const servicio = TestBed.inject(ObjetivosService);
    servicio.guardar({ ...base, id: 'km', tipo: 'distancia', actividad: 'Correr', meta: 10 });
    TestBed.inject(CardioService).guardar({ tipo: 'Correr', fecha: '2026-01-02', distanciaKm: 5, duracionMin: 30 });
    await fixture.whenStable();
    const pagina: HTMLElement = fixture.nativeElement;
    expect(pagina.querySelector('progress')?.value).toBe(50);

    servicio.guardar({ ...base, id: 'peso', tipo: 'peso', ejercicioId: 'press-banca', meta: 50 });
    TestBed.inject(SesionesService).registrar(sesion('2026-01-02', 50));
    await fixture.whenStable();
    expect([...pagina.querySelectorAll('progress')].map(progreso => progreso.value)).toContain(100);

    localStorage.setItem('fitwork_objetivos:beto-metas', '{roto');
    usuario.set({ id: 'beto-metas' });
    await fixture.whenStable();
    expect(pagina.textContent).toContain('No se pudieron leer tus objetivos');
    expect(pagina.querySelector('progress')).toBeNull();
  });
});
