import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DatosPerfil, Usuario } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { ProcesadorImagen } from '../../core/services/procesador-imagen';
import { calcularImc } from './imc';
import { Perfil } from './perfil';

const USUARIO: Usuario = {
  id: 'u1',
  nombre: 'Ana Gómez',
  email: 'ana@correo.com',
  nivel: 'Intermedio',
  pesoKg: 60,
  estaturaCm: 165,
  edad: 28,
};

describe('Perfil', () => {
  let usuario: ReturnType<typeof signal<Usuario>>;
  let actualizarPerfil: ReturnType<typeof vi.fn<(datos: DatosPerfil) => Promise<void>>>;
  let crearAvatar: ReturnType<typeof vi.fn<(archivo: File) => Promise<string>>>;

  beforeEach(() => {
    usuario = signal(USUARIO);
    actualizarPerfil = vi.fn(async (datos: DatosPerfil) => {
      usuario.update(actual => ({ ...actual, ...datos, avatar: datos.avatar ?? undefined }));
    });
    crearAvatar = vi.fn().mockResolvedValue('data:image/jpeg;base64,FOTO');
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { currentUser: usuario.asReadonly(), estaAutenticado: () => true, actualizarPerfil } },
        { provide: ProcesadorImagen, useValue: { crearAvatar } },
      ],
    });
  });

  async function crear() {
    const fixture = TestBed.createComponent(Perfil);
    await fixture.whenStable();
    const pagina: HTMLElement = fixture.nativeElement;
    const campo = (nombre: string) => pagina.querySelector<HTMLInputElement>(`[formControlName="${nombre}"]`)!;
    const escribir = async (nombre: string, valor: string) => {
      campo(nombre).value = valor;
      campo(nombre).dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const boton = (texto: string) => Array.from(pagina.querySelectorAll('button'))
      .find(b => b.textContent.trim().startsWith(texto))!;
    const enviar = async () => {
      pagina.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return { fixture, pagina, campo, escribir, boton, enviar, componente: fixture.componentInstance };
  }

  it('carga los datos guardados y calcula el IMC', async () => {
    const { pagina, campo } = await crear();

    expect(campo('nombre').value).toBe('Ana Gómez');
    expect(campo('pesoKg').value).toBe('60');
    expect(campo('estaturaCm').value).toBe('165');
    expect(pagina.querySelector<HTMLSelectElement>('[formControlName="nivel"]')?.value).toBe('Intermedio');
    expect(pagina.querySelector('.imc')?.textContent).toContain('22');
    expect(pagina.querySelector('.imc')?.textContent).toContain('Normal');
    expect(pagina.querySelector('.foto')?.textContent).toContain('AG');
  });

  it('no guarda si hay datos inválidos y muestra el error del campo', async () => {
    const { pagina, escribir, enviar } = await crear();
    await escribir('pesoKg', '500');
    await enviar();

    expect(pagina.textContent).toContain('Entre 20 y 300 kg.');
    expect(actualizarPerfil).not.toHaveBeenCalled();
  });

  it('guarda los cambios y avisa que se actualizó', async () => {
    const { pagina, escribir, enviar, componente } = await crear();
    await escribir('nombre', '  Ana María Gómez ');
    await escribir('pesoKg', '62.5');
    expect(componente.tieneCambiosSinGuardar()).toBe(true);

    await enviar();

    expect(actualizarPerfil).toHaveBeenCalledWith({
      nombre: 'Ana María Gómez',
      nivel: 'Intermedio',
      pesoKg: 62.5,
      estaturaCm: 165,
      edad: 28,
      avatar: null,
    });
    expect(pagina.textContent).toContain('Perfil actualizado.');
    expect(componente.tieneCambiosSinGuardar()).toBe(false);
  });

  it('muestra el error si no se pudo guardar', async () => {
    actualizarPerfil.mockRejectedValueOnce(new Error('Sin conexión'));
    const { pagina, escribir, enviar } = await crear();
    await escribir('nombre', 'Ana');
    await enviar();

    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain('Sin conexión');
  });

  it('cambia y quita la foto de perfil', async () => {
    const { fixture, pagina, boton, enviar } = await crear();
    const archivo = new File(['x'], 'foto.png', { type: 'image/png' });
    const selector = pagina.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(selector, 'files', { value: [archivo] });
    selector.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(crearAvatar).toHaveBeenCalledWith(archivo);
    expect(pagina.querySelector<HTMLImageElement>('.foto img')?.src).toContain('FOTO');

    await enviar();
    expect(actualizarPerfil).toHaveBeenLastCalledWith(expect.objectContaining({ avatar: 'data:image/jpeg;base64,FOTO' }));

    boton('Quitar').click();
    await fixture.whenStable();
    expect(pagina.querySelector('.foto img')).toBeNull();
  });

  it('muestra el motivo si la imagen no sirve', async () => {
    crearAvatar.mockRejectedValueOnce(new Error('La imagen no puede pesar más de 5 MB.'));
    const { fixture, pagina } = await crear();
    const selector = pagina.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(selector, 'files', { value: [new File(['x'], 'grande.png', { type: 'image/png' })] });
    selector.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(pagina.querySelector('app-avatar-editor')?.textContent).toContain('5 MB');
  });

  it('"Descartar cambios" vuelve a los datos guardados', async () => {
    const { campo, escribir, boton, componente, fixture } = await crear();
    await escribir('nombre', 'Otro nombre');
    boton('Descartar').click();
    await fixture.whenStable();

    expect(campo('nombre').value).toBe('Ana Gómez');
    expect(componente.tieneCambiosSinGuardar()).toBe(false);
  });
});

describe('calcularImc', () => {
  it.each([
    [50, 170, 17.3, 'Bajo peso'],
    [65, 170, 22.5, 'Normal'],
    [80, 170, 27.7, 'Sobrepeso'],
    [100, 170, 34.6, 'Obesidad'],
  ] as const)('%i kg y %i cm -> %d (%s)', (peso, estatura, valor, categoria) => {
    expect(calcularImc(peso, estatura)).toEqual({ valor, categoria });
  });

  it('devuelve null si falta el peso o la estatura', () => {
    expect(calcularImc(null, 170)).toBeNull();
    expect(calcularImc(70, undefined)).toBeNull();
  });
});
