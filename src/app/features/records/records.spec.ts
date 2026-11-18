import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SesionesService } from '../entrenamientos/sesiones.service';
import { SesionEntrenamiento } from '../entrenamientos/sesion';
import { calcularRecords } from './records-calculo';
import { Records } from './records';

function sesion(id: string, fecha: string, pesoKg: number | null, repeticiones: number): SesionEntrenamiento {
  return {
    id, fecha, rutinaId: 'rutina', nombreRutina: 'Pecho',
    ejercicios: [{ ejercicioId: 'press-banca', nombre: 'Press de banca', series: [{ pesoKg, repeticiones }] }],
  };
}

describe('Récords personales', () => {
  it('calcula las marcas por serie y conserva la fecha más antigua en empates', () => {
    const datos = [
      sesion('d', '2026-11-17', 50, 8),
      sesion('a', '2026-11-10', null, 15),
      sesion('c', '2026-11-15', 50, 6),
      sesion('b', '2026-11-12', 40, 15),
    ];
    const [record] = calcularRecords(datos);
    expect(record.mayorPeso).toMatchObject({ pesoKg: 50, repeticiones: 6, fecha: '2026-11-15' });
    expect(record.masRepeticiones).toMatchObject({ pesoKg: null, repeticiones: 15, fecha: '2026-11-10' });
    expect(calcularRecords([sesion('x', '2026-11-17', null, 12)])[0].mayorPeso).toBeNull();
    expect(calcularRecords([sesion('x', '2026-11-17', 0, 12)])[0].mayorPeso?.pesoKg).toBe(0);
    expect(datos.map(item => item.id)).toEqual(['d', 'a', 'c', 'b']);
  });

  it('muestra las marcas de la cuenta activa y se actualiza al registrar otra sesión', async () => {
    const usuario = signal<{ id: string } | null>({ id: 'ana-records' });
    localStorage.setItem('fitwork_sesiones:ana-records', JSON.stringify([sesion('a', '2026-11-10', 40, 8)]));
    localStorage.removeItem('fitwork_sesiones:beto-records');
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { currentUser: usuario } }],
    });
    const fixture = TestBed.createComponent(Records);
    try {
      await fixture.whenStable();
      const pagina: HTMLElement = fixture.nativeElement;
      expect(pagina.querySelector('app-record-tarjeta')?.textContent).toContain('40 kg');
      const servicio = TestBed.inject(SesionesService);
      servicio.registrar(sesion('b', '2026-11-17', 45, 10));
      await fixture.whenStable();
      expect(pagina.querySelector('app-record-tarjeta')?.textContent).toContain('45 kg');
      expect(pagina.querySelector('app-record-tarjeta')?.textContent).toContain('17/11/2026');

      const buscar = pagina.querySelector<HTMLInputElement>('input')!;
      buscar.value = 'no existe';
      buscar.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      expect(pagina.textContent).toContain('No encontramos ejercicios');
      pagina.querySelector<HTMLButtonElement>('button')!.click();
      await fixture.whenStable();
      expect(pagina.querySelectorAll('app-record-tarjeta')).toHaveLength(1);

      usuario.set({ id: 'beto-records' });
      await fixture.whenStable();
      expect(pagina.textContent).toContain('Aún no tienes marcas registradas');
      expect(pagina.querySelector('app-record-tarjeta')).toBeNull();

      usuario.set({ id: 'ana-records' });
      await fixture.whenStable();
      expect(pagina.querySelector('app-record-tarjeta')?.textContent).toContain('45 kg');
      usuario.set(null);
      await fixture.whenStable();
      expect(pagina.querySelector('app-record-tarjeta')).toBeNull();
    } finally {
      fixture.destroy();
      localStorage.removeItem('fitwork_sesiones:ana-records');
      localStorage.removeItem('fitwork_sesiones:beto-records');
    }
  });
});
