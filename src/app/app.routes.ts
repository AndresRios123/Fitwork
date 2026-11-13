import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';

// Lista de URLs de la app y qué componente se muestra en cada una.
export const routes: Routes = [
  {
    // El Shell (sidebar + topbar) envuelve a todas las páginas privadas.
    path: '',
    component: Shell,
    children: [
      // Si entran a "/", los mandamos al panel.
      { path: '', redirectTo: 'panel', pathMatch: 'full' },

      // Cada página se carga solo cuando se visita (loadComponent = carga diferida).
      // "titulo" es el texto que muestra el breadcrumb del topbar.
      { path: 'panel', data: { titulo: 'Panel principal' }, loadComponent: () => import('./features/panel/panel').then(m => m.Panel) },
      { path: 'entrenamientos', data: { titulo: 'Entrenamientos' }, loadComponent: () => import('./features/entrenamientos/entrenamientos').then(m => m.Entrenamientos) },
      { path: 'ejercicios', data: { titulo: 'Ejercicios' }, loadComponent: () => import('./features/ejercicios/ejercicios').then(m => m.Ejercicios) },
      { path: 'progreso', data: { titulo: 'Progreso' }, loadComponent: () => import('./features/progreso/progreso').then(m => m.Progreso) },
      { path: 'cardio', data: { titulo: 'Cardio' }, loadComponent: () => import('./features/cardio/cardio').then(m => m.Cardio) },
      { path: 'records', data: { titulo: 'Récords personales' }, loadComponent: () => import('./features/records/records').then(m => m.Records) },
      { path: 'objetivos', data: { titulo: 'Objetivos' }, loadComponent: () => import('./features/objetivos/objetivos').then(m => m.Objetivos) },
      { path: 'perfil', data: { titulo: 'Perfil' }, loadComponent: () => import('./features/perfil/perfil').then(m => m.Perfil) },
      { path: 'configuracion', data: { titulo: 'Configuración' }, loadComponent: () => import('./features/configuracion/configuracion').then(m => m.Configuracion) },
      { path: 'ayuda', data: { titulo: 'Ayuda y soporte' }, loadComponent: () => import('./features/ayuda/ayuda').then(m => m.Ayuda) },
    ],
  },
  // Cualquier URL que no exista también redirige al panel.
  { path: '**', redirectTo: 'panel' },
];