import { TestBed } from '@angular/core/testing';
import { Ejercicios } from './ejercicios';

describe('Ejercicios', () => {
  it('combina filtros, muestra el estado vacío y permite recuperar el catálogo', async () => {
    const fixture = TestBed.createComponent(Ejercicios);
    await fixture.whenStable();

    const pagina: HTMLElement = fixture.nativeElement;
    const busqueda = pagina.querySelector<HTMLInputElement>('input[type="search"]')!;
    const grupo = pagina.querySelector<HTMLSelectElement>('select[formControlName="grupo"]')!;
    const equipo = pagina.querySelector<HTMLSelectElement>('select[formControlName="equipo"]')!;
    const limpiar = pagina.querySelector<HTMLButtonElement>('button')!;
    const nombres = () => Array.from(
      pagina.querySelectorAll('app-ejercicio-tarjeta h2'),
      titulo => titulo.textContent,
    );
    const totalInicial = nombres().length;
    expect(totalInicial).toBeGreaterThan(1);
    expect(limpiar.disabled).toBe(true);

    busqueda.value = '  BICEPS  ';
    busqueda.dispatchEvent(new Event('input'));
    grupo.value = 'Brazos';
    grupo.dispatchEvent(new Event('change'));
    equipo.value = 'Mancuernas';
    equipo.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(nombres()).toEqual(['Curl de bíceps']);
    expect(limpiar.disabled).toBe(false);

    equipo.value = 'Polea';
    equipo.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(nombres()).toEqual([]);
    expect(pagina.querySelector('.vacio')?.textContent).toContain('No encontramos ejercicios');

    limpiar.click();
    await fixture.whenStable();

    expect(nombres()).toHaveLength(totalInicial);
    expect(busqueda.value).toBe('');
    expect(grupo.value).toBe('');
    expect(equipo.value).toBe('');
    expect(limpiar.disabled).toBe(true);
  });
});
