import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Revisa las respuestas con error de todas las peticiones HTTP.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 = el token ya no es válido: se cierra la sesión
      if (error.status === 401) {
        auth.logout();
      }
      // Se reenvía el error para que quien hizo la petición lo maneje
      return throwError(() => error);
    }),
  );
};