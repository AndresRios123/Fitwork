import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthApi } from './core/services/auth-api';
import { MockAuthApi } from './core/services/mock-auth-api';
import { DashboardApi } from './core/services/dashboard-api';
import { LocalDashboardApi } from './features/dashboard/datos/local-dashboard-api';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: los parámetros de la URL llegan como input()
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(),
    // Cliente HTTP con los interceptores (token y manejo de errores)
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    // Hoy: autenticación simulada. Con backend real: useClass: HttpAuthApi
    { provide: AuthApi, useClass: MockAuthApi },
    // Datos del panel calculados con lo que guardó el usuario.
    // Para datos de demostración: useClass: MockDashboardApi. Con backend: HttpDashboardApi
    { provide: DashboardApi, useClass: LocalDashboardApi },
  ],
};