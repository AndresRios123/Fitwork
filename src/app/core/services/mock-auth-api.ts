import { Injectable } from '@angular/core';
import { Usuario } from '../models/user.model';
import { AuthApi, DatosRegistro, RespuestaAuth } from './auth-api';

// Cómo se guarda un usuario en el "servidor falso": nunca la contraseña,
// solo su hash (huella irreversible) y la sal usada para calcularlo.
interface UsuarioGuardado extends Usuario {
  passwordHash: string;
  sal: string;
}

const CLAVE_USUARIOS = 'fitwork_usuarios';

// Backend SIMULADO mientras no exista una API real.
// Guarda las cuentas en localStorage. No es seguridad real (todo está en el
// navegador); en el backend de verdad el hash se hace en el servidor.
@Injectable()
export class MockAuthApi extends AuthApi {
  async login(email: string, password: string): Promise<RespuestaAuth> {
    await esperar(600); // simula la demora de la red

    const guardado = this.leerUsuarios().find(u => u.email === email.toLowerCase());
    if (!guardado || (await calcularHash(password, guardado.sal)) !== guardado.passwordHash) {
      // Mismo mensaje en ambos casos para no revelar qué correos existen
      throw new Error('Correo o contraseña incorrectos');
    }

    return { token: crypto.randomUUID(), usuario: quitarSecretos(guardado) };
  }

  async register(datos: DatosRegistro): Promise<RespuestaAuth> {
    await esperar(600);

    const usuarios = this.leerUsuarios();
    const email = datos.email.toLowerCase();
    if (usuarios.some(u => u.email === email)) {
      throw new Error('Ya existe una cuenta con ese correo');
    }

    const sal = crypto.randomUUID();
    const nuevo: UsuarioGuardado = {
      id: crypto.randomUUID(),
      nombre: datos.nombre,
      email,
      nivel: 'Principiante',
      sal,
      passwordHash: await calcularHash(datos.password, sal),
    };
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify([...usuarios, nuevo]));

    return { token: crypto.randomUUID(), usuario: quitarSecretos(nuevo) };
  }

  private leerUsuarios(): UsuarioGuardado[] {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_USUARIOS) ?? '[]');
    } catch {
      return []; // si el dato está dañado, se ignora
    }
  }
}

// Convierte "sal + contraseña" en un texto SHA-256 irreversible.
async function calcularHash(password: string, sal: string): Promise<string> {
  const bytes = new TextEncoder().encode(sal + password);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

// Devuelve el usuario sin el hash ni la sal.
function quitarSecretos({ passwordHash, sal, ...usuario }: UsuarioGuardado): Usuario {
  return usuario;
}

function esperar(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}