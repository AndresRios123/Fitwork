import { Usuario } from '../models/user.model';

// Lo que responde el "servidor" al iniciar sesión o registrarse.
export interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}

// Datos que pide el formulario de registro.
export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
}

// "Contrato" que debe cumplir cualquier forma de autenticar.
// Hoy lo cumple MockAuthApi (simulado); cuando haya backend se crea
// HttpAuthApi y solo se cambia una línea en app.config.ts.
export abstract class AuthApi {
  abstract login(email: string, password: string): Promise<RespuestaAuth>;
  abstract register(datos: DatosRegistro): Promise<RespuestaAuth>;
}