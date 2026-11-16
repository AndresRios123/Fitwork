import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthApi, RespuestaAuth } from './auth-api';
import { AuthService } from './auth.service';

// Respuesta de ejemplo que devuelve el "servidor" falso de las pruebas
const RESPUESTA: RespuestaAuth = {
  token: 'token-de-prueba',
  usuario: { id: '1', nombre: 'Ana Gómez', email: 'ana@correo.com', nivel: 'Principiante' },
};

describe('AuthService', () => {
  // API falsa: así probamos el servicio sin depender de MockAuthApi
  let api: { login: ReturnType<typeof vi.fn>; register: ReturnType<typeof vi.fn> };

  // Crea el servicio con la API falsa (se llama dentro de cada prueba)
  function crearServicio(): AuthService {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthApi, useValue: api }],
    });
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    localStorage.clear();
    api = {
      login: vi.fn().mockResolvedValue(RESPUESTA),
      register: vi.fn().mockResolvedValue(RESPUESTA),
    };
  });

  it('empieza sin sesión', () => {
    const auth = crearServicio();
    expect(auth.currentUser()).toBeNull();
    expect(auth.estaAutenticado()).toBe(false);
  });

  it('login guarda el usuario y el token', async () => {
    const auth = crearServicio();
    await auth.login('ana@correo.com', 'secreta123');

    expect(api.login).toHaveBeenCalledWith('ana@correo.com', 'secreta123');
    expect(auth.currentUser()?.nombre).toBe('Ana Gómez');
    expect(auth.token()).toBe('token-de-prueba');
  });

  it('guarda la sesión en localStorage sin la contraseña', async () => {
    const auth = crearServicio();
    await auth.login('ana@correo.com', 'secreta123');

    const guardado = localStorage.getItem('fitwork_sesion') ?? '';
    expect(guardado).toContain('ana@correo.com');
    expect(guardado).not.toContain('secreta123');
  });

  it('register también inicia sesión', async () => {
    const auth = crearServicio();
    await auth.register({ nombre: 'Ana Gómez', email: 'ana@correo.com', password: 'secreta123' });

    expect(auth.estaAutenticado()).toBe(true);
  });

  it('si el login falla, no hay sesión y el error llega al componente', async () => {
    api.login.mockRejectedValue(new Error('Correo o contraseña incorrectos'));
    const auth = crearServicio();

    await expect(auth.login('ana@correo.com', 'mala')).rejects.toThrow('Correo o contraseña incorrectos');
    expect(auth.estaAutenticado()).toBe(false);
  });

  it('recupera la sesión guardada al recargar la página', () => {
    localStorage.setItem('fitwork_sesion', JSON.stringify(RESPUESTA));
    const auth = crearServicio();

    expect(auth.currentUser()?.email).toBe('ana@correo.com');
  });

  it('no se rompe si localStorage tiene un JSON dañado', () => {
    localStorage.setItem('fitwork_sesion', '{esto no es json');
    const auth = crearServicio();

    expect(auth.currentUser()).toBeNull();
    expect(localStorage.getItem('fitwork_sesion')).toBeNull();
  });

  it('logout borra la sesión y manda al login', async () => {
    const auth = crearServicio();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await auth.login('ana@correo.com', 'secreta123');

    auth.logout();

    expect(auth.currentUser()).toBeNull();
    expect(localStorage.getItem('fitwork_sesion')).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });
});