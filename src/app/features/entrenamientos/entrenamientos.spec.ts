import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/services/auth.service';
import { Entrenamientos } from './entrenamientos';

describe('Entrenamientos', () => {
  beforeEach(() => localStorage.removeItem('fitwork_rutinas:usuario-prueba'));
  afterEach(() => localStorage.removeItem('fitwork_rutinas:usuario-prueba'));

  it('valida, guarda y vuelve a abrir una rutina con ejercicios del catálogo', async () => {
    const fixture = crearEntrenamientos();
    await fixture.whenStable();
    const pagina: HTMLElement = fixture.nativeElement;

    const boton = (texto: string) => {
      const encontrado = Array.from(pagina.querySelectorAll('button'))
        .find(elemento => elemento.textContent.trim() === texto);
      if (!encontrado) {
        throw new Error('No se encontró el botón ' + texto);
      }
      return encontrado;
    };

    function cambiar(selector: string, valor: string, evento = 'input') {
      const campo = pagina.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
      campo.value = valor;
      campo.dispatchEvent(new Event(evento, { bubbles: true }));
    }

    function enviar() {
      pagina.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      return fixture.whenStable();
    }

    boton('Nueva rutina').click();
    await fixture.whenStable();
    await enviar();
    expect(pagina.textContent).toContain('Escribe un nombre');
    expect(localStorage.getItem('fitwork_rutinas:usuario-prueba')).toBeNull();

    cambiar('[formControlName="nombre"]', 'Tren superior');
    cambiar('select', 'press-banca', 'change');
    boton('Agregar ejercicio').click();
    await fixture.whenStable();

    cambiar('fieldset:nth-child(2) select', 'remo-mancuerna', 'change');
    cambiar('fieldset:nth-child(2) [formControlName="series"]', '2.5');
    await enviar();
    expect(pagina.textContent).toContain('enteras mayores que cero');

    cambiar('fieldset:nth-child(2) [formControlName="series"]', '4');
    await enviar();
    expect(pagina.textContent).toContain('Rutina creada.');
    expect(pagina.querySelector('app-rutina-tarjeta')?.textContent).toContain('Press de banca');

    boton('Editar').click();
    await fixture.whenStable();
    expect(pagina.querySelector<HTMLInputElement>('[formControlName="nombre"]')?.value).toBe('Tren superior');
    expect(pagina.querySelectorAll('fieldset')).toHaveLength(2);
    boton('Quitar').click();
    await fixture.whenStable();

    cambiar('[formControlName="nombre"]', 'Pecho');
    await enviar();
    expect(pagina.textContent).toContain('Rutina actualizada.');
    const guardadas = JSON.parse(localStorage.getItem('fitwork_rutinas:usuario-prueba')!);
    expect(guardadas).toHaveLength(1);
    expect(guardadas[0]).toMatchObject({
      nombre: 'Pecho',
      ejercicios: [{ ejercicioId: 'remo-mancuerna', series: 4, repeticiones: 10 }],
    });

    fixture.destroy();
    TestBed.resetTestingModule();
    const recarga = crearEntrenamientos();
    await recarga.whenStable();
    const recargada: HTMLElement = recarga.nativeElement;
    expect(recargada.querySelector('app-rutina-tarjeta h2')?.textContent).toBe('Pecho');
  });
});

function crearEntrenamientos() {
  TestBed.configureTestingModule({
    providers: [{ provide: AuthService, useValue: { currentUser: () => ({ id: 'usuario-prueba' }) } }],
  });
  return TestBed.createComponent(Entrenamientos);
}
