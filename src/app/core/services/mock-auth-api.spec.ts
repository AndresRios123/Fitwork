import { DatosPerfil } from '../models/user.model';
import { MockAuthApi } from './mock-auth-api';

describe('MockAuthApi.actualizarPerfil', () => {
  const api = new MockAuthApi();
  const PERFIL: DatosPerfil = {
    nombre: 'Ana María',
    nivel: 'Avanzado',
    avatar: 'data:image/jpeg;base64,FOTO',
    pesoKg: 61.5,
    estaturaCm: 166,
    edad: 29,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['setTimeout'] });
  });
  afterEach(() => vi.useRealTimers());

  async function resolver<T>(promesa: Promise<T>): Promise<T> {
    await vi.runAllTimersAsync();
    return promesa;
  }

  it('guarda los datos del perfil y se mantienen al volver a iniciar sesión', async () => {
    const { usuario } = await resolver(api.register({ nombre: 'Ana', email: 'ana@correo.com', password: 'secreta123' }));

    const actualizado = await resolver(api.actualizarPerfil(usuario.id, PERFIL));
    expect(actualizado).toMatchObject({ ...PERFIL, email: 'ana@correo.com' });
    expect(actualizado).not.toHaveProperty('passwordHash');

    const sesion = await resolver(api.login('ana@correo.com', 'secreta123'));
    expect(sesion.usuario).toMatchObject(PERFIL);
  });

  it('quitar la foto la elimina del usuario guardado', async () => {
    const { usuario } = await resolver(api.register({ nombre: 'Ana', email: 'ana@correo.com', password: 'secreta123' }));
    await resolver(api.actualizarPerfil(usuario.id, PERFIL));

    const sinFoto = await resolver(api.actualizarPerfil(usuario.id, { ...PERFIL, avatar: null }));
    expect(sinFoto).not.toHaveProperty('avatar');
    expect(localStorage.getItem('fitwork_usuarios')).not.toContain('FOTO');
  });

  it('falla si la cuenta no existe', async () => {
    const promesa = api.actualizarPerfil('no-existe', PERFIL);
    const resultado = expect(promesa).rejects.toThrow('No se encontró la cuenta');
    await vi.runAllTimersAsync();
    await resultado;
  });
});
