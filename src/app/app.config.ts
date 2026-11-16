import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthApi } from './core/services/auth-api';
import { MockAuthApi } from './core/services/mock-auth-api';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    // Cliente HTTP con los interceptores (token y manejo de errores)
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    // Hoy: autenticación simulada. Con backend real: useClass: HttpAuthApi
    { provide: AuthApi, useClass: MockAuthApi },
  ],
};