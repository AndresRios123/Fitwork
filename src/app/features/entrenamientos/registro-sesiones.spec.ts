import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/services/auth.service';
import { Entrenamientos } from './entrenamientos';

describe('Registro de sesiones en Entrenamientos', () => {
  const claveRutinas = 'fitwork_rutinas:usuario-prueba';
  const claveSesiones = 'fitwork_sesiones:usuario-prueba';

  beforeEach(() => {
    localStorage.removeItem(claveSesiones);
    localStorage.setItem(claveRutinas, JSON.stringify([{
      id: 'rutina-1',
      nombre: 'Pecho',
      ejercicios: [
        { ejercicioId: 'press-banca', series: 3, repeticiones: 10 },
        { ejercicioId: 'flexiones', series: 2, repeticiones: 12 },
      ],
    }]));
  });

  afterEach(() => {
    localStorage.removeItem(claveRutinas);
    localStorage.removeItem(claveSesiones);
  });

  it('guarda las series realizadas, muestra el historial y lo recupera al recargar', async () => {
    const fixture = crearEntrenamientos();
    await fixture.whenStable();
    const ventana: HTMLElement = fixture.nativeElement;
    const pagina = ventana.querySelector('app-registro-sesiones')!;

    const boton = (texto: string) => Array.from(pagina.querySelectorAll('button'))
      .find(elemento => elemento.textContent.trim() === texto)!;

    function cambiar(selector: string, valor: string, evento = 'input') {
      const campo = pagina.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
      campo.value = valor;
      campo.dispatchEvent(new Event(evento, { bubbles: true }));
    }

    function enviar() {
      pagina.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      return fixture.whenStable();
    }

    expect(pagina.textContent).toContain('Todavía no hay sesiones registradas.');
    boton('Registrar sesión').click();
    await fixture.whenStable();
    cambiar('select', 'rutina-1', 'change');
    cambiar('input[type="date"]', '2026-11-14');
    await enviar();
    expect(pagina.textContent).toContain('Agrega al menos una serie realizada.');

    boton('Agregar serie').click();
    await fixture.whenStable();
    cambiar('[formControlName="repeticiones"]', '4.5');
    await enviar();
    expect(pagina.textContent).toContain('Revisa la fecha');
    expect(localStorage.getItem(claveSesiones)).toBeNull();

    cambiar('[formControlName="repeticiones"]', '8');
    cambiar('[formControlName="pesoKg"]', '42.5');
    boton('Agregar serie').click();
    await fixture.whenStable();
    await enviar();

    expect(pagina.textContent).toContain('Sesión guardada.');
    expect(pagina.querySelector('summary')?.textContent).toContain('14/11/2026');
    expect(pagina.querySelector('details')?.textContent).toContain('42.5 kg');
    const guardadas = JSON.parse(localStorage.getItem(claveSesiones)!);
    expect(guardadas).toHaveLength(1);
    expect(guardadas[0]).toMatchObject({
      rutinaId: 'rutina-1',
      nombreRutina: 'Pecho',
      fecha: '2026-11-14',
      ejercicios: [{
        ejercicioId: 'press-banca',
        nombre: 'Press de banca',
        series: [{ repeticiones: 8, pesoKg: 42.5 }, { repeticiones: 10, pesoKg: null }],
      }],
    });

    fixture.destroy();
    TestBed.resetTestingModule();
    localStorage.removeItem(claveRutinas);
    const recarga = crearEntrenamientos();
    await recarga.whenStable();
    const recargada: HTMLElement = recarga.nativeElement;
    expect(recargada.querySelector('details')?.textContent).toContain('Press de banca');
  });

  it('abre el registro con la rutina indicada en ?rutina= (desde el panel)', async () => {
    const fixture = crearEntrenamientos();
    fixture.componentRef.setInput('rutina', 'rutina-1');
    await fixture.whenStable();
    const pagina = (fixture.nativeElement as HTMLElement).querySelector('app-registro-sesiones')!;

    expect(pagina.querySelector('form')).not.toBeNull();
    expect(pagina.querySelector<HTMLSelectElement>('select')?.value).toBe('rutina-1');
    expect(pagina.querySelectorAll('fieldset')).toHaveLength(2);
  });

  it('ignora una rutina que no existe en la cuenta', async () => {
    const fixture = crearEntrenamientos();
    fixture.componentRef.setInput('rutina', 'no-existe');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-registro-sesiones form')).toBeNull();
  });
});

function crearEntrenamientos() {
  TestBed.configureTestingModule({
    providers: [{ provide: AuthService, useValue: { currentUser: () => ({ id: 'usuario-prueba' }) } }],
  });
  return TestBed.createComponent(Entrenamientos);
}
