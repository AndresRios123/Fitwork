import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // La sesión vive en localStorage (solo existe en el navegador),
    // así que las páginas se dibujan en el cliente y no en el servidor.
    path: '**',
    renderMode: RenderMode.Client,
  },
];
