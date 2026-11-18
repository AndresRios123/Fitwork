import { signal } from '@angular/core';
import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/services/auth.service';
import { ActividadCardio } from './actividad-cardio';
import { Cardio } from './cardio';
import { evolucionCardio, resumirCardio } from './cardio-resumen';
import { CardioService } from './cardio.service';

describe('Cardio', () => {
  const usuario = signal<{ id: string } | null>({ id: 'ana-cardio' });
  const claves = ['fitwork_cardio:ana-cardio', 'fitwork_cardio:beto-cardio'];

  function configurar() {
    TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [{ provide: AuthService, useValue: { currentUser: usuario } }],
    });
  }

  beforeEach(() => {
    usuario.set({ id: 'ana-cardio' });
    claves.forEach(clave => localStorage.removeItem(clave));
    configurar();
  });

  afterEach(() => {
    claves.forEach(clave => localStorage.removeItem(clave));
    vi.restoreAllMocks();
  });

  it('suma los registros por fecha y distingue las actividades que tienen distancia', () => {
    const actividades: ActividadCardio[] = [
      { id: 'a', tipo: 'Correr', fecha: '2026-01-02', duracionMin: 30, distanciaKm: 5 },
      { id: 'b', tipo: 'Correr', fecha: '2026-01-02', duracionMin: 15, distanciaKm: 2 },
      { id: 'c', tipo: 'Caminar', fecha: '2026-01-01', duracionMin: 20, distanciaKm: null },
    ];
    expect(resumirCardio(actividades)).toEqual({ cantidad: 3, minutos: 65, distancia: 7, conDistancia: 2 });
    expect(evolucionCardio(actividades, 'duracionMin')).toEqual([
      { fecha: '2026-01-01', valor: 20 }, { fecha: '2026-01-02', valor: 45 },
    ]);
    expect(evolucionCardio(actividades, 'distanciaKm')).toEqual([{ fecha: '2026-01-02', valor: 7 }]);
  });

  it('valida, registra, edita, filtra y elimina actividades, y recupera los datos por cuenta', async () => {
    const fixture = TestBed.createComponent(Cardio);
    await fixture.whenStable();
    const pagina: HTMLElement = fixture.nativeElement;
    const servicio = TestBed.inject(CardioService);

    function boton(texto: string, raiz: ParentNode = pagina): HTMLButtonElement {
      const encontrado = Array.from(raiz.querySelectorAll('button'))
        .find(elemento => elemento.textContent.trim() === texto);
      if (!encontrado) {
        throw new Error('No se encontró el botón ' + texto);
      }
      return encontrado;
    }

    async function cambiar(selector: string, valor: string, evento = 'input') {
      const campo = pagina.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
      campo.value = valor;
      campo.dispatchEvent(new Event(evento, { bubbles: true }));
      await fixture.whenStable();
    }

    async function guardar() {
      pagina.querySelector('form.editor')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await fixture.whenStable();
    }

    boton('Registrar actividad').click();
    await fixture.whenStable();
    await cambiar('.editor [formControlName="tipo"]', 'Correr', 'change');
    await cambiar('.editor [formControlName="fecha"]', '2026-01-01');
    await cambiar('.editor [formControlName="duracionMin"]', '-1');
    await guardar();
    expect(servicio.actividades()).toHaveLength(0);
    expect(pagina.textContent).toContain('duración mayor que cero');

    await cambiar('.editor [formControlName="duracionMin"]', '30');
    await cambiar('.editor [formControlName="distanciaKm"]', '5');
    await guardar();
    expect(pagina.textContent).toContain('Actividad registrada.');
    expect(pagina.querySelector('.historial')?.textContent).toContain('Velocidad media 10 km/h');

    boton('Editar').click();
    await fixture.whenStable();
    await cambiar('.editor [formControlName="duracionMin"]', '25');
    await guardar();
    expect(servicio.actividades()).toHaveLength(1);
    expect(servicio.actividades()[0].duracionMin).toBe(25);

    boton('Registrar actividad').click();
    await fixture.whenStable();
    await cambiar('.editor [formControlName="fecha"]', '2026-01-02');
    await cambiar('.editor [formControlName="duracionMin"]', '20');
    await guardar();
    expect(servicio.actividades()).toHaveLength(2);
    expect(servicio.actividades()[0].distanciaKm).toBeNull();

    await cambiar('.filtros [formControlName="tipo"]', 'Correr', 'change');
    expect(pagina.querySelectorAll('.historial > li')).toHaveLength(1);
    expect(pagina.querySelector('.metricas')?.textContent).toContain('25 min');
    await cambiar('.filtros [formControlName="desde"]', '2026-01-02');
    expect(pagina.querySelector('.historial')?.textContent).toContain('No hay actividades');
    await cambiar('.filtros [formControlName="hasta"]', '2026-01-01');
    expect(pagina.textContent).toContain('La fecha inicial debe ser anterior');
    expect(pagina.querySelector('.metricas')).toBeNull();

    boton('Limpiar filtros').click();
    await fixture.whenStable();
    const item = pagina.querySelector('.historial li')!;
    boton('Eliminar', item).click();
    await fixture.whenStable();
    boton('Conservar', item).click();
    await fixture.whenStable();
    expect(servicio.actividades()).toHaveLength(2);
    boton('Eliminar', item).click();
    await fixture.whenStable();
    boton('Confirmar eliminación', item).click();
    await fixture.whenStable();
    expect(servicio.actividades()).toHaveLength(1);
    expect(servicio.actividades()[0].tipo).toBe('Correr');

    boton('Editar').click();
    await fixture.whenStable();
    usuario.set({ id: 'beto-cardio' });
    await fixture.whenStable();
    expect(pagina.querySelector('.editor')).toBeNull();
    expect(servicio.actividades()).toHaveLength(0);
    expect(pagina.querySelector('.historial')?.textContent).toContain('No hay actividades');

    usuario.set({ id: 'ana-cardio' });
    await fixture.whenStable();
    expect(servicio.actividades()).toHaveLength(1);
    fixture.destroy();
    TestBed.resetTestingModule();
    configurar();
    const recarga = TestBed.createComponent(Cardio);
    await recarga.whenStable();
    expect(TestBed.inject(CardioService).actividades()[0]).toMatchObject({
      tipo: 'Correr', duracionMin: 25, distanciaKm: 5, fecha: '2026-01-01',
    });
  });

  it('conserva los datos si falla el guardado y bloquea datos dañados', async () => {
    const fixture = TestBed.createComponent(Cardio);
    await fixture.whenStable();
    const servicio = TestBed.inject(CardioService);
    const actividad = { tipo: 'Correr' as const, fecha: '2026-01-01', duracionMin: 30, distanciaKm: 5 };
    const guardar = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Sin espacio'); });
    expect(() => servicio.guardar(actividad)).toThrow('Sin espacio');
    expect(servicio.actividades()).toEqual([]);
    guardar.mockRestore();

    localStorage.setItem('fitwork_cardio:beto-cardio', '{dato roto');
    usuario.set({ id: 'beto-cardio' });
    await fixture.whenStable();
    expect(servicio.estado()).toBe('error');
    expect(fixture.nativeElement.textContent).toContain('No se pudo leer');
    expect(() => servicio.guardar(actividad)).toThrow();
    expect(localStorage.getItem('fitwork_cardio:beto-cardio')).toBe('{dato roto');
  });
});
